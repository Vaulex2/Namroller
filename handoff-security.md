# Security Hardening — Handoff

> Follow-up hardening and deferred admin features are tracked in
> [docs/admin-roadmap.md](docs/admin-roadmap.md).

Status of the public-write security hardening for NamRoller (reviews + price quotes),
and the steps still required to make the forms **functional**. The backend is already
**secure** — it currently fails closed (rejects all writes) until the one secret below is set.

_Project ref:_ `ruymetqteqiqimyjatkr` · _Repo:_ https://github.com/Vaulex2/Namroller

---

## TL;DR — what's left

1. **Set `TURNSTILE_SECRET_KEY`** edge secret (the hard blocker → forms 403 without it).
2. **Redeploy the frontend** with `VITE_TURNSTILE_SITE_KEY` (only if the site is hosted; local dev already has it).
3. Optional: delete the `notify-quote` shell, set `ALLOWED_ORIGIN`.

Until step 1 is done: backend = **secure but closed** (no writes succeed). That's fail-safe, not broken-open.

---

## ✅ Already done (deployed & live)

- **SQL / RLS applied** to the live DB:
  - `reviews`: `approved` column (default false); SELECT policy `using (approved = true)`; CHECK constraints on name/text/role/rating; `image` constrained to `^https://`. **No anon insert policy.**
  - `quote_requests`: CHECK constraints on all fields; **no policies at all** (RLS on → anon cannot read or write; PII private). The advisor INFO "RLS enabled, no policy" on this table is **intentional**.
- **Edge functions deployed** (both `verify_jwt = true`):
  - `submit-quote` — verifies Turnstile → validates → inserts via service role → sends Telegram directly.
  - `submit-review` — verifies Turnstile → validates → inserts `approved = false` via service role.
- **Old path retired:**
  - `Telegram_webhook` AFTER INSERT trigger on `quote_requests` **dropped**.
  - `notify-quote` overwritten with an inert **410 stub** (the unauthenticated abuse vector is dead; the shell can be deleted from the dashboard).
- **Advisor cleanup:** revoked public/anon/authenticated `EXECUTE` on `public.rls_auto_enable()` (internal event-trigger helper; event triggers still fire). Security advisors now clean except the intentional INFO above.
- **Frontend code (in repo / working tree):** forms call `supabase.functions.invoke('submit-quote' | 'submit-review')` with a Cloudflare Turnstile token; reviews show a "pending approval" message; `<Turnstile>` widget added to the quote/review/contact forms.

---

## 🔴 Step 1 — Set the Turnstile secret (REQUIRED)

The functions call Cloudflare `siteverify` with `TURNSTILE_SECRET_KEY` and **fail closed** if it's
missing (every submit → 403 "Verification failed").

- The secret must **pair** with the site key in [.env](.env) (`VITE_TURNSTILE_SITE_KEY`). Real site key ↔ real secret; test pair ↔ test pair. Mismatch = all submissions rejected.
- Get it from: https://dash.cloudflare.com → **Turnstile** → your widget → **Secret Key**.
- Cloudflare always-pass test pair (local testing only): site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

Set it (either path):

```bash
# CLI
supabase secrets set TURNSTILE_SECRET_KEY=<your Cloudflare secret>
```
or **Dashboard → Edge Functions → Secrets → Add** `TURNSTILE_SECRET_KEY`.

> `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` are already set (the old notifier used them; secrets are
> project-wide, so `submit-quote` inherits them). `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are
> injected automatically. No action needed for those.

---

## 🔴 Step 2 — Redeploy the frontend (if hosted)

The live SPA must run the new code (which uses `functions.invoke`, not direct inserts) and have the
public site key at build time:

- Set `VITE_TURNSTILE_SITE_KEY=<Cloudflare site key>` in the host's env.
- Rebuild & redeploy (`npm run build` → deploy `dist/`).
- **Local `npm run dev` already has the new code** — once Step 1 is done, local submissions work.

---

## 🟡 Step 3 — Optional cleanup / hardening

- **Delete `notify-quote`**: Dashboard → Edge Functions → `notify-quote` → Delete (it's an inert stub now). Or `supabase functions delete notify-quote`.
- **Lock CORS** to the production origin: `supabase secrets set ALLOWED_ORIGIN=https://namroller.uz` (defaults to `*`, which is acceptable but looser).
- ~~**Rate limiting**~~ **Done (2026-07-14):** `submit-quote` / `submit-review` now cap each IP at 5 requests / 10 min via `public.rate_limit_hit()` (see `supabase/schema/rate_limits.sql`, `supabase/functions/_shared/rateLimit.ts`), checked before the Turnstile round trip. Fails open on a DB error so a limiter bug can't take the public forms down.
- **Commit & push** the working-tree hardening to `Vaulex2/Namroller` so source control matches the deployed state. Files: `supabase/functions/**`, `supabase/schema/*.sql`, `src/lib/{quotes,reviews,turnstile}.*`, `src/components/forms/Turnstile.jsx`, `src/components/forms/Input.jsx`, `src/pages/{QuoteModal,AddReviewModal,Contact,Testimonials}.jsx`, `src/i18n/locales/*.json`, `.env.example`, `.gitignore`.

---

## ✅ Verify end-to-end (after Step 1)

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
| `TURNSTILE_SECRET_KEY` | **NOT SET** ← blocker |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | set (pre-existing) |
| `ALLOWED_ORIGIN` | not set (defaults to `*`) |

**Posture:** backend ~8/10 (realized). Fully functional once `TURNSTILE_SECRET_KEY` is set.
