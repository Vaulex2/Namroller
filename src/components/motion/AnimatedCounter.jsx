import React from 'react';
import { useInView, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { useScrollContainer } from './ScrollContext';

// Grouping separator between digits (\s also matches non-breaking space) or comma.
const GROUPED_RE = /\d[\s,]\d/;
// Trailing non-digit, non-space suffix (e.g. "+").
const SUFFIX_RE = /[^\d\s]+\s*$/;

/* Rolls a number from 0 to its target the first time it scrolls into view.
   Accepts the original display string (e.g. "12 000", "240+", "18") and
   preserves its grouping separator and trailing suffix. Under reduced motion
   (or if no number is found) it just renders the original string. */
export function AnimatedCounter({ value, duration = 1.4, style }) {
  const reduce = useReducedMotion();
  const scrollRef = useScrollContainer();
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5, root: scrollRef });
  const mv = useMotionValue(0);

  // Parse: digits only -> target; remember grouping + trailing suffix.
  const digits = String(value).replace(/[^\d]/g, '');
  const target = parseInt(digits, 10);
  const grouped = GROUPED_RE.test(String(value));
  const suffix = (String(value).match(SUFFIX_RE) || [''])[0];

  const format = React.useCallback(
    (n) => {
      const rounded = Math.round(n);
      const str = grouped
        ? rounded.toLocaleString('ru-RU') // space thousands grouping
        : String(rounded);
      return str + suffix;
    },
    [grouped, suffix]
  );

  React.useEffect(() => {
    if (reduce || Number.isNaN(target) || !inView) return;
    const controls = animate(mv, target, { duration, ease: [0.22, 1, 0.36, 1] });
    const unsub = mv.on('change', (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
    return () => { controls.stop(); unsub(); };
  }, [inView, reduce, target, duration, mv, format]);

  // Initial text: 0 while waiting to animate, or the original value otherwise.
  const initial = reduce || Number.isNaN(target) ? String(value) : format(0);

  return <span ref={ref} style={style}>{initial}</span>;
}
