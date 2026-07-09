# Quote Attachments (photo/video upload) — Handoff

> Deferred feature — not started. Companion to [handoff-security.md](handoff-security.md) and
> [docs/admin-roadmap.md](docs/admin-roadmap.md). Follows the same security posture as the rest
> of the quote pipeline: PII/private tables get **zero** Data API policies, all access goes
> through edge functions or narrowly-scoped storage policies. Schema changes go live via the
> Supabase MCP `apply_migration` tool (idempotent SQL), and edge functions via MCP
> `deploy_edge_function` — the `supabase` CLI is not authenticated on this machine.

**Goal:** let a client attach photos and short videos (e.g. of the site/product they want rollers
for) to a quote request, from both the Contact page form and the product-page "Ask the price"
modal. Visible to admins in the quote detail view.

---

## Why this needs care

`quote_requests` currently has **RLS on with zero policies** — intentional, all access goes
through the `submit-quote` / `admin-quotes` edge functions. Attachments must not create a new
public-read hole: uploaded files (site photos, sometimes showing a client's premises) are
effectively PII/business-sensitive, same class as the phone/address already in the table.

The existing two storage buckets (`capabilities`, `product-images`) are **admin-managed and
public** — fine for content admins choose to publish. This is the opposite case: **public
anonymous writes**, so it needs its own bucket with different policies.

---

## Recommended approach

1. **New private bucket** `quote-attachments` (not public). Suggested limits: 8 MB/file for
   images, ~50 MB/file for video, allowed mime types `image/jpeg, image/png, image/webp,
   video/mp4, video/webm, video/quicktime` (quicktime for iPhone clips). Cap total files per
   request (e.g. 5) client-side and re-check server-side.

2. **Client generates a random draft ID (UUID) before upload** (e.g. `crypto.randomUUID()`),
   uploads directly to `quote-attachments/{draftId}/{filename}` via `supabase.storage` with the
   anon key — **not** proxied through an edge function (function payload/duration limits make
   that a bad fit for video). This avoids the chicken-and-egg problem of not having a `quote_id`
   yet.

3. **Storage RLS policy**: allow anon **INSERT only** into `quote-attachments`, scoped to that
   bucket, no SELECT/UPDATE/DELETE for anon (write-only "drop box" — matches the zero-read
   posture elsewhere). Admins get SELECT via `is_admin()`.

4. **`submit-quote` edge function**: accept an optional `draftId` (and maybe an expected file
   count, to sanity-check nothing was tampered with) in the request body; store it on the new
   row (`quote_requests.attachments_draft_id text`, or similar) when inserting.

5. **`admin-quotes` edge function**: add an action (e.g. `attachmentUrls`) that, given a quote id,
   looks up its `attachments_draft_id`, lists that storage prefix with the **service role**, and
   returns short-lived signed URLs. `QuoteDetail.jsx` renders them (image `<img>` / `<video>`
   thumbnails).

6. **Migration** (via Supabase MCP `apply_migration`, per this repo's convention — CLI is
   unauthenticated locally): add the `attachments_draft_id` column + CHECK constraint, and the
   storage bucket + policy, as idempotent DDL mirrored into `supabase/schema/*.sql`.

7. **Frontend**: file input (multi-select, accept images + video) on `Contact.jsx` and
   `QuoteModal.jsx`, upload-with-progress before/on submit, thumbnail previews, remove-before-send.
   New i18n strings across all 5 locales (`ru/uz/en/zh/fa`).

## Resolved decisions

- **Scope**: photos + video shipped together in v1 (not split), 5 files max, 8 MB/image,
  60 MB/video.
- **Retention**: `deleteQuote` now also lists and removes the draft's storage prefix
  (best-effort — a stray file is far less bad than failing a delete the admin already confirmed).
- **Upload timing**: files queue client-side (local `File` objects + blob preview URLs only,
  no network) and only actually upload to storage at submit time. This is why "remove before
  send" needs no delete call — the anon key can't delete from the bucket anyway, so nothing
  hits storage until the buyer has committed to sending it.

## Status — implemented (2026-07-09)

- Migration applied: `quote_requests.attachments_draft_id` (uuid), `quote-attachments` bucket
  (private, anon INSERT-only, admin SELECT/DELETE via `is_admin()`). Mirrored in
  `supabase/schema/quote_requests.sql` and the new `supabase/schema/storage_quote_attachments.sql`.
  RLS-only; no application-level auth was needed beyond the storage policy.
- `submit-quote` accepts `attachmentsDraftId`, validates it's a UUID, stores it on insert, and
  notes "photos/video attached" in the Telegram message. Deployed (v4).
- `admin-quotes` gained `attachmentUrls` (signed URLs, 10 min expiry) and purges the draft's
  files on `deleteQuote`. Deployed (v9).
- `src/lib/quotes.ts`: `uploadQuoteAttachments(files)` — uploads a whole queue in parallel and
  returns the draft id, or `undefined` for an empty queue.
- `src/lib/admin.ts`: `quoteAttachmentUrls(id)`.
- New shared component `src/components/forms/AttachmentPicker.jsx`, wired into both
  `Contact.jsx` and `QuoteModal.jsx`.
- `QuoteDetail.jsx` renders attachments (image `<img>` / muted `<video>` thumbnails linking to
  the signed URL) when the row has an `attachments_draft_id`.
- i18n: new top-level `attachments.*` namespace in all 5 locales; `admin.detail.attachments` /
  `attachmentsEmpty` added to `ru`/`uz` only (the admin panel is RU/UZ-only, matching
  `AdminLangSwitcher`).
- Build + lint clean. Browser-verified with Playwright against the local dev server (real
  Supabase backend): picker renders on both forms, thumbnails + remove work, the 5-file cap and
  bad-type/oversize rejections all show the right inline error. Caught and fixed one bug in the
  process — picking a batch that partially overflowed the cap silently dropped the extra file
  with no error; now it always shows "can attach up to N files" when that happens.
- **Not yet tested**: an actual end-to-end submission (upload → submitQuote → admin panel
  viewing signed URLs) — the browser check above stopped short of submitting to avoid spamming
  the real Supabase backend / Telegram notification. Not yet pushed to `main`.
