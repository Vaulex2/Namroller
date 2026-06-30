import React from 'react';

export function SpecTable({ rows = [], title, style, ...rest }) {
  return (
    <div style={{
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--surface-card)',
      ...style,
    }} {...rest}>
      {title && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--surface-inverse)', color: 'var(--white)',
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-overline)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {title}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? 'var(--surface-sunken)' : 'var(--surface-card)' }}>
              <td style={{
                padding: '10px 16px', fontSize: 'var(--fs-body-sm)', color: 'var(--text-muted)',
                borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                width: '55%',
              }}>
                {r.label}
              </td>
              <td style={{
                padding: '10px 16px', textAlign: 'right',
                fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-medium)',
                fontSize: 'var(--fs-body-sm)', color: 'var(--text-strong)',
                fontVariantNumeric: 'tabular-nums',
                borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                {r.value}
                {r.unit && <span style={{ color: 'var(--text-subtle)', marginLeft: 4 }}>{r.unit}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
