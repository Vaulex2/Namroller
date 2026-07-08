import React from 'react';

/* Generic admin data table — zebra rows, optional select-all checkbox column,
   optional per-row actions column. Modeled on the existing zebra-row
   convention in components/surfaces/SpecTable.jsx, extended with a header row.
   Used by ReviewsPanel and ProductsPanel (genuinely tabular data); QuotesPanel
   and VideosPanel keep their card-based rows since that content (pipeline
   stepper, inline price form, media preview) doesn't compress into cells. */
export function AdminTable({
  columns,
  rows,
  rowKey,
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
  loading = false,
  error = null,
  emptyMessage,
  renderRowActions,
}) {
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (rows.length === 0) return <p style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>;

  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds?.has(rowKey(r)));

  return (
    <div style={{
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--surface-card)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr style={{ background: 'var(--surface-inverse)' }}>
            {selectable && (
              <th style={{ width: 36, padding: '10px 12px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all"
                  style={{ accentColor: 'var(--nr-accent)' }}
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  padding: '10px 16px', textAlign: c.align || 'left',
                  color: 'var(--white)', fontWeight: 'var(--fw-semibold)',
                  fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  width: c.width,
                }}
              >
                {c.header}
              </th>
            ))}
            {renderRowActions && <th style={{ width: 1 }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey(row);
            return (
              <tr key={key} style={{ background: i % 2 ? 'var(--surface-sunken)' : 'var(--surface-card)' }}>
                {selectable && (
                  <td style={{ padding: '10px 12px', borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(key) ?? false}
                      onChange={() => onToggleRow(key)}
                      aria-label="Select row"
                      style={{ accentColor: 'var(--nr-accent)' }}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '10px 16px', textAlign: c.align || 'left',
                      fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)',
                      borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      verticalAlign: 'top',
                    }}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {renderRowActions && (
                  <td style={{
                    padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap',
                    borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    {renderRowActions(row)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
