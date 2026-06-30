import React from 'react';

export function Select({ label, options = [], value, onChange, id, disabled = false, style, ...rest }) {
  const selId = id || (label ? 'sel-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const norm = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-body)', ...style }}>
      {label && (
        <label htmlFor={selId} style={{
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          id={selId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            appearance: 'none', WebkitAppearance: 'none',
            width: '100%', height: 44, padding: '0 36px 0 12px',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
            color: 'var(--text-strong)',
            cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none',
            transition: 'border-color var(--dur-base)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--nr-accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          {...rest}
        >
          {norm.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 10,
        }}>▼</span>
      </div>
    </div>
  );
}
