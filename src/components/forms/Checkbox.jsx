import React from 'react';

export function Checkbox({ label, checked = false, onChange, disabled = false, id, style, ...rest }) {
  const cbId = id || (label ? 'cb-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <label
      htmlFor={cbId}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
        color: 'var(--text-body)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, ...style,
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, flexShrink: 0,
        borderRadius: 'var(--radius-xs)',
        border: `1px solid ${checked ? 'var(--nr-accent)' : 'var(--border-default)'}`,
        background: checked ? 'var(--nr-accent)' : 'var(--surface-card)',
        transition: 'background var(--dur-fast), border-color var(--dur-fast)',
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        id={cbId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      {label}
    </label>
  );
}
