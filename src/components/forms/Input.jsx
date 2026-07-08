import React from 'react';

export function Input({
  label,
  hint,
  error,
  iconLeft,
  suffix,
  id,
  value,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  onChange,
  style,
  ...rest
}) {
  const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, fontFamily: 'var(--font-body)', ...style }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {label}
          {required && <span style={{ color: 'var(--nr-accent)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: disabled ? 'var(--surface-sunken)' : 'var(--surface-sunken)',
        border: `1px solid ${error ? 'var(--danger)' : focused ? 'var(--nr-accent)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0 12px', height: 44,
        boxShadow: focused && !error ? 'var(--focus-ring)' : 'none',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      }}>
        {iconLeft && (
          <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>{iconLeft}</span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
            color: 'var(--text-strong)', minWidth: 0,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          {...rest}
        />
        {suffix && (
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-body-sm)' }}>
            {suffix}
          </span>
        )}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 'var(--fs-caption)', color: error ? 'var(--danger)' : 'var(--text-muted)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
