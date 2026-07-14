import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/core/Button';
import { Input } from '../components/forms/Input';
import { Card } from '../components/surfaces/Card';
import { Icon } from './Icon';
import { submitQuote } from '../lib/quotes';
import { Turnstile } from '../components/forms/Turnstile';
import { isTurnstileEnabled } from '../lib/turnstile';

const fieldLabel = {
  display: 'block', marginBottom: 6,
  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
  fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

/* Dialog body — mounted only while open, so each open starts with fresh state
   (no state-reset effect needed).

   Accepts a single `product` (product page) or a `products` array (compare
   tray → bundled quote). When multiple are passed, their names are listed in
   the note and folded into the productName so the whole shortlist reaches
   sales in one message. */
function QuoteDialog({ onClose, product, products }) {
  const { t, i18n } = useTranslation();

  const list = products && products.length ? products : product ? [product] : [];
  const names = list.map((p) => t(`pd.${p.id}.name`, p.name));
  const isBundle = list.length > 1;
  const productName = names.join(', ');

  const [form, setForm] = React.useState({
    name: '', phone: '', email: '', quantity: '',
    // Prefill the note with the shortlist so the buyer can edit around it.
    note: isBundle ? `${t('compare.quoteNote')}\n${names.map((n) => `• ${n}`).join('\n')}` : '',
  });
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
    if (!form.name.trim() || !form.phone.trim()) {
      setError(t('quote.form.required'));
      return;
    }
    if (isTurnstileEnabled && !token) {
      setError(t('quote.form.captcha'));
      return;
    }
    setBusy(true); setError('');
    try {
      await submitQuote({
        productId: list.length === 1 ? list[0].id : undefined,
        productName: list.map((p) => p.name).join(', ') || undefined,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        quantity: form.quantity.trim(),
        note: form.note.trim(),
        lang: i18n.language,
        source: isBundle
          ? `Compare tray · ${list.length} products`
          : `Product page · ${list[0]?.name || list[0]?.id || '—'}`,
        token,
      });
      setDone(true);
    } catch {
      setError(t('quote.form.error'));
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
      transition={{ duration: 0.2, ease: 'linear' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        // Solid scrim (no backdrop-filter): blurring the whole product page
        // behind the overlay every frame is what made the open janky.
        background: 'rgba(2,6,23,0.72)',
        // overflowY:auto + block layout (not flex-centered) so the overlay
        // itself scrolls when content is taller than the viewport — critical
        // on mobile where the virtual keyboard can shrink visible height
        // enough to clip the top of the form with no way to scroll back to it.
        overflowY: 'auto',
        padding: 'var(--space-6) var(--space-4)',
        willChange: 'opacity',
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
            aria-label={t('quote.form.close')}
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
                {t('quote.form.successTitle')}
              </h2>
              <p style={{ marginTop: 12, color: 'var(--text-body)', fontSize: 'var(--fs-body)' }}>
                {t('quote.form.successBody')}
              </p>
              <div style={{ marginTop: 24 }}>
                <Button variant="primary" onClick={onClose}>
                  {t('quote.form.done')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                textTransform: 'uppercase', fontSize: 26, color: 'var(--text-strong)',
                margin: '0 0 4px',
              }}>
                {t('quote.form.title')}
              </h2>
              {productName && (
                <p style={{
                  margin: '0 0 20px',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body-sm)',
                  color: 'var(--text-muted)',
                }}>
                  {isBundle
                    ? t('compare.quoteSubtitle', { n: list.length })
                    : t('quote.form.subtitle', { product: productName })}
                </p>
              )}

              <div className="nr-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label={t('quote.form.name')}
                  value={form.name}
                  onChange={set('name')}
                  placeholder={t('quote.form.namePh')}
                  required
                  iconLeft={<Icon name="user" size={16} />}
                />
                <Input
                  label={t('quote.form.phone')}
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder={t('quote.form.phonePh')}
                  required
                  iconLeft={<Icon name="phone" size={16} />}
                />
              </div>

              <div className="nr-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <Input
                  label={t('quote.form.email')}
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder={t('quote.form.emailPh')}
                  iconLeft={<Icon name="mail" size={16} />}
                />
                <Input
                  label={t('quote.form.quantity')}
                  value={form.quantity}
                  onChange={set('quantity')}
                  placeholder={t('quote.form.quantityPh')}
                  iconLeft={<Icon name="package" size={16} />}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={fieldLabel}>{t('quote.form.note')}</label>
                <textarea
                  value={form.note}
                  onChange={set('note')}
                  placeholder={t('quote.form.notePh')}
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
                  {busy ? t('quote.form.sending') : t('quote.form.submit')}
                </Button>
              </div>

              <div style={{
                marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start',
                color: 'var(--text-muted)', fontSize: 'var(--fs-caption)',
              }}>
                <Icon name="shield" size={15} color="var(--success)" style={{ marginTop: 1 }} />
                <span>{t('quote.form.privacy')}</span>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function QuoteModal({ open, onClose, product, products }) {
  return (
    <AnimatePresence>
      {open && <QuoteDialog onClose={onClose} product={product} products={products} />}
    </AnimatePresence>
  );
}
