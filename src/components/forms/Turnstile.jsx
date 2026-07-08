import React from 'react';
import { useTranslation } from 'react-i18next';
import { TURNSTILE_SITE_KEY, isTurnstileEnabled } from '../../lib/turnstile';

/* Cloudflare Turnstile widget.
 *
 * Renders the captcha and reports its token via `onToken`. The token is what the
 * submit-quote / submit-review edge functions verify server-side before writing.
 *
 * Configure the public site key in `.env` (VITE_TURNSTILE_SITE_KEY). When the
 * key is absent (local/demo), the widget renders nothing and forms skip the
 * captcha entirely so they stay usable offline. The `isTurnstileEnabled` flag
 * lives in src/lib/turnstile.js so forms can import it without the widget.
 */

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise = null;

// Load the Turnstile script once and resolve when window.turnstile is ready.
function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const onReady = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile failed to initialize'));
    };
    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', reject, { once: true });
      if (window.turnstile) resolve(window.turnstile);
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Turnstile({ onToken, style }) {
  const { i18n } = useTranslation();
  const ref = React.useRef(null);
  const widgetIdRef = React.useRef(null);
  // Keep the latest onToken without re-rendering the widget on each parent render.
  const onTokenRef = React.useRef(onToken);
  React.useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

  // Match the widget to the site's current language (Turnstile otherwise auto-
  // detects the browser locale, which clashes with the chosen UI language).
  const language = (i18n.language || 'en').slice(0, 2);

  React.useEffect(() => {
    if (!isTurnstileEnabled) return undefined;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !ref.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',          // match the light form surface
          size: 'flexible',        // fill the container width like the inputs above
          language,
          callback: (token) => onTokenRef.current?.(token),
          'expired-callback': () => onTokenRef.current?.(''),
          'error-callback': () => onTokenRef.current?.(''),
        });
      })
      .catch(() => {
        // Network/script failure: treat as no token so submit stays blocked.
        if (!cancelled) onTokenRef.current?.('');
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id !== null && window.turnstile) {
        try { window.turnstile.remove(id); } catch { /* already gone */ }
      }
      widgetIdRef.current = null;
    };
    // Re-render the widget if the language changes (e.g. user switches locale).
  }, [language]);

  if (!isTurnstileEnabled) return null;

  return <div ref={ref} style={{ minHeight: 65, ...style }} />;
}
