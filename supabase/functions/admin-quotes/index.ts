// Admin-only endpoint for quote_requests (the site's price "bookings"), the
// linked projects (pricing), and the quote_events audit timeline.
//
// quote_requests, projects and quote_events hold PII / money data and have NO
// Data API policy — they are intentionally unreachable via PostgREST. All admin
// reads/writes go through this function so exposure stays confined to an
// explicit, paginated, audited contract rather than a raw `select=*`.
//
// Auth: caller must send a logged-in user's `Authorization: Bearer <jwt>`.
// requireAdmin verifies the JWT and checks public.is_admin(). Platform default
// verify_jwt=true also rejects unauthenticated calls at the gateway.
//
// Pipeline: new ("to be viewed") → accepted (after the phone call) →
// completed ("finished"), with accepted <-> completed reversible (undo a
// mis-click). There is no "cancelled" status — an unwanted inquiry is
// hard-deleted instead (quote_events and its project row cascade with it).
// Accepting an inquiry auto-creates its project row. The price is an
// attribute settable any time once accepted (or completed), but finishing
// (-> completed) is now gated on a price already being set — the admin UI
// presents this as a 3-stage funnel (accept -> set price -> finish) even
// though price itself is not a stored status. Every status/price/note/assign
// mutation appends a quote_events row with the caller's verified identity.
//
// Actions (POST JSON body):
//   { action: "overview", limit?<=200 }        -> { ok, stats, rows, total }  (rows include price_amount)
//   { action: "stats" }                        -> { ok, total, <status counts> }
//   { action: "list", status?, q?, limit?<=200, offset? } -> { ok, rows, total }  (rows include price_amount)
//   { action: "detail", id }                   -> { ok, row, project, events, related }
//   { action: "attachmentUrls", id }           -> { ok, attachments: [{path, url, name}] }
//     (signed URLs into the private `quote-attachments` bucket, 10 min expiry)
//   { action: "setStatus", id, status }        -> { ok }   (transition-validated)
//   { action: "setPrice", id, amount, currency: "UZS"|"USD" } -> { ok }
//   { action: "journalOverview", limit?<=200 } -> { ok, stats, rows, total }
//     (Journal: project-stage view of every inquiry that has been accepted at
//     least once — one row per project, joined with its inquiry's contact data)
//   { action: "createManualProject", name, phone, email?, productName?, quantity?,
//     address?, note?, source?, priceAmount?, priceCurrency?: "UZS"|"USD", deadline?: "YYYY-MM-DD" }
//     -> { ok, id }
//     (Journal: log a lead sourced from another platform straight into the
//     project stage — inserts the inquiry as already "accepted" plus its
//     project row, so it shows up in the Journal immediately, no intake step)
//   { action: "setProjectDeadline", id, deadline: "YYYY-MM-DD"|null } -> { ok }
//   { action: "setProjectStatus", id, status: "in_progress"|"cancelled" } -> { ok }
//     (project stage; "completed" is only ever set via setStatus/bulkStatus)
//   { action: "addNote", id, body }            -> { ok, event }
//   { action: "assign", id, adminId|null }     -> { ok, assignedEmail }
//   { action: "listAdmins" }                   -> { ok, admins: [{id,email}] }
//   { action: "bulkStatus", ids[<=50], status }-> { ok, done, skipped }
//   { action: "deleteQuote", id }              -> { ok }   (hard delete, cascades)
//   { action: "analytics", granularity?: "day"|"week"|"month"|"year", days? } -> { ok, ...aggregates }
//     (days defaults by granularity: day=30, week=90, month=365, year=730; clamped to 1095)
//   { action: "exportCsv", status? }           -> { ok, csv }
//   { action: "recentEvents", limit?<=50 }     -> { ok, events }  (cross-quote activity feed, for the Overview tab)
//
// Deploy: `supabase functions deploy admin-quotes`.

import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin, serviceClient, type AdminUser } from "../_shared/admin.ts";

const LIST_COLUMNS =
  "id, product_id, product_name, name, phone, email, quantity, address, note, lang, source, status, assigned_to, assigned_email, created_at";

// Second, explicit query merged by quote_id — avoids relying on PostgREST's
// ambiguous to-one vs to-many embed inference for the quote_requests<->projects
// relationship. Used by overview/list so the client can tell "accepted, no
// price yet" from "accepted, priced" without a second round trip per row.
// Includes price_currency (not just the amount) so the list can render a
// formatted price label (e.g. "1 200 000 UZS"), not just a bare number.
async function attachPrices<T extends { id: string }>(db: Db, rows: T[]) {
  if (rows.length === 0) {
    return rows as (T & { price_amount: number | null; price_currency: string | null })[];
  }
  const ids = rows.map((r) => r.id);
  const { data: projects, error } = await db
    .from("projects")
    .select("quote_id, price_amount, price_currency")
    .in("quote_id", ids);
  if (error) throw error;
  const byId = new Map(
    (projects ?? []).map((
      p: { quote_id: string; price_amount: number | null; price_currency: string | null },
    ) => [p.quote_id, { price_amount: p.price_amount, price_currency: p.price_currency }]),
  );
  return rows.map((r) => ({
    ...r,
    price_amount: byId.get(r.id)?.price_amount ?? null,
    price_currency: byId.get(r.id)?.price_currency ?? null,
  }));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES = ["new", "accepted", "completed"] as const;
type Status = (typeof STATUSES)[number];

// The Journal's project stage — independent of the inquiry's own `status`
// above. `completed` is only ever set by applyStatus() (mirroring the
// inquiry's finish/undo); this action only ever toggles in_progress<->cancelled.
const PROJECT_STATUSES = ["in_progress", "cancelled"] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number] | "completed";

// The state machine: forward new -> accepted -> completed, and either step
// back one (undo a mis-click). No direct new -> completed skip.
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  new: ["accepted"],
  accepted: ["new", "completed"],
  completed: ["accepted"],
};

type Db = ReturnType<typeof serviceClient>;

// Append one audit-trail row. Actor identity comes from the verified JWT.
async function logEvent(
  db: Db,
  quoteId: string,
  user: AdminUser,
  fields: {
    type: "status_change" | "price_set" | "note" | "assign" | "deadline_set" | "project_status_change";
    from_status?: string;
    to_status?: string;
    amount?: number;
    currency?: string;
    body?: string;
  },
) {
  const { error } = await db.from("quote_events").insert({
    quote_id: quoteId,
    actor_id: user.id,
    actor_email: user.email ?? null,
    ...fields,
  });
  if (error) throw error;
}

// Shared by setStatus and bulkStatus: validate the transition against the
// CURRENT status, apply it with an optimistic-concurrency guard, create the
// project on accept, and record the event. Returns an error string or null.
async function applyStatus(
  db: Db,
  user: AdminUser,
  id: string,
  status: Status,
): Promise<string | null> {
  const { data: row, error: readErr } = await db
    .from("quote_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!row) return "Not found";

  const from = row.status as Status;
  if (from === status) return "Already in that status";
  if (!VALID_TRANSITIONS[from]?.includes(status)) {
    return `Invalid transition ${from} -> ${status}`;
  }

  // The 3rd pipeline stage: finishing requires a price to already be set,
  // and the linked Journal project (if any) must not have been cancelled —
  // a cancelled project has to be reactivated first (mirrors the price gate:
  // real enforcement, not just a UI nicety).
  if (status === "completed") {
    const { data: proj, error: projReadErr } = await db
      .from("projects")
      .select("price_amount, status")
      .eq("quote_id", id)
      .maybeSingle();
    if (projReadErr) throw projReadErr;
    if (proj?.price_amount == null) {
      return "Set a price before finishing this inquiry";
    }
    if (proj?.status === "cancelled") {
      return "Reactivate the cancelled project before finishing this inquiry";
    }
  }

  // Guard on the status we read: if another admin changed it in between, this
  // matches zero rows and we report a conflict instead of skipping a step.
  const { data: updated, error: updErr } = await db
    .from("quote_requests")
    .update({ status })
    .eq("id", id)
    .eq("status", from)
    .select("id");
  if (updErr) throw updErr;
  if (!updated || updated.length === 0) return "Modified concurrently, refresh";

  // Accepting an inquiry creates its linked project (idempotent: quote_id is
  // unique, so re-accepting after an undo can't duplicate it).
  if (status === "accepted") {
    const { error: projErr } = await db
      .from("projects")
      .upsert({ quote_id: id }, { onConflict: "quote_id", ignoreDuplicates: true });
    if (projErr) throw projErr;
  }

  // Keep the Journal's project stage in lockstep with the inquiry pipeline:
  // finishing marks the project completed (finally writing completed_at,
  // defined on the table since day one but never set until now); undoing a
  // finish reopens it as in_progress. Cancellation is independent of this
  // pipeline (see the "setProjectStatus" action) and is never touched here.
  if (status === "completed") {
    const { error: projErr } = await db
      .from("projects")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("quote_id", id);
    if (projErr) throw projErr;
  } else if (status === "accepted" && from === "completed") {
    const { error: projErr } = await db
      .from("projects")
      .update({ status: "in_progress", completed_at: null })
      .eq("quote_id", id);
    if (projErr) throw projErr;
  }

  await logEvent(db, id, user, {
    type: "status_change",
    from_status: from,
    to_status: status,
  });
  return null;
}

// CSV cell: quote + escape quotes, and neutralize spreadsheet formula injection
// (a leading = + - @ would execute in Excel when the export is opened).
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replaceAll('"', '""')}"`;
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  // Admin gate (401 if not signed in, 403 if signed in but not an admin).
  const { user, response } = await requireAdmin(req);
  if (response) return response;
  if (!user) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid request" }, 400);
  }

  const action = String(body.action ?? "");
  const db = serviceClient();

  // Count rows for one status (head:true returns only the count, no rows).
  const countByStatus = (s: string) =>
    db.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", s);

  // All status counts in parallel.
  async function computeStats() {
    const results = await Promise.all(STATUSES.map((s) => countByStatus(s)));
    const counts: Record<string, number> = {};
    let total = 0;
    results.forEach((r, i) => {
      if (r.error) throw r.error;
      counts[STATUSES[i]] = r.count ?? 0;
      total += r.count ?? 0;
    });
    return { total, ...counts };
  }

  const clampLimit = (v: unknown, def: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), 200) : def;
  };

  try {
    if (action === "stats") {
      return jsonResponse({ ok: true, ...(await computeStats()) });
    }

    // Stats + first page in a single invocation (one network round trip).
    if (action === "overview") {
      const limit = clampLimit(body.limit, 100);
      const [stats, listRes] = await Promise.all([
        computeStats(),
        db.from("quote_requests")
          .select(LIST_COLUMNS, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(0, limit - 1),
      ]);
      if (listRes.error) throw listRes.error;
      const rows = await attachPrices(db, listRes.data ?? []);
      return jsonResponse({ ok: true, stats, rows, total: listRes.count ?? 0 });
    }

    if (action === "list") {
      const limit = clampLimit(body.limit, 50);
      const rawOffset = Number(body.offset);
      const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

      let query = db
        .from("quote_requests")
        .select(LIST_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const status = body.status;
      if (typeof status === "string" && (STATUSES as readonly string[]).includes(status)) {
        query = query.eq("status", status);
      }

      // Server-side search for datasets larger than the client's first page.
      const q = typeof body.q === "string" ? body.q.trim().slice(0, 120) : "";
      if (q) {
        // Escape PostgREST or-filter metacharacters, then match any field.
        const safe = q.replaceAll(/[%_,()]/g, " ").trim();
        if (safe) {
          query = query.or(
            `name.ilike.%${safe}%,phone.ilike.%${safe}%,product_name.ilike.%${safe}%,email.ilike.%${safe}%`,
          );
        }
      }

      const { data, count, error } = await query;
      if (error) throw error;
      const rows = await attachPrices(db, data ?? []);
      return jsonResponse({ ok: true, rows, total: count ?? 0 });
    }

    // Full record for the detail view: inquiry + project + audit timeline +
    // other inquiries from the same phone (repeat-customer visibility).
    if (action === "detail") {
      const id = String(body.id ?? "");
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);

      const { data: row, error: rowErr } = await db
        .from("quote_requests")
        .select(LIST_COLUMNS + ", phone_normalized, attachments_draft_id")
        .eq("id", id)
        .maybeSingle();
      if (rowErr) throw rowErr;
      if (!row) return jsonResponse({ ok: false, error: "Not found" }, 404);

      const [projectRes, eventsRes, relatedRes] = await Promise.all([
        db.from("projects").select("*").eq("quote_id", id).maybeSingle(),
        db.from("quote_events")
          .select("id, actor_email, type, from_status, to_status, amount, currency, body, created_at")
          .eq("quote_id", id)
          .order("created_at", { ascending: true })
          .limit(200),
        row.phone_normalized
          ? db.from("quote_requests")
            .select("id, name, product_name, status, created_at")
            .eq("phone_normalized", row.phone_normalized)
            .neq("id", id)
            .order("created_at", { ascending: false })
            .limit(10)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (projectRes.error) throw projectRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (relatedRes.error) throw relatedRes.error;

      const { phone_normalized: _pn, ...publicRow } = row;
      return jsonResponse({
        ok: true,
        row: publicRow,
        project: projectRes.data ?? null,
        events: eventsRes.data ?? [],
        related: relatedRes.data ?? [],
      });
    }

    // Signed URLs for a quote's uploaded photos/videos. The `quote-attachments`
    // bucket is private (no anon or public read), so viewing them requires the
    // service role to list the draft's folder and mint short-lived signed URLs.
    if (action === "attachmentUrls") {
      const id = String(body.id ?? "");
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);

      const { data: row, error: rowErr } = await db
        .from("quote_requests")
        .select("attachments_draft_id")
        .eq("id", id)
        .maybeSingle();
      if (rowErr) throw rowErr;
      if (!row) return jsonResponse({ ok: false, error: "Not found" }, 404);

      const draftId = row.attachments_draft_id as string | null;
      if (!draftId) return jsonResponse({ ok: true, attachments: [] });

      const { data: files, error: listErr } = await db.storage
        .from("quote-attachments")
        .list(draftId, { limit: 20, sortBy: { column: "name", order: "asc" } });
      if (listErr) throw listErr;

      const paths = (files ?? []).map((f) => `${draftId}/${f.name}`);
      if (paths.length === 0) return jsonResponse({ ok: true, attachments: [] });

      const { data: signed, error: signErr } = await db.storage
        .from("quote-attachments")
        .createSignedUrls(paths, 600); // 10 min — viewed once per detail-modal open
      if (signErr) throw signErr;

      const attachments = (signed ?? [])
        .filter((s) => !s.error && s.signedUrl)
        .map((s, i) => ({ path: paths[i], url: s.signedUrl, name: (files ?? [])[i]?.name ?? "" }));
      return jsonResponse({ ok: true, attachments });
    }

    if (action === "setStatus") {
      const id = String(body.id ?? "");
      const status = String(body.status ?? "") as Status;
      if (!UUID_RE.test(id)) {
        return jsonResponse({ ok: false, error: "Invalid id" }, 400);
      }
      if (!STATUSES.includes(status)) {
        return jsonResponse({ ok: false, error: "Invalid status" }, 400);
      }
      const err = await applyStatus(db, user, id, status);
      if (err) return jsonResponse({ ok: false, error: err }, 400);
      return jsonResponse({ ok: true });
    }

    // The guarded money action: settable any time once the inquiry has been
    // accepted (after the phone call), including after it's completed — the
    // price lands on the project row and the audit trail records who set what,
    // when. Does NOT change status; pricing and pipeline stage are independent.
    if (action === "setPrice") {
      const id = String(body.id ?? "");
      const amount = Number(body.amount);
      const currency = String(body.currency ?? "");
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) {
        return jsonResponse({ ok: false, error: "Invalid amount" }, 400);
      }
      if (currency !== "UZS" && currency !== "USD") {
        return jsonResponse({ ok: false, error: "Invalid currency" }, 400);
      }

      const { data: row, error: readErr } = await db
        .from("quote_requests")
        .select("id, status")
        .eq("id", id)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!row) return jsonResponse({ ok: false, error: "Not found" }, 404);
      if (row.status === "new") {
        return jsonResponse({ ok: false, error: "Accept the inquiry before setting a price" }, 400);
      }

      // Round to 2 decimals to match numeric(14,2) instead of silently truncating.
      const priced = Math.round(amount * 100) / 100;

      // Upsert (not update): inquiries accepted before the projects feature
      // shipped have no project row yet.
      const { error: projErr } = await db.from("projects").upsert(
        {
          quote_id: id,
          price_amount: priced,
          price_currency: currency,
          priced_by: user.id,
          priced_by_email: user.email ?? null,
          priced_at: new Date().toISOString(),
        },
        { onConflict: "quote_id" },
      );
      if (projErr) throw projErr;

      await logEvent(db, id, user, {
        type: "price_set",
        amount: priced,
        currency,
      });
      return jsonResponse({ ok: true });
    }

    // Manually log a lead that arrived through another platform (Instagram,
    // Telegram, OLX, a phone call, …) straight into the Journal. Unlike the
    // public submit-quote flow, this inserts the inquiry already "accepted"
    // (with its project row created in the same breath) since the admin is
    // recording a real, already-confirmed piece of work, not an intake to
    // triage. Validation mirrors the quote_requests CHECK constraints and
    // submit-quote's own rules so this can't produce a row the public form
    // couldn't.
    if (action === "createManualProject") {
      const nullable = (v: unknown): string | null => {
        const s = String(v ?? "").trim();
        return s.length ? s : null;
      };

      const name = String(body.name ?? "").trim();
      const phone = String(body.phone ?? "").trim();
      if (name.length < 1 || name.length > 120) {
        return jsonResponse({ ok: false, error: "Invalid name" }, 400);
      }
      if (phone.length < 3 || phone.length > 40) {
        return jsonResponse({ ok: false, error: "Invalid phone" }, 400);
      }

      const email = nullable(body.email);
      const productName = nullable(body.productName);
      const quantity = nullable(body.quantity);
      const address = nullable(body.address);
      const note = nullable(body.note);
      const source = nullable(body.source);
      if (
        (email && email.length > 160) ||
        (quantity && quantity.length > 120) ||
        (address && address.length > 300) ||
        (note && note.length > 2000) ||
        (source && source.length > 120)
      ) {
        return jsonResponse({ ok: false, error: "Invalid input" }, 400);
      }

      let deadline: string | null = null;
      if (body.deadline != null && body.deadline !== "") {
        const raw = String(body.deadline);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          return jsonResponse({ ok: false, error: "Invalid deadline" }, 400);
        }
        deadline = raw;
      }

      let priceAmount: number | null = null;
      let priceCurrency: "UZS" | "USD" | null = null;
      if (body.priceAmount != null && body.priceAmount !== "") {
        const amt = Number(body.priceAmount);
        if (!Number.isFinite(amt) || amt <= 0 || amt > 1e12) {
          return jsonResponse({ ok: false, error: "Invalid amount" }, 400);
        }
        const cur = String(body.priceCurrency ?? "");
        if (cur !== "UZS" && cur !== "USD") {
          return jsonResponse({ ok: false, error: "Invalid currency" }, 400);
        }
        priceAmount = Math.round(amt * 100) / 100;
        priceCurrency = cur;
      }

      const { data: inserted, error: insErr } = await db
        .from("quote_requests")
        .insert({
          name,
          phone,
          email,
          product_name: productName,
          quantity,
          address,
          note,
          source,
          status: "accepted",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      const id = inserted.id as string;

      const { error: projErr } = await db.from("projects").insert({
        quote_id: id,
        deadline,
        price_amount: priceAmount,
        price_currency: priceCurrency,
        priced_by: priceAmount != null ? user.id : null,
        priced_by_email: priceAmount != null ? (user.email ?? null) : null,
        priced_at: priceAmount != null ? new Date().toISOString() : null,
      });
      if (projErr) throw projErr;

      await logEvent(db, id, user, { type: "status_change", to_status: "accepted" });
      if (priceAmount != null && priceCurrency != null) {
        await logEvent(db, id, user, { type: "price_set", amount: priceAmount, currency: priceCurrency });
      }
      if (deadline) {
        await logEvent(db, id, user, { type: "deadline_set", body: deadline });
      }

      return jsonResponse({ ok: true, id });
    }

    // Journal: overview of every project (i.e. every inquiry that has been
    // accepted at least once — a project only exists from that point on).
    // Stats are grouped by the project's own stage, not the inquiry's status.
    if (action === "journalOverview") {
      const limit = clampLimit(body.limit, 100);
      const PROJECT_STAGES = ["in_progress", "completed", "cancelled"] as const;

      // Same head:true count-per-status pattern as computeStats() above.
      const countByProjectStatus = (s: string) =>
        db.from("projects").select("id", { count: "exact", head: true }).eq("status", s);

      const [statsResults, listRes] = await Promise.all([
        Promise.all(PROJECT_STAGES.map((s) => countByProjectStatus(s))),
        db.from("projects")
          .select(
            "id, quote_id, price_amount, price_currency, deadline, status, completed_at, created_at, " +
              "quote_requests!inner(id, name, phone, email, product_name, quantity, assigned_email, status, created_at)",
            { count: "exact" },
          )
          .order("created_at", { ascending: false })
          .range(0, limit - 1),
      ]);
      if (listRes.error) throw listRes.error;

      const stats: Record<string, number> = { total: 0 };
      statsResults.forEach((r, i) => {
        if (r.error) throw r.error;
        stats[PROJECT_STAGES[i]] = r.count ?? 0;
        stats.total += r.count ?? 0;
      });

      // Flatten the embedded quote_requests row onto each project row so the
      // client gets one flat object per card, same shape style as attachPrices.
      const rows = (listRes.data ?? []).map((p: Record<string, unknown>) => {
        const { quote_requests: q, ...proj } = p as { quote_requests: Record<string, unknown> } & Record<
          string,
          unknown
        >;
        return { ...proj, ...q, project_id: proj.id, id: q.id };
      });

      return jsonResponse({ ok: true, stats, rows, total: listRes.count ?? 0 });
    }

    // Deadline for the linked project — settable/clearable any time a project
    // exists (i.e. once the inquiry has been accepted).
    if (action === "setProjectDeadline") {
      const id = String(body.id ?? "");
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);
      let deadline: string | null = null;
      if (body.deadline != null) {
        const raw = String(body.deadline);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          return jsonResponse({ ok: false, error: "Invalid deadline" }, 400);
        }
        deadline = raw;
      }

      const { data: updated, error: updErr } = await db
        .from("projects")
        .update({ deadline })
        .eq("quote_id", id)
        .select("id");
      if (updErr) throw updErr;
      if (!updated || updated.length === 0) return jsonResponse({ ok: false, error: "Not found" }, 404);

      await logEvent(db, id, user, { type: "deadline_set", body: deadline ?? "" });
      return jsonResponse({ ok: true });
    }

    // Journal stage: in_progress <-> cancelled only. `completed` is exclusively
    // driven by the inquiry pipeline's finish/undo (see applyStatus).
    if (action === "setProjectStatus") {
      const id = String(body.id ?? "");
      const status = String(body.status ?? "") as ProjectStatus;
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);
      if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
        return jsonResponse({ ok: false, error: "Invalid status" }, 400);
      }

      const { data: proj, error: readErr } = await db
        .from("projects")
        .select("status")
        .eq("quote_id", id)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!proj) return jsonResponse({ ok: false, error: "Not found" }, 404);

      const from = proj.status as ProjectStatus;
      if (from === status) return jsonResponse({ ok: false, error: "Already in that status" }, 400);
      if (from === "completed") {
        return jsonResponse({ ok: false, error: "Undo completion before changing the project stage" }, 400);
      }

      const { data: updated, error: updErr } = await db
        .from("projects")
        .update({ status })
        .eq("quote_id", id)
        .eq("status", from)
        .select("id");
      if (updErr) throw updErr;
      if (!updated || updated.length === 0) {
        return jsonResponse({ ok: false, error: "Modified concurrently, refresh" }, 409);
      }

      await logEvent(db, id, user, { type: "project_status_change", from_status: from, to_status: status });
      return jsonResponse({ ok: true });
    }

    // Internal note on the inquiry timeline (never shown publicly).
    if (action === "addNote") {
      const id = String(body.id ?? "");
      const note = typeof body.body === "string" ? body.body.trim() : "";
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);
      if (note.length < 1 || note.length > 2000) {
        return jsonResponse({ ok: false, error: "Note must be 1-2000 characters" }, 400);
      }
      const { data: row, error: readErr } = await db
        .from("quote_requests").select("id").eq("id", id).maybeSingle();
      if (readErr) throw readErr;
      if (!row) return jsonResponse({ ok: false, error: "Not found" }, 404);

      await logEvent(db, id, user, { type: "note", body: note });
      return jsonResponse({ ok: true });
    }

    // Assign the inquiry to an admin (adminId: null clears the assignment).
    if (action === "assign") {
      const id = String(body.id ?? "");
      const adminId = body.adminId == null ? null : String(body.adminId);
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);

      let assignedEmail: string | null = null;
      if (adminId !== null) {
        if (!UUID_RE.test(adminId)) {
          return jsonResponse({ ok: false, error: "Invalid adminId" }, 400);
        }
        // The assignee must be a real admin, not an arbitrary auth user.
        const { data: member, error: memberErr } = await db
          .from("admins").select("user_id").eq("user_id", adminId).maybeSingle();
        if (memberErr) throw memberErr;
        if (!member) return jsonResponse({ ok: false, error: "Not an admin" }, 400);

        const { data: authUser, error: authErr } = await db.auth.admin.getUserById(adminId);
        if (authErr) throw authErr;
        assignedEmail = authUser?.user?.email ?? null;
      }

      const { data: updated, error: updErr } = await db
        .from("quote_requests")
        .update({ assigned_to: adminId, assigned_email: assignedEmail })
        .eq("id", id)
        .select("id");
      if (updErr) throw updErr;
      if (!updated || updated.length === 0) {
        return jsonResponse({ ok: false, error: "Not found" }, 404);
      }

      await logEvent(db, id, user, { type: "assign", body: assignedEmail ?? "" });
      return jsonResponse({ ok: true, assignedEmail });
    }

    // Assignee picker data: every admin with their email.
    if (action === "listAdmins") {
      const { data: members, error: memberErr } = await db.from("admins").select("user_id");
      if (memberErr) throw memberErr;
      const admins = await Promise.all(
        (members ?? []).map(async (m: { user_id: string }) => {
          const { data } = await db.auth.admin.getUserById(m.user_id);
          return { id: m.user_id, email: data?.user?.email ?? null };
        }),
      );
      return jsonResponse({ ok: true, admins });
    }

    // Bulk status change: each id is validated against the state machine
    // individually; illegal ones are skipped and reported, not silently forced.
    if (action === "bulkStatus") {
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
      const status = String(body.status ?? "") as Status;
      if (ids.length < 1 || ids.length > 50 || !ids.every((i) => UUID_RE.test(i))) {
        return jsonResponse({ ok: false, error: "Invalid ids" }, 400);
      }
      if (!STATUSES.includes(status)) {
        return jsonResponse({ ok: false, error: "Invalid status" }, 400);
      }
      let done = 0;
      const skipped: { id: string; error: string }[] = [];
      for (const id of ids) {
        const err = await applyStatus(db, user, id, status);
        if (err) skipped.push({ id, error: err });
        else done++;
      }
      return jsonResponse({ ok: true, done, skipped });
    }

    // Hard delete: the replacement for "cancel". Removes the inquiry, its
    // project row and its audit timeline (both cascade via FK). Irreversible,
    // so the frontend is expected to confirm before calling this.
    if (action === "deleteQuote") {
      const id = String(body.id ?? "");
      if (!UUID_RE.test(id)) return jsonResponse({ ok: false, error: "Invalid id" }, 400);

      // Read the draft id first so its uploaded files can be purged too — the
      // bucket has no FK to quote_requests, so nothing else cleans this up.
      const { data: preRow } = await db
        .from("quote_requests")
        .select("attachments_draft_id")
        .eq("id", id)
        .maybeSingle();

      const { data: deleted, error: delErr } = await db
        .from("quote_requests")
        .delete()
        .eq("id", id)
        .select("id");
      if (delErr) throw delErr;
      if (!deleted || deleted.length === 0) {
        return jsonResponse({ ok: false, error: "Not found" }, 404);
      }

      const draftId = preRow?.attachments_draft_id as string | null | undefined;
      if (draftId) {
        // Best-effort: a stray file left behind is far less bad than failing
        // the delete the admin already confirmed.
        const { data: files } = await db.storage.from("quote-attachments").list(draftId);
        if (files && files.length > 0) {
          await db.storage.from("quote-attachments").remove(files.map((f) => `${draftId}/${f.name}`));
        }
      }
      return jsonResponse({ ok: true });
    }

    // Dashboard aggregates, computed in-function (PostgREST has no GROUP BY):
    // an inquiry-volume time series bucketed at the requested granularity
    // (day/week/month/year), per-status counts, top products, source and
    // language split, and the accepted/completed conversion rates — all
    // computed over the SAME lookback window, so switching granularity never
    // makes the other stats (top products, rates, etc.) inconsistent with
    // the chart. The window defaults per granularity (wider granularities
    // need a wider window to show more than a couple of buckets) but can be
    // overridden with `days`, clamped to 3 years.
    if (action === "analytics") {
      const GRANULARITIES = ["day", "week", "month", "year"] as const;
      type Granularity = (typeof GRANULARITIES)[number];
      const granularity: Granularity = GRANULARITIES.includes(body.granularity as Granularity)
        ? (body.granularity as Granularity)
        : "week";
      const DEFAULT_DAYS: Record<Granularity, number> = { day: 30, week: 90, month: 365, year: 730 };

      const rawDays = Number(body.days);
      const days = Number.isFinite(rawDays)
        ? Math.min(Math.max(Math.trunc(rawDays), 1), 1095)
        : DEFAULT_DAYS[granularity];

      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      const { data, error } = await db
        .from("quote_requests")
        .select("created_at, status, product_name, source, lang")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;

      const rows = data ?? [];
      const series: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const products: Record<string, number> = {};
      const sources: Record<string, number> = {};
      const langs: Record<string, number> = {};
      for (const r of rows) {
        const d = new Date(r.created_at);
        let period: string;
        if (granularity === "day") {
          period = d.toISOString().slice(0, 10);
        } else if (granularity === "week") {
          // Bucket by the Monday of the row's week (UTC) → stable "YYYY-MM-DD" keys.
          const monday = new Date(d);
          monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
          period = monday.toISOString().slice(0, 10);
        } else if (granularity === "month") {
          period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        } else {
          period = String(d.getUTCFullYear());
        }
        series[period] = (series[period] ?? 0) + 1;
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        if (r.product_name) products[r.product_name] = (products[r.product_name] ?? 0) + 1;
        if (r.source) sources[r.source] = (sources[r.source] ?? 0) + 1;
        if (r.lang) langs[r.lang] = (langs[r.lang] ?? 0) + 1;
      }
      const total = rows.length;
      const reached = (statuses: string[]) =>
        statuses.reduce((n, s) => n + (byStatus[s] ?? 0), 0);
      return jsonResponse({
        ok: true,
        since,
        granularity,
        days,
        total,
        series: Object.entries(series)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([period, count]) => ({ period, count })),
        byStatus,
        topProducts: Object.entries(products)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 7)
          .map(([name, count]) => ({ name, count })),
        sources,
        langs,
        // Funnel: share that got past review / got fully closed out.
        acceptedRate: total ? reached(["accepted", "completed"]) / total : 0,
        completedRate: total ? reached(["completed"]) / total : 0,
      });
    }

    // CSV export for offline processing. Cells are quoted and formula-guarded
    // (client-submitted text lands in spreadsheets otherwise executable).
    if (action === "exportCsv") {
      let query = db
        .from("quote_requests")
        .select(LIST_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(5000);
      const status = body.status;
      if (typeof status === "string" && (STATUSES as readonly string[]).includes(status)) {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) throw error;

      const columns = LIST_COLUMNS.split(", ");
      const lines = [columns.join(",")];
      for (const row of data ?? []) {
        lines.push(columns.map((c) => csvCell((row as Record<string, unknown>)[c])).join(","));
      }
      return jsonResponse({ ok: true, csv: lines.join("\r\n") });
    }

    // Cross-quote activity feed for the admin Overview tab: the last N
    // quote_events across ALL quotes in one round trip (not one fetch per
    // quote — that would be N+1 and is explicitly out of scope). Names are
    // joined via a second small lookup keyed by the returned quote_ids, same
    // batching pattern as attachPrices.
    if (action === "recentEvents") {
      const rawLimit = Number(body.limit);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50) : 20;

      const { data: events, error: evErr } = await db
        .from("quote_events")
        .select("id, quote_id, actor_email, type, from_status, to_status, amount, currency, body, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (evErr) throw evErr;

      const quoteIds = [...new Set((events ?? []).map((e: { quote_id: string }) => e.quote_id))];
      const namesById = new Map<string, { name: string; product_name: string | null }>();
      if (quoteIds.length > 0) {
        const { data: quotes, error: qErr } = await db
          .from("quote_requests")
          .select("id, name, product_name")
          .in("id", quoteIds);
        if (qErr) throw qErr;
        for (const q of quotes ?? []) {
          namesById.set(q.id as string, { name: q.name as string, product_name: q.product_name as string | null });
        }
      }

      const enriched = (events ?? []).map((e: { quote_id: string }) => ({
        ...e,
        quote_name: namesById.get(e.quote_id)?.name ?? null,
        product_name: namesById.get(e.quote_id)?.product_name ?? null,
      }));
      return jsonResponse({ ok: true, events: enriched });
    }

    return jsonResponse({ ok: false, error: "Unknown action" }, 400);
  } catch (err) {
    console.error("admin-quotes action failed", action, err);
    return jsonResponse({ ok: false, error: "Request failed" }, 500);
  }
});
