import React from 'react';

export function Stat({ value, unit, label, tone = 'dark', style, ...rest }) {
  const tones = {
    dark:   { value: 'var(--text-strong)', label: 'var(--text-muted)' },
    accent: { value: 'var(--nr-accent)',   label: 'var(--text-muted)' },
    light:  { value: 'var(--white)',       label: 'var(--slate-400)' },
  };
  const t = tones[tone] || tones.dark;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }} {...rest}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 4,
        fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
        fontSize: 'clamp(2.25rem, 4vw, 3rem)', lineHeight: 1,
        color: t.value,
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: '0.4em', fontWeight: 'var(--fw-bold)', color: 'var(--nr-accent)' }}>
            {unit}
          </span>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--fs-overline)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: t.label,
      }}>
        {label}
      </div>
    </div>
  );
}
