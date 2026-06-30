import React from 'react';

export function Card({ children, variant = 'default', accentBar = false, padding = 24, style, ...rest }) {
  const variants = {
    default: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      color: 'var(--text-body)',
    },
    outline: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      boxShadow: 'none',
      color: 'var(--text-body)',
    },
    navy: {
      background: 'var(--surface-inverse)',
      border: '1px solid var(--border-on-inverse)',
      boxShadow: 'var(--shadow-lg)',
      color: 'var(--text-on-inverse)',
    },
    sunken: {
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'none',
      color: 'var(--text-body)',
    },
  };
  const v = variants[variant] || variants.default;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        padding,
        overflow: 'hidden',
        ...v,
        ...style,
      }}
      {...rest}
    >
      {accentBar && (
        <span style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'var(--nr-accent)',
        }} />
      )}
      {children}
    </div>
  );
}
