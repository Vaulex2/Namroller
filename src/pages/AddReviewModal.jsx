import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/core/Button';
import { Input } from '../components/forms/Input';
import { Card } from '../components/surfaces/Card';
import { Icon } from './Icon';
import { addReview } from '../lib/reviews';
import { Turnstile } from '../components/forms/Turnstile';
import { isTurnstileEnabled } from '../lib/turnstile';

/* Interactive 1–5 star picker. */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = React.useState(0);
  return (
    <div style={{ display: 'flex', gap: 8 }} role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0,
            }}
          >
            <svg
              width={26} height={26} viewBox="0 0 24 24"
              fill={active ? 'var(--nr-accent)' : 'transparent'}
              stroke={active ? 'var(--nr-accent)' : 'var(--border-default)'}
              strokeWidth={1.5} strokeLinejoin="round"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

const fieldLabel = {
  display: 'block', marginBottom: 6,
  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
  fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

/* Dialog body — mounted only while open, so each open starts with fresh state
   (no state-reset effect needed). */
function ReviewDialog({ onClose, onAdded }) {
  const { t } = useTranslation();
  const [form, setForm] = React.useState({ name: '', role: '', text: '', rating: 5 });
  const [token, setToken] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // External-system sync only: Escape-to-close + body scroll lock.
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      setError(t('testimonials.form.required'));
      return;
    }
    if (isTurnstileEnabled && !token) {
      setError(t('testimonials.form.captcha'));
      return;
    }
    setBusy(true); setError('');
    try {
      const review = await addReview({
        name: form.name.trim(),
        role: form.role.trim(),
        text: form.text.trim(),
        rating: form.rating,
        token,
      });
      onAdded?.(review);
      setDone(true);
    } catch {
      setError(t('testimonials.form.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,6,23,0.72)',
        // overflowY:auto + block layout (not flex-centered) so the overlay
        // scrolls when content is taller than the viewport — critical on
        // mobile where the keyboard can shrink visible height enough to
        // clip the top of the form with no way to scroll back to it.
        overflowY: 'auto',
        padding: 'var(--space-6) var(--space-4)', willChange: 'opacity',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, margin: '0 auto', willChange: 'transform, opacity' }}
        role="dialog"
        aria-modal="true"
      >
        <Card accentBar padding={32} className="nr-modal-card" style={{ overflow: 'visible' }}>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('testimonials.form.close')}
            style={{
              position: 'absolute', top: 8, right: 8, background: 'none',
              border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8,
              width: 40, height: 40, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="close" size={20} />
          </button>

          {done ? (
            <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 64, height: 64, background: 'var(--success-bg)', borderRadius: '50%',
                  color: 'var(--success)', marginBottom: 20,
                }}
              >
                <Icon name="check" size={30} />
              </motion.span>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                textTransform: 'uppercase', fontSize: 26, color: 'var(--text-strong)', margin: 0,
              }}>
                {t('testimonials.form.successTitle')}
              </h2>
              <p style={{ marginTop: 12, color: 'var(--text-body)', fontSize: 'var(--fs-body)' }}>
                {t('testimonials.form.successBody')}
              </p>
              <div style={{ marginTop: 24 }}>
                <Button variant="primary" onClick={onClose}>
                  {t('testimonials.form.done')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                textTransform: 'uppercase', fontSize: 26, color: 'var(--text-strong)',
                margin: '0 0 20px',
              }}>
                {t('testimonials.form.title')}
              </h2>

              <div className="nr-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label={t('testimonials.form.name')}
                  value={form.name}
                  onChange={set('name')}
                  placeholder={t('testimonials.form.namePh')}
                />
                <Input
                  label={t('testimonials.form.role')}
                  value={form.role}
                  onChange={set('role')}
                  placeholder={t('testimonials.form.rolePh')}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={fieldLabel}>{t('testimonials.form.rating')}</label>
                <StarPicker value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={fieldLabel}>{t('testimonials.form.text')}</label>
                <textarea
                  value={form.text}
                  onChange={set('text')}
                  placeholder={t('testimonials.form.textPh')}
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', padding: '12px',
                    background: 'var(--surface-sunken)',
                    fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
                    color: 'var(--text-strong)', resize: 'vertical', outline: 'none',
                    transition: 'border-color var(--dur-base)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--nr-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
              </div>

              {isTurnstileEnabled && (
                <div style={{ marginTop: 16 }}>
                  <Turnstile onToken={setToken} />
                </div>
              )}

              {error && (
                <p style={{ marginTop: 12, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>
                  {error}
                </p>
              )}

              <div style={{ marginTop: 24 }}>
                <Button
                  type="submit" variant="primary" size="lg" fullWidth
                  disabled={busy || (isTurnstileEnabled && !token)}
                >
                  {busy ? t('testimonials.form.sending') : t('testimonials.form.submit')}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function AddReviewModal({ open, onClose, onAdded }) {
  return (
    <AnimatePresence>
      {open && <ReviewDialog onClose={onClose} onAdded={onAdded} />}
    </AnimatePresence>
  );
}
