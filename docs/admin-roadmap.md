# Admin Panel — Security Roadmap & Deferred Features

Companion to [handoff-security.md](../handoff-security.md) (public-form hardening) and the
implemented pipeline/pricing/productivity work (see `supabase/schema/projects_pipeline.sql`,
`supabase/functions/admin-quotes/`, `src/pages/admin/`).

Already in place: RLS everywhere (PII tables with zero policies), Turnstile on public forms,
service-role-only writes, `is_admin()` SECURITY DEFINER gate, server-side status state machine,
append-only `quote_events` audit trail (who set what price/status/note, when), CSV
formula-injection guard, Telegram HTML escaping.

---

## 1. Quick manual wins (Supabase Dashboard, zero code)

Do these first — each takes minutes:

| # | Action | Where | Why |
|---|--------|-------|-----|
| 1 | Set `TURNSTILE_SECRET_KEY` | Edge Functions → Secrets | **Still the live blocker** — public forms fail closed without it |
| 2 | Disable public email signups | Auth → Providers → Email | Anyone can currently create an account. `is_admin()` gates them out of everything, but there is no reason to allow signups at all — admins are created manually |
| 3 | Enable leaked-password protection | Auth → Settings | Rejects passwords found in breach corpora (HaveIBeenPwned) |
| 4 | Enroll TOTP MFA on every admin account | Auth → user → Factors (or in-app enrollment later) | Password theft alone stops being enough |
| 5 | Set `ALLOWED_ORIGIN=https://<prod-domain>` | Edge Functions → Secrets | Locks CORS from `*` to the real site |
| 6 | Delete the inert `notify-quote` stub | Edge Functions | Dead code with a public URL |

## 2. Code roadmap (prioritized)

1. **Enforce MFA cryptographically** — change `public.is_admin()` to also require
   `(select auth.jwt()->>'aal') = 'aal2'`. With that, a session that hasn't completed a
   second factor is not an admin, no matter the password. Requires step 1.4 first, plus a
   small MFA-challenge screen in `AdminGate`.
2. **Roles on `admins`** — add `role text check (role in ('owner','manager'))`. Gate
   `setPrice`, `bulkStatus`, and review-delete to `owner` in the edge function /
   RLS policies. Matches "only authorized admins can set prices even if more staff are
   added later."
3. **Per-IP rate limiting on `submit-quote` / `submit-review`** — a small
   `rate_limits (ip, bucket, count)` table checked/upserted by the functions (e.g. max 5
   submissions per IP per 10 minutes). Turnstile stops bots; this stops humans-with-scripts
   and token-replay farms.
4. **Turnstile on the admin login** — Supabase Auth supports CAPTCHA on sign-in
   (Auth → Settings → Bot and Abuse Protection); the site already ships the widget component.
5. **Idle-session auto-signout** — in `AdminGate`, sign out after ~30 min without pointer/key
   activity. Complements Supabase's JWT expiry (which only limits token lifetime, not tab abandonment).
6. **Audit triggers for reviews/videos** — `reviews` and `capability_videos` are moderated via
   direct RLS-gated table access, so approve/delete actions bypass `quote_events`. Either route
   them through an admin edge function too, or add `AFTER UPDATE/DELETE` triggers writing to a
   shared audit table with `auth.uid()`.
7. **PII retention purge** — `pg_cron` job deleting `cancelled`/`completed` quotes older than
   12 months (phone/address are PII; keep aggregate stats, drop the raw rows). Announce in the
   privacy page.
8. **Login-abuse alerting** — Telegram message (bot infra already exists) on repeated failed
   sign-ins, via an Auth webhook / log-based check.

## 3. Deferred features (nice-to-have, unplanned)

- Review moderation: `rejected` state instead of hard delete, plus an optional public
  admin reply under the review.
- Admin user-management UI (list/add/revoke admins; owner-only) — today it's manual SQL.
- Products in DB (specs/images editable without a deploy) — today `src/pages/data.js` is static.
- Video panel: drag-and-drop reorder and an upload progress bar.
- Outbound webhooks / notification preferences (per-admin Telegram opt-in, email digests).
- Follow-up reminders: scheduled Telegram digest of inquiries stuck in `new`/`in_review`
  beyond the 48h stale threshold (the badge already exists in the panel).
