import React from 'react';
import { Icon } from '../../Icon';

/* Star rating display, replacing the literal '★'.repeat(...) text in
   ReviewsPanel. Mirrors the exact fill/stroke logic of the public `Stars`
   component in src/components/ui/testimonials-columns-1.tsx (same colors,
   same rounding) so admin and public ratings render identically — now via
   the shared Icon component's `fill` prop instead of a second bespoke inline
   <svg>. */
export function StarRating({ rating, size = 14 }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} aria-label={`${r} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          stroke={1.5}
          fill={i < r ? 'var(--nr-accent)' : 'transparent'}
          color={i < r ? 'var(--nr-accent)' : 'var(--border-default)'}
        />
      ))}
    </span>
  );
}
