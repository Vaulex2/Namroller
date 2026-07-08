import React from 'react';

/* Styled <select>, matching Input's label/box visual language. Replaces the
   near-identical inline `selectStyle` objects duplicated across QuotesPanel,
   QuoteDetail, and PriceForm. */
export function AdminSelect({ label, value, onChange, options, disabled = false, size = 'md', placeholder, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, ...style }}>
      {label && (
        <span style={{
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          padding: size === 'sm' ? '8px 10px' : '10px 12px',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-card)',
          color: 'var(--text-body)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-body-sm)',
          minWidth: size === 'sm' ? 100 : 160,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
