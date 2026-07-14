# Security Hardening — Handoff

> Follow-up hardening and deferred admin features are tracked in
> [docs/admin-roadmap.md](docs/admin-roadmap.md).

Status of the public-write security hardening for NamRoller (reviews + price quotes).
The backend is **secure and live** — public forms are confirmed working on the deployed
site (`TURNSTILE_SECRET_KEY` is set; the frontend is deployed with a matching
`VITE_TURNSTILE_SITE_KEY`).

_Project ref:_ `ruymetqteqiqimyjatkr` · _Repo:_ https://github.com/Vaulex2/Namroller ·
_Hosting:_ Vercel (`namroller.vercel.app`, GitHub-integrated, auto-deploys on push to `main`)

---

## TL;DR — what's left

Nothing blocking. Optional cleanup only: delete the `notify-quote` shell, set `ALLOWED_ORIGIN`.
See `docs/admin-roadmap.md` for further (non-blocking) hardening ideas.

---

## ✅ Already done (deployed & live)

- **SQL / RLS applied** to the live DB:
  - `reviews`: `approved` column (default false); SELECT policy `using (approved = true)`; CHECK constraints on name/text/role/rating; `image` constrained to `^https://`. **No anon insert policy.**
  - `quote_requests`: CHECK constraints on all fields; **no policies at all** (RLS on → anon cannot read or write; PII private). The advisor INFO "RLS enabled, no policy" on this table is **intentional**.
- **Edge functions deployed** (`submit-quote`: `verify_jwt = false`, public; `submit-review`: `verify_jwt = true`, satisfied by the anon key):
  - `submit-quote` — verifies Turnstile → validates → inserts via service role → sends Telegram directly.
  - `submit-review` — verifies Turnstile → validates → inserts `approved = false` via service role.
- **Old path retired:**
  - `Telegram_webhook` AFTER INSERT trigger on `quote_requests` **dropped**.
  - `notify-quote` overwritten with an inert **410 stub** (the unauthenticated abuse vector is dead; the shell can be deleted from the dashboard).
- **Advisor cleanup:** revoked public/anon/authenticated `EXECUTE` on `public.rls_auto_enable()` (internal event-trigger helper; event triggers still fire). Security advisors now clean except the intentional INFO above.
- **Frontend code:** forms call `supabase.functions.invoke('submit-quote' | 'submit-review')` with a Cloudflare Turnstile token; reviews show a "pending approval" message; `<Turnstile>` widget added to the quote/review/contact forms. Deployed and confirmed working on the live Vercel site.
- **`TURNSTILE_SECRET_KEY`** — set (confirmed 2026-07-14: public forms work end-to-end on the deployed site).
- **Rate limiting** — `submit-quote` / `submit-review` cap each IP at 5 requests / 10 min via `public.rate_limit_hit()` (see `supabase/schema/rate_limits.sql`, `supabase/functions/_shared/rateLimit.ts`), checked before the Turnstile round trip. Fails open on a DB error so a limiter bug can't take the public forms down.

---

## 🟡 Optional cleanup / hardening

- **Delete `notify-quote`**: Dashboard → Edge Functions → `notify-quote` → Delete (it's an inert stub now). Or `supabase functions delete notify-quote`.
- **Lock CORS** to the production origin: `supabase secrets set ALLOWED_ORIGIN=https://namroller.uz` (defaults to `*`, which is acceptable but looser).

---

## ✅ Verify end-to-end

1. **Quote:** submit the Contact form or a product "Ask the price" modal → solve captcha → expect success + a **Telegram message** + a new row in `quote_requests`.
2. **Review:** submit a review → expect "pending approval" success → row in `reviews` with `approved = false` → it does **not** show on the homepage. Flip `approved = true` in the dashboard → it appears after refresh.
3. **Captcha enforcement:** a request with a missing/invalid token → **403** "Verification failed".
4. **Anon write blocked:** a direct anon-key `POST /rest/v1/reviews` or `/rest/v1/quote_requests` → **401/403** (RLS denies; no insert policy).
5. **Old endpoint dead:** `POST /functions/v1/notify-quote` → **410 Gone**.

---

## Reference — current deployed state

| Item | State |
|------|-------|
| `submit-quote` function | ACTIVE, `verify_jwt = false` (public; anon-key call), rate-limited |
| `submit-review` function | ACTIVE, `verify_jwt = true` (anon key satisfies it), rate-limited |
| `notify-quote` function | ACTIVE but inert (410 stub) — safe to delete |
| `Telegram_webhook` trigger | dropped |
| `reviews` RLS | read-only where `approved = true`; no anon insert |
| `quote_requests` RLS | no policies (private); service-role insert only |
| `rate_limits` | 5 req / 10 min per IP per function, via `public.rate_limit_hit()`; no policies (private) |
| `TURNSTILE_SECRET_KEY` | set — confirmed working live |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | set (pre-existing) |
| `ALLOWED_ORIGIN` | not set (defaults to `*`) — optional hardening |
| Frontend hosting | Vercel, GitHub-integrated, auto-deploys `main` |

**Posture:** backend ~9/10. Fully functional and live.
