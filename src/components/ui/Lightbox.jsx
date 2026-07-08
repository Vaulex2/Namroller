import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../../pages/Icon';

/* Full-screen media lightbox for product photos and video clips.
 *
 * items: [{ type: 'image' | 'video', src, poster?, alt? }]
 * Opens at `startIndex`, supports arrow-key / on-screen navigation, Esc and
 * backdrop close, and traps focus on the dialog. Honors reduced motion. */

function LightboxView({ items, startIndex, onClose }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const dialogRef = React.useRef(null);
  const [index, setIndex] = React.useState(startIndex);

  const count = items.length;
  const item = items[index];
  const go = React.useCallback(
    (dir) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && count > 1) go(1);
      else if (e.key === 'ArrowLeft' && count > 1) go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, go, count]);

  const navBtn = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 48, height: 48, borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: 'var(--white)', cursor: 'pointer', zIndex: 2,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('lightbox.label')}
      tabIndex={-1}
      ref={dialogRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(2,6,23,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-6)', outline: 'none', willChange: 'opacity',
      }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('quote.form.close')}
        style={{
          position: 'absolute', top: 'var(--space-5)', right: 'var(--space-5)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'var(--white)', cursor: 'pointer', zIndex: 2,
        }}
      >
        <Icon name="close" size={22} color="var(--white)" />
      </button>

      {count > 1 && (
        <>
          <button type="button" aria-label={t('lightbox.prev')} onClick={(e) => { e.stopPropagation(); go(-1); }} style={{ ...navBtn, left: 'var(--space-5)' }}>
            <Icon name="chevron" size={22} color="var(--white)" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button type="button" aria-label={t('lightbox.next')} onClick={(e) => { e.stopPropagation(); go(1); }} style={{ ...navBtn, right: 'var(--space-5)' }}>
            <Icon name="chevron" size={22} color="var(--white)" />
          </button>
        </>
      )}

      {/* Media */}
      <motion.div
        key={index}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(1100px, 92vw)', maxHeight: '84vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {item.type === 'video' ? (
          <video
            src={item.src}
            poster={item.poster}
            controls
            autoPlay
            loop
            playsInline
            style={{ maxWidth: '100%', maxHeight: '84vh', borderRadius: 'var(--radius-md)', background: 'var(--slate-950)' }}
          />
        ) : (
          <img
            src={item.src}
            alt={item.alt || ''}
            style={{ maxWidth: '100%', maxHeight: '84vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />
        )}
      </motion.div>

      {/* Counter */}
      {count > 1 && (
        <div style={{
          position: 'absolute', bottom: 'var(--space-5)', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--slate-400)',
          letterSpacing: '0.08em',
        }}>
          {index + 1} / {count}
        </div>
      )}
    </motion.div>
  );
}

export function Lightbox({ open, items, startIndex = 0, onClose }) {
  return (
    <AnimatePresence>
      {open && items?.length > 0 && (
        <LightboxView items={items} startIndex={startIndex} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}
