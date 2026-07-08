import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '../core/Button';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/* Informational cookie notice. The site uses only strictly-necessary cookies
 * (language preference + Cloudflare Turnstile anti-spam), so this informs and
 * dismisses rather than gating anything. The choice is remembered in
 * localStorage. Sits below modals (z 100) and the dock (z 90).
 *
 * Desktop: anchored bottom-left, clear of the bottom-right ContactDock.
 * Mobile (<=640px): a bottom-left floating card at phone widths would
 * physically overlap the ContactDock (both corner-anchored, both call it
 * "always visible") — so on mobile this renders as a full-width bar fixed to
 * the TOP of the viewport instead, which structurally can't collide with any
 * bottom-anchored widget (ContactDock, CompareTray). */

const STORAGE_KEY = 'nr-cookie-consent';

export function CookieConsent({ go }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      /* storage blocked — just dismiss for this session */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={t('cookieBanner.label')}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: isMobile ? -24 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: isMobile ? -24 : 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={isMobile ? {
            // Anchored below the sticky header (z-index 200, well above this
            // banner's 85) rather than top:0 — otherwise the header would
            // render over it and hide it completely at the same top edge.
            position: 'fixed', top: 'var(--header-h)', left: 0, right: 0,
            zIndex: 85,
            background: 'var(--surface-card)',
            borderBottom: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
          } : {
            position: 'fixed', left: 'var(--space-5)', bottom: 'var(--space-5)',
            zIndex: 85, width: 'min(380px, calc(100vw - 2 * var(--space-5)))',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {/* accent rule — matches Card accentBar */}
          <span style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'var(--nr-accent)',
          }} />

          <div style={{ padding: '20px 20px 18px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 10,
            }}>
              {t('cookieBanner.label')}
            </div>

            <p style={{
              margin: 0, fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-relaxed)',
              color: 'var(--text-body)',
            }}>
              {t('cookieBanner.text')}
            </p>

            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <Button variant="primary" size="sm" onClick={accept}>
                {t('cookieBanner.accept')}
              </Button>
              <button
                type="button"
                onClick={() => go && go('cookies')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                  fontSize: 'var(--fs-body-sm)', color: 'var(--text-link)',
                  textDecorationLine: 'underline', textUnderlineOffset: 3,
                }}
              >
                {t('cookieBanner.more')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
