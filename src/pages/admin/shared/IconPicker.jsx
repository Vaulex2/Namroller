import React from 'react';
import { Icon } from '../../Icon';
import { PRODUCT_ICON_OPTIONS } from './constants';

/* Clickable grid of icon swatches, replacing a name-only <select> or (worse)
   a hand-typed comma list. `options` defaults to the curated product set;
   pass a smaller list for a more focused picker. */
export function IconPicker({ value, onChange, options = PRODUCT_ICON_OPTIONS, size = 30 }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((name) => {
        const selected = name === value;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            onClick={() => onChange(name)}
            style={{
              width: size, height: size, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              border: `1px solid ${selected ? 'var(--nr-accent)' : 'var(--border-default)'}`,
              background: selected ? 'var(--orange-50)' : 'var(--surface-sunken)',
            }}
          >
            <Icon name={name} size={16} color={selected ? 'var(--nr-accent)' : 'var(--text-muted)'} stroke={1.8} />
          </button>
        );
      })}
    </div>
  );
}
