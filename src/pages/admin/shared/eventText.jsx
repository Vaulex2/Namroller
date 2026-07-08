import React from 'react';
import { Icon } from '../../Icon';

// Icon per quote_events row type. Shared by QuoteDetail's audit timeline and
// OverviewPanel's cross-entity activity feed so both render event text
// identically instead of duplicating the switch statement.
const EVENT_ICON = { status_change: 'arrow', price_set: 'dollar-sign', note: 'edit', assign: 'users' };

// Falls back to the raw value for timeline entries from a retired pipeline
// stage (e.g. "in_progress" from before the pipeline was simplified).
function statusLabel(t, s) {
  return t(`admin.status.${s}`, { defaultValue: s });
}

export function EventText({ ev, t, fmtMoney }) {
  if (ev.type === 'status_change') {
    return `${statusLabel(t, ev.from_status)} → ${statusLabel(t, ev.to_status)}`;
  }
  if (ev.type === 'price_set') {
    return t('admin.detail.eventPrice', { price: fmtMoney(ev.amount, ev.currency) });
  }
  if (ev.type === 'assign') {
    return ev.body ? t('admin.detail.eventAssign', { email: ev.body }) : t('admin.detail.eventUnassign');
  }
  return ev.body; // note
}

export function EventIcon({ type, size = 15 }) {
  return <Icon name={EVENT_ICON[type] || 'message-square'} size={size} color="var(--text-muted)" stroke={1.8} />;
}
