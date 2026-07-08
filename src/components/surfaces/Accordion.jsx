import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/* Reusable animated accordion — card style.
 *
 * items: [{ q, a }] — question / answer pairs.
 * Each item is its own rounded card; the open card gets an accent left-bar and a
 * raised look. Headers are real <button>s with aria-expanded / aria-controls for
 * keyboard and screen-reader access. Panels animate open/closed via height;
 * reduced-motion users get an instant show/hide. `allowMultiple` lets several
 * panels stay open at once (default: single-open). */

// Animated +/− glyph: horizontal bar always shown; vertical bar collapses when
// open (+ becomes −). Both bars are centred via an x/y −50% transform so the
// motion transform on the vertical bar keeps it centred while it scales.
function PlusMinus({ isOpen, reduce }) {
  const bar = {
    position: 'absolute', top: '50%', left: '50%',
    background: 'var(--nr-accent)', borderRadius: 2,
  };
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block', width: 18, height: 18, flexShrink: 0 }}>
      <span style={{ ...bar, width: 14, height: 2, transform: 'translate(-50%, -50%)' }} />
      <motion.span
        style={{ ...bar, width: 2, height: 14 }}
        initial={false}
        animate={{ x: '-50%', y: '-50%', scaleY: isOpen ? 0 : 1, opacity: reduce && isOpen ? 0 : 1 }}
        transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  );
}

function AccordionRow({ item, index, isOpen, onToggle }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = React.useState(false);
  const panelId = `acc-panel-${index}`;
  const btnId = `acc-btn-${index}`;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        marginBottom: 12,
        background: 'var(--surface-card)',
        border: '1px solid ' + (isOpen ? 'var(--border-default)' : 'var(--border-subtle)'),
        // Accent left-bar on the open card; transparent (same width) otherwise so
        // there is no layout shift when toggling.
        borderLeft: '3px solid ' + (isOpen ? 'var(--nr-accent)' : 'transparent'),
        borderRadius: 'var(--radius-md)',
        boxShadow: isOpen || hover ? 'var(--shadow-sm)' : 'none',
        overflow: 'hidden',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      }}
    >
      <h3 style={{ margin: 0 }}>
        <button
          id={btnId}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 15, lineHeight: 'var(--lh-snug)',
            color: isOpen ? 'var(--nr-accent)' : 'var(--text-strong)',
            letterSpacing: 'var(--ls-mega)',
            transition: 'color var(--dur-fast)',
          }}
        >
          <span>{item.q}</span>
          <PlusMinus isOpen={isOpen} reduce={reduce} />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            key="content"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{
              margin: 0, padding: '0 20px 20px',
              fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-body)',
              maxWidth: 760,
            }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Accordion({ items = [], allowMultiple = false, defaultOpen = null, style }) {
  const [open, setOpen] = React.useState(() => {
    if (defaultOpen === null || defaultOpen === undefined) return new Set();
    return new Set([defaultOpen]);
  });

  const toggle = (i) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div style={style}>
      {items.map((item, i) => (
        <AccordionRow
          key={i}
          item={item}
          index={i}
          isOpen={open.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
}
