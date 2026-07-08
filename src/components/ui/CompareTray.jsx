import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '../core/Button';
import { Icon } from '../../pages/Icon';
import { Photo } from '../../pages/Photo';
import { QuoteModal } from '../../pages/QuoteModal';
import { useProducts } from '../../hooks/useProducts';
import { useCompare } from '../../hooks/useCompare';

const toKey = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/* Side-by-side spec comparison. Builds the union of spec labels across the
   selected products (preserving first-seen order) and fills "—" where a
   product lacks that spec. */
function CompareModal({ products, onClose, onRequestQuote }) {
  const { t } = useTranslation();

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // Union of spec labels (raw English keys), first-seen order preserved.
  const labels = [];
  products.forEach((p) => p.specs.forEach((s) => {
    if (!labels.includes(s.label)) labels.push(s.label);
  }));

  const cellPad = '12px 14px';
  const border = '1px solid var(--border-subtle)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,6,23,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-6)', willChange: 'opacity',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('compare.title')}
        style={{
          width: '100%', maxWidth: 900, maxHeight: '86vh',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}
      >
        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--nr-accent)' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '20px 24px 16px', borderBottom: border, flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 22, color: 'var(--text-strong)', margin: 0,
          }}>
            {t('compare.title')}
          </h2>
          <button
            type="button" onClick={onClose} aria-label={t('quote.form.close')}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Scrollable comparison grid */}
        <div style={{ overflow: 'auto', padding: '4px 0 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr>
                <th style={{
                  position: 'sticky', left: 0, zIndex: 1,
                  background: 'var(--surface-card)', borderBottom: border,
                  padding: cellPad, textAlign: 'left', minWidth: 130,
                }} />
                {products.map((p) => {
                  const name = t(`pd.${p.id}.name`, p.name);
                  return (
                    <th key={p.id} style={{
                      borderBottom: border, borderLeft: border,
                      padding: '14px', textAlign: 'center', verticalAlign: 'top',
                      minWidth: 150,
                    }}>
                      <Photo
                        label="" src={p.image} alt={name} icon={p.icon} height={72}
                        style={{ borderRadius: 'var(--radius-sm)', border: border, marginBottom: 10 }}
                      />
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                        textTransform: 'uppercase', fontSize: 13, lineHeight: 'var(--lh-snug)',
                        color: 'var(--text-strong)',
                      }}>
                        {name}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={label} style={{ background: i % 2 ? 'var(--surface-sunken)' : 'var(--surface-card)' }}>
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 1,
                    background: 'inherit', borderBottom: border,
                    padding: cellPad, fontSize: 'var(--fs-body-sm)', color: 'var(--text-muted)',
                  }}>
                    {t(`sl.${toKey(label)}`, label)}
                  </td>
                  {products.map((p) => {
                    const spec = p.specs.find((s) => s.label === label);
                    return (
                      <td key={p.id} style={{
                        borderBottom: border, borderLeft: border,
                        padding: cellPad, textAlign: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-body-sm)',
                        fontVariantNumeric: 'tabular-nums',
                        color: spec ? 'var(--text-strong)' : 'var(--text-subtle)',
                      }}>
                        {spec ? (
                          <>
                            {t(`sv.${toKey(spec.value)}`, spec.value)}
                            {spec.unit && <span style={{ color: 'var(--text-subtle)', marginLeft: 4 }}>{spec.unit}</span>}
                          </>
                        ) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer CTA */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          padding: '16px 24px', borderTop: border, flexShrink: 0,
        }}>
          <Button variant="primary" size="lg" onClick={onRequestQuote}>
            {t('compare.requestAll')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* Slide-up shortlist bar (mirrors the ContactDock floating pattern). Shows
   selected thumbnails, opens the side-by-side CompareModal, and hands the
   shortlist to the existing QuoteModal / Supabase pipeline. */
export function CompareTray() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { ids, count, remove, clear } = useCompare();
  const { products: allProducts } = useProducts();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [quoteOpen, setQuoteOpen] = React.useState(false);

  // Resolve ids → products in catalog order.
  const products = allProducts.filter((p) => ids.includes(p.id));

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', left: '50%', bottom: 'var(--space-5)',
              transform: 'translateX(-50%)', zIndex: 88,
              width: 'min(720px, calc(100vw - 2 * var(--space-4)))',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--nr-accent)' }} />
            <div className="nr-compare-tray" style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 18px', flexWrap: 'wrap',
            }}>
              {/* Thumbnails */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {t('compare.tray', { n: count })}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {products.map((p) => {
                    const name = t(`pd.${p.id}.name`, p.name);
                    return (
                      <div key={p.id} style={{ position: 'relative', width: 48, height: 40 }}>
                        <Photo
                          label="" src={p.image} alt={name} icon={p.icon} height={40}
                          style={{ borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}
                        />
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          aria-label={`${t('compare.remove')} ${name}`}
                          title={t('compare.remove')}
                          style={{
                            position: 'absolute', top: -8, right: -8,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--slate-900)', color: 'var(--white)',
                            border: '1px solid var(--surface-card)', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          <Icon name="close" size={13} color="var(--white)" stroke={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={clear}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
                    fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                    fontSize: 'var(--fs-body-sm)', color: 'var(--text-muted)',
                  }}
                >
                  {t('compare.clear')}
                </button>
                <Button
                  variant="primary" size="md"
                  onClick={() => setModalOpen(true)}
                  disabled={count < 2}
                  iconLeft={<Icon name="layers" size={16} color="var(--white)" />}
                >
                  {t('compare.open')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <CompareModal
            products={products}
            onClose={() => setModalOpen(false)}
            onRequestQuote={() => { setModalOpen(false); setQuoteOpen(true); }}
          />
        )}
      </AnimatePresence>

      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} products={products} />

      <style>{`
        @media (max-width: 560px) {
          .nr-compare-tray { justify-content: center; }
        }
      `}</style>
    </>
  );
}
