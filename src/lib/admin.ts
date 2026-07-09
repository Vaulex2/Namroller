import { supabase } from "./supabase";

/* Admin data client (used only inside the authenticated admin panel).
 *
 * quote_requests is PII with NO Data API policy, so its reads/writes go through
 * the `admin-quotes` edge function (the caller's session JWT is attached
 * automatically by supabase-js; the function verifies admin). Reviews are
 * moderated directly against the table — RLS admin policies (public.is_admin())
 * gate every row. */

// new = "to be viewed", accepted = called and confirmed (price settable from
// here on), completed = "finished". There is no cancelled status — an
// unwanted inquiry is deleted outright (see deleteQuote).
export type QuoteStatus = "new" | "accepted" | "completed";

export const QUOTE_STATUSES: QuoteStatus[] = ["new", "accepted", "completed"];

/* UI mirror of the edge function's state machine — used only to decide which
 * action buttons to SHOW. Legality is re-enforced server-side on every call. */
export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  new: ["accepted"],
  accepted: ["new", "completed"],
  completed: ["accepted"],
};

export interface QuoteRow {
  id: string;
  product_id: string | null;
  product_name: string | null;
  name: string;
  phone: string;
  email: string | null;
  quantity: string | null;
  address: string | null;
  note: string | null;
  lang: string | null;
  source: string | null;
  status: QuoteStatus;
  price_amount: number | null;
  price_currency: "UZS" | "USD" | null;
  assigned_to: string | null;
  assigned_email: string | null;
  created_at: string;
  attachments_draft_id?: string | null;
}

export interface QuoteAttachment {
  path: string;
  url: string;
  name: string;
}

/* The admin panel's 3-stage funnel (accept -> set price -> finish). Price
 * isn't a stored status, so this derives the row's one next action from
 * status + whether a price exists — the single source of truth the list UI
 * renders against, mirroring the server's real gate on "completed". */
export type QuoteNextAction =
  | { kind: "accept" }
  | { kind: "setPrice" }
  | { kind: "finish" }
  | { kind: "done" };

export function nextQuoteAction(row: {
  status: QuoteStatus;
  price_amount: number | null;
}): QuoteNextAction {
  if (row.status === "new") return { kind: "accept" };
  if (row.status === "accepted") {
    return row.price_amount == null ? { kind: "setPrice" } : { kind: "finish" };
  }
  return { kind: "done" };
}

export type QuoteStats = { total: number } & Record<QuoteStatus, number>;

export interface QuoteProject {
  id: string;
  quote_id: string;
  price_amount: number | null;
  price_currency: "UZS" | "USD" | null;
  priced_by: string | null;
  priced_by_email: string | null;
  priced_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface QuoteEvent {
  id: string;
  actor_email: string | null;
  type: "status_change" | "price_set" | "note" | "assign";
  from_status: string | null;
  to_status: string | null;
  amount: number | null;
  currency: string | null;
  body: string | null;
  created_at: string;
}

export interface RelatedQuote {
  id: string;
  name: string;
  product_name: string | null;
  status: QuoteStatus;
  created_at: string;
}

export interface QuoteDetail {
  row: QuoteRow;
  project: QuoteProject | null;
  events: QuoteEvent[];
  related: RelatedQuote[];
}

export type AnalyticsGranularity = "day" | "week" | "month" | "year";

export interface QuoteAnalytics {
  since: string;
  granularity: AnalyticsGranularity;
  days: number;
  total: number;
  series: { period: string; count: number }[];
  byStatus: Partial<Record<QuoteStatus, number>>;
  topProducts: { name: string; count: number }[];
  sources: Record<string, number>;
  langs: Record<string, number>;
  acceptedRate: number;
  completedRate: number;
}

async function invokeAdminQuotes<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.functions.invoke("admin-quotes", { body });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "admin-quotes failed");
  return data as T;
}

export function quoteStats(): Promise<QuoteStats> {
  return invokeAdminQuotes<QuoteStats>({ action: "stats" });
}

// Stats + first page of rows in a single edge-function call (one round trip).
export function quotesOverview(
  limit = 100,
): Promise<{ stats: QuoteStats; rows: QuoteRow[]; total: number }> {
  return invokeAdminQuotes<{ stats: QuoteStats; rows: QuoteRow[]; total: number }>({
    action: "overview",
    limit,
  });
}

export function listQuotes(
  opts: { status?: QuoteStatus; limit?: number; offset?: number } = {},
): Promise<{ rows: QuoteRow[]; total: number }> {
  return invokeAdminQuotes<{ rows: QuoteRow[]; total: number }>({
    action: "list",
    status: opts.status,
    limit: opts.limit ?? 50,
    offset: opts.offset ?? 0,
  });
}

// Transition-validated server-side.
export function setQuoteStatus(id: string, status: QuoteStatus): Promise<{ ok: true }> {
  return invokeAdminQuotes<{ ok: true }>({ action: "setStatus", id, status });
}

// Hard delete (the replacement for "cancel"). Irreversible — confirm in the UI
// before calling. Cascades to the project row and audit timeline.
export function deleteQuote(id: string): Promise<{ ok: true }> {
  return invokeAdminQuotes<{ ok: true }>({ action: "deleteQuote", id });
}

// Full record for the detail view: inquiry + project + audit timeline + other
// inquiries from the same phone.
export function quoteDetail(id: string): Promise<QuoteDetail> {
  return invokeAdminQuotes<QuoteDetail>({ action: "detail", id });
}

// Signed URLs (10 min expiry) for a quote's uploaded photos/videos. Only
// worth calling when quoteDetail's row has an attachments_draft_id.
export function quoteAttachmentUrls(id: string): Promise<{ attachments: QuoteAttachment[] }> {
  return invokeAdminQuotes<{ attachments: QuoteAttachment[] }>({ action: "attachmentUrls", id });
}

// The guarded money action: settable any time once accepted (or completed);
// records who set what price, when, in the audit trail. Does not change status.
export function setQuotePrice(
  id: string,
  amount: number,
  currency: "UZS" | "USD",
): Promise<{ ok: true }> {
  return invokeAdminQuotes<{ ok: true }>({ action: "setPrice", id, amount, currency });
}

export function addQuoteNote(id: string, body: string): Promise<{ ok: true }> {
  return invokeAdminQuotes<{ ok: true }>({ action: "addNote", id, body });
}

// adminId: null clears the assignment.
export function assignQuote(
  id: string,
  adminId: string | null,
): Promise<{ assignedEmail: string | null }> {
  return invokeAdminQuotes<{ assignedEmail: string | null }>({ action: "assign", id, adminId });
}

export function listAdmins(): Promise<{ admins: { id: string; email: string | null }[] }> {
  return invokeAdminQuotes<{ admins: { id: string; email: string | null }[] }>({
    action: "listAdmins",
  });
}

// Per-id transition validation server-side; returns how many applied and which
// were skipped (with reasons).
export function bulkSetQuoteStatus(
  ids: string[],
  status: QuoteStatus,
): Promise<{ done: number; skipped: { id: string; error: string }[] }> {
  return invokeAdminQuotes<{ done: number; skipped: { id: string; error: string }[] }>({
    action: "bulkStatus",
    ids,
    status,
  });
}

// `days` overrides the server's per-granularity default window (day=30,
// week=90, month=365, year=730) if you need a narrower/wider range.
export function quoteAnalytics(granularity: AnalyticsGranularity = "week", days?: number): Promise<QuoteAnalytics> {
  return invokeAdminQuotes<QuoteAnalytics>({ action: "analytics", granularity, days });
}

// Server-generated, formula-injection-guarded CSV (≤5000 rows).
export async function exportQuotesCsv(status?: QuoteStatus): Promise<string> {
  const { csv } = await invokeAdminQuotes<{ csv: string }>({ action: "exportCsv", status });
  return csv;
}

// Cross-quote activity feed for the Overview tab — the last `limit` quote_events
// across ALL quotes in one round trip (not per-quote — see the edge function's
// recentEvents action for why that would be N+1 and is deliberately avoided).
export interface RecentQuoteEvent {
  id: string;
  quote_id: string;
  quote_name: string | null;
  product_name: string | null;
  type: QuoteEvent["type"];
  from_status: string | null;
  to_status: string | null;
  amount: number | null;
  currency: string | null;
  body: string | null;
  actor_email: string | null;
  created_at: string;
}

export function recentQuoteEvents(limit = 20): Promise<{ events: RecentQuoteEvent[] }> {
  return invokeAdminQuotes<{ events: RecentQuoteEvent[] }>({ action: "recentEvents", limit });
}

/* ---- Reviews moderation (direct table access, RLS-gated by is_admin()) ---- */

export interface AdminReview {
  id: string;
  name: string;
  role: string | null;
  text: string;
  rating: number;
  approved: boolean;
  created_at: string;
}

// All reviews (pending + approved). The admin RLS "read all reviews" policy
// (is_admin()) returns every row; approved ones stay listed so they don't
// disappear after moderation.
export async function listReviews(): Promise<AdminReview[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("reviews")
    .select("id, name, role, text, rating, approved, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminReview[];
}

// Approve (true) or move back to pending / hide from the homepage (false).
export async function setReviewApproved(id: string, approved: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
  if (error) throw error;
}

// Permanently remove a review.
export async function deleteReview(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

// Bulk approve/reject in one round trip via PostgREST's `.in()` filter,
// instead of N sequential setReviewApproved calls. Same RLS admin policy
// already covers it.
export async function bulkSetReviewApproved(ids: string[], approved: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("reviews").update({ approved }).in("id", ids);
  if (error) throw error;
}

export async function bulkDeleteReviews(ids: string[]): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("reviews").delete().in("id", ids);
  if (error) throw error;
}
