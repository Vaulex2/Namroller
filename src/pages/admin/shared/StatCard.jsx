import React from 'react';
import { Card } from '../../../components/surfaces/Card';
import { Icon } from '../../Icon';

const TONE_COLOR = {
  dark: 'var(--text-strong)', warning: 'var(--warning)', accent: 'var(--nr-accent)',
  success: 'var(--success)', danger: 'var(--danger)', neutral: 'var(--text-muted)',
};

/* Shared KPI tile used by Quotes / Analytics / Overview. `onClick` (optional)
   makes the tile a jump-to-tab affordance in Overview; unused elsewhere. */
export function StatCard({ label, value, tone = 'dark', icon, onClick, children }) {
  const accent = TONE_COLOR[tone] || TONE_COLOR.dark;
  return (
    <Card
      variant="sunken"
      padding={16}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <Icon name={icon} size={14} color="var(--text-muted)" stroke={2} />}
        <div style={{
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 28, color: accent, marginTop: 6 }}>
        {value ?? '—'}
      </div>
      {children}
    </Card>
  );
}
