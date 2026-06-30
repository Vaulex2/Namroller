import React from 'react';

export function Badge({ children, tone = 'dark', soft = false, style, ...rest }) {
  const solid = {
    dark:    { bg: 'var(--slate-900)',   fg: 'var(--white)' },
    accent:  { bg: 'var(--nr-accent)',   fg: 'var(--white)' },
    success: { bg: 'var(--success)',     fg: 'var(--white)' },
    warning: { bg: 'var(--warning)',     fg: 'var(--white)' },
    danger:  { bg: 'var(--danger)',      fg: 'var(--white)' },
    neutral: { bg: 'var(--slate-500)',   fg: 'var(--white)' },
  };
  const softMap = {
    dark:    { bg: 'var(--slate-100)',   fg: 'var(--slate-700)' },
    accent:  { bg: 'var(--orange-50)',   fg: 'var(--orange-600)' },
    success: { bg: 'var(--success-bg)',  fg: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)',  fg: 'var(--warning)' },
    danger:  { bg: 'var(--danger-bg)',   fg: 'var(--danger)' },
    neutral: { bg: 'var(--slate-100)',   fg: 'var(--slate-600)' },
  };
  const c = (soft ? softMap : solid)[tone] || (soft ? softMap : solid).dark;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--fw-semibold)',
        fontSize: '0.6875rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 'var(--radius-xs)',
        lineHeight: 1.3,
        background: c.bg,
        color: c.fg,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
