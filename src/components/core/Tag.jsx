import React from 'react';

export function Tag({ children, onRemove, active = false, style, ...rest }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        fontSize: '0.8125rem',
        padding: onRemove ? '5px 6px 5px 12px' : '6px 14px',
        borderRadius: 'var(--radius-sm)',
        lineHeight: 1.3,
        background: active ? 'var(--nr-accent)' : 'var(--surface-sunken)',
        color: active ? 'var(--white)' : 'var(--text-body)',
        border: active ? '1px solid var(--nr-accent)' : '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background var(--dur-fast), color var(--dur-fast), border-color var(--dur-fast)',
        ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18, height: 18,
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
            background: active ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)',
            color: 'inherit',
            fontSize: 13, lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
