import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '../../components/core/Badge';
import { Button } from '../../components/core/Button';
import { Card } from '../../components/surfaces/Card';
import { Input } from '../../components/forms/Input';
import { StaggerItem } from '../../components/motion/Stagger';
import { staggerContainer } from '../../components/motion/variants';
import { journalOverview, PROJECT_STATUSES } from '../../lib/admin';
import { useAdminResource } from '../../hooks/useAdminResource';
import { JournalDetail } from './JournalDetail';
import { AddProjectForm } from './AddProjectForm';
import { STATUS_TONE } from './statusTones';
import { StatCard } from './shared/StatCard';
import { AdminModal } from './shared/AdminModal';

const FILTERS = ['all', ...PROJECT_STATUSES];
const EMPTY_ROWS = [];

/* Journal: which clients we're actively doing work for right now — distinct
   from the Requests tab's intake pipeline. Scoped server-side to inquiries
   that have been accepted at least once (a project only exists from that
   point on), grouped by the project's own stage (in_progress/completed/
   cancelled), not the inquiry's status. Deliberately narrower than
   QuotesPanel: no bulk actions, no CSV export — this is a focused
   "what's in flight" view, not the full inquiry-management surface. */
export function JournalPanel() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [detailId, setDetailId] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const fetcher = React.useCallback(() => journalOverview(200), []);
  const { data, setData, loading, error, reload } = useAdminResource(fetcher);
  const stats = data?.stats ?? null;
  const allRows = data?.rows ?? EMPTY_ROWS;

  React.useEffect(() => { if (error) toast.error(t('admin.journal.loadError')); }, [error, t]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return [r.name, r.phone, r.email, r.product_name, r.assigned_email]
        .some((v) => v && String(v).toLowerCase().includes(q));
    });
  }, [allRows, filter, query]);

  // The detail modal reports deadline/price/status/etc. changes; patch the
  // list in place so it stays in sync without a full reload.
  const onDetailChanged = (id, patch) => {
    setData((d) => {
      if (!d) return d;
      const row = d.rows.find((r) => r.id === id);
      if (!row) return d;
      const nextStats = patch.status && patch.status !== row.status
        ? {
          ...d.stats,
          [row.status]: Math.max(0, (d.stats[row.status] ?? 0) - 1),
          [patch.status]: (d.stats[patch.status] ?? 0) + 1,
        }
        : d.stats;
      return { stats: nextStats, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
    });
  };

  const fmtMoney = (value, cur) => {
    try {
      return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
        maximumFractionDigits: 2,
      }).format(value) + ' ' + cur;
    } catch { return `${value} ${cur}`; }
  };

  const fmtDeadline = (isoDate) => {
    try {
      return new Date(isoDate + 'T00:00:00').toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU');
    } catch { return isoDate; }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Stat cards */}
      <div style={{
        display: 'grid', gap: 12, marginBottom: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      }}>
        <StatCard label={t('admin.journal.stats.total')} value={stats?.total} tone="dark" />
        {PROJECT_STATUSES.map((s) => (
          <StatCard key={s} label={t(`admin.status.${s}`)} value={stats?.[s]} tone={STATUS_TONE[s]} />
        ))}
      </div>

      {/* Search + refresh */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.journal.searchPh')}
          />
        </div>
        <Button variant="outline" size="md" disabled={loading} onClick={reload}>
          {t('admin.refresh')}
        </Button>
        <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
          {t('admin.journal.addProject')}
        </Button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? t('admin.journal.filterAll') : t(`admin.status.${f}`)}
          </Button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{t('admin.journal.loadError')}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.journal.empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)', margin: 0 }}>
            {t('admin.journal.showing', { n: rows.length })}
          </p>
          <motion.div
            key={filter + '::' + query}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {rows.map((r) => {
              const overdue = r.status === 'in_progress' && r.deadline && r.deadline < today;
              return (
                <StaggerItem key={r.id}>
                  <Card variant="outline" padding={20}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-body-lg)' }}>{r.name}</strong>
                          <Badge tone={STATUS_TONE[r.status] || 'neutral'} soft>{t(`admin.status.${r.status}`)}</Badge>
                          {r.deadline && (
                            <Badge tone={overdue ? 'danger' : 'neutral'} soft>
                              {t('admin.journal.deadline')}: {fmtDeadline(r.deadline)}
                            </Badge>
                          )}
                        </div>
                        <div style={{ marginTop: 8, display: 'grid', gap: 4, fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}>
                          <Field label={t('admin.quotes.phone')}><a href={'tel:' + r.phone} style={linkStyle}>{r.phone}</a></Field>
                          {r.product_name && <Field label={t('admin.quotes.product')}>{r.product_name}</Field>}
                          {r.preferred_deadline && (
                            <Field label={t('admin.quotes.preferredDeadline')}>{fmtDeadline(r.preferred_deadline)}</Field>
                          )}
                          {r.price_amount != null && (
                            <Field label={t('admin.detail.price')}>{fmtMoney(r.price_amount, r.price_currency)}</Field>
                          )}
                          {r.assigned_email && <Field label={t('admin.quotes.assignee')}>{r.assigned_email}</Field>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                        <Button variant="outline" size="sm" onClick={() => setDetailId(r.id)}>
                          {t('admin.journal.details')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </motion.div>
        </div>
      )}

      {detailId && (
        <JournalDetail
          id={detailId}
          onClose={() => setDetailId(null)}
          onChanged={onDetailChanged}
        />
      )}

      {addOpen && (
        <AdminModal onClose={() => setAddOpen(false)} closeLabel={t('admin.detail.close')} title={t('admin.journal.addProject')}>
          <AddProjectForm
            onSaved={() => { setAddOpen(false); reload(); }}
            onCancel={() => setAddOpen(false)}
          />
        </AdminModal>
      )}
    </div>
  );
}

const linkStyle = { color: 'var(--nr-accent)', textDecoration: 'none' };

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 84 }}>{label}:</span>
      <span style={{ color: 'var(--text-body)', wordBreak: 'break-word' }}>{children}</span>
    </div>
  );
}
