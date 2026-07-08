/* Cloudflare Turnstile config, derived from the public site key.
 *
 * Kept separate from the <Turnstile> component so the component file only
 * exports a component (react-refresh requirement) and forms can import this flag
 * without pulling in the widget.
 *
 * Set VITE_TURNSTILE_SITE_KEY in `.env` to enable the captcha; when unset the
 * forms skip it (demo mode). */

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const isTurnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
