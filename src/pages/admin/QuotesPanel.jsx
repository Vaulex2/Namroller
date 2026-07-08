import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Badge } from '../../components/core/Badge';
import { Card } from '../../components/surfaces/Card';
import { Input } from '../../components/forms/Input';
import { StaggerItem } from '../../components/motion/Stagger';
import { staggerContainer } from '../../components/motion/variants';
import {
  quotesOverview, setQuoteStatus, bulkSetQuoteStatus, exportQuotesCsv, deleteQuote,
  QUOTE_STATUSES, nextQuoteAction,
} from '../../lib/admin';
import { useAdminResource } from '../../hooks/useAdminResource';
import { QuoteDetail } from './QuoteDetail';
import { PriceForm } from './PriceForm';
import { STATUS_TONE } from './statusTones';
import { StatCard } from './shared/StatCard';
import { AdminSelect } from './shared/AdminSelect';
import { STALE_MS } from './shared/constants';

const FILTERS = ['all', ...QUOTE_STATUSES];
const EMPTY_ROWS = [];

// Move one status count to another when a row's status changes. `to: null`
// means the row was deleted — decrement `from` and the total, add nothing.
function adjustStats(stats, from, to) {
  if (!stats) return stats;
  const next = { ...stats };
  if (from in next) next[from] = Math.max(0, next[from] - 1);
  if (to === null) next.total = Math.max(0, next.total - 1);
  else if (to in next) next[to] = next[to] + 1;
  return next;
}

/* Requests ("bookings"): stat cards + a list presented as a 3-stage funnel —
   Accept -> Set price -> Finish (backed by the same 3 stored statuses as
   before; "priced" is derived from status==='accepted' plus a price existing,
   not a stored value — see nextQuoteAction). Loads everything in ONE
   edge-function call, then filters/searches entirely client-side (instant, no
   network). Each row shows a single forward action button for its next step;
   backward/undo transitions live only in the details modal. Row actions
   update optimistically; the detail modal (timeline, price, notes,
   assignment) reports changes back so the list stays in sync without a
   reload. */
export function QuotesPanel() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState(null);
  const [detailId, setDetailId] = React.useState(null);
  const [priceFormRowId, setPriceFormRowId] = React.useState(null);
  const [selected, setSelected] = React.useState(() => new Set());
  const [bulkTarget, setBulkTarget] = React.useState('accepted');
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  // Stamp staleness at fetch time (Date.now() is impure — not during render).
  // Only "new" (not yet viewed) can go stale.
  const fetcher = React.useCallback(async () => {
    const res = await quotesOverview(200);
    const staleBefore = Date.now() - STALE_MS;
    const rows = res.rows.map((r) => ({
      ...r,
      _stale: r.status === 'new' && new Date(r.created_at).getTime() < staleBefore,
    }));
    return { stats: res.stats, rows };
  }, []);

  const { data, setData, loading, error, reload } = useAdminResource(fetcher);
  const stats = data?.stats ?? null;
  const allRows = data?.rows ?? EMPTY_ROWS;

  React.useEffect(() => { if (error) toast.error(t('admin.quotes.loadError')); }, [error, t]);

  const refresh = () => { setSelected(new Set()); reload(); };

  // Filtering + search happen in memory — no round trip per keystroke/tab.
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return [r.name, r.phone, r.email, r.product_name, r.note, r.source, r.assigned_email]
        .some((v) => v && String(v).toLowerCase().includes(q));
    });
  }, [allRows, filter, query]);

  const act = async (id, status) => {
    const row = allRows.find((r) => r.id === id);
    if (!row || row.status === status) return;
    const prev = data;
    setBusyId(id);
    // Optimistic: reflect the change instantly, then confirm with the server.
    setData((d) => ({
      stats: adjustStats(d.stats, row.status, status),
      rows: d.rows.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
    try {
      await setQuoteStatus(id, status);
    } catch {
      setData(prev); // revert
      toast.error(t('admin.quotes.actionError'));
    } finally {
      setBusyId(null);
    }
  };

  // The detail modal reports status/assignment changes; patch the list in
  // place. patch === null means the inquiry was deleted from the detail view.
  const onDetailChanged = (id, patch) => {
    setData((d) => {
      const row = d.rows.find((r) => r.id === id);
      if (!row) return d;
      if (patch === null) {
        return { stats: adjustStats(d.stats, row.status, null), rows: d.rows.filter((r) => r.id !== id) };
      }
      const nextStats = patch.status && patch.status !== row.status
        ? adjustStats(d.stats, row.status, patch.status)
        : d.stats;
      return { stats: nextStats, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
    });
  };

  const remove = async (row) => {
    if (!window.confirm(t('admin.quotes.confirmDelete'))) return;
    const prev = data;
    setBusyId(row.id);
    setData((d) => ({
      stats: adjustStats(d.stats, row.status, null),
      rows: d.rows.filter((r) => r.id !== row.id),
    }));
    try {
      await deleteQuote(row.id);
      toast.success(t('admin.quotes.delete'));
    } catch {
      setData(prev);
      toast.error(t('admin.quotes.actionError'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runBulk = async () => {
    const ids = [...selected].slice(0, 50);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const { done, skipped } = await bulkSetQuoteStatus(ids, bulkTarget);
      toast.success(t('admin.quotes.bulkDone', { done, skipped: skipped.length }));
      refresh();
    } catch {
      toast.error(t('admin.quotes.actionError'));
    } finally {
      setBulkBusy(false);
    }
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const csv = await exportQuotesCsv(filter === 'all' ? undefined : filter);
      // BOM so Excel opens the UTF-8 file with Cyrillic intact.
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotes-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('admin.quotes.actionError'));
    } finally {
      setExporting(false);
    }
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'); }
    catch { return iso; }
  };

  const fmtMoney = (value, cur) => {
    try {
      return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
        maximumFractionDigits: 2,
      }).format(value) + ' ' + cur;
    } catch { return `${value} ${cur}`; }
  };

  return (
    <div>
      {/* Stat cards — one per pipeline stage */}
      <div style={{
        display: 'grid', gap: 12, marginBottom: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      }}>
        <StatCard label={t('admin.stats.total')} value={stats?.total} tone="dark" />
        {QUOTE_STATUSES.map((s) => (
          <StatCard key={s} label={t(`admin.status.${s}`)} value={stats?.[s]} tone={STATUS_TONE[s]} />
        ))}
      </div>

      {/* Search + refresh + export */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.quotes.searchPh')}
          />
        </div>
        <Button variant="outline" size="md" disabled={loading} onClick={refresh}>
          {t('admin.refresh')}
        </Button>
        <Button variant="outline" size="md" disabled={exporting || loading} onClick={downloadCsv}>
          {exporting ? t('admin.quotes.exporting') : t('admin.quotes.exportCsv')}
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
            {f === 'all' ? t('admin.quotes.filterAll') : t(`admin.status.${f}`)}
          </Button>
        ))}
      </div>

      {/* Bulk action bar (appears when rows are checked) */}
      {selected.size > 0 && (
        <Card variant="sunken" padding={12} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}>
              {t('admin.quotes.selected', { n: selected.size })}
            </span>
            <AdminSelect
              size="sm"
              value={bulkTarget}
              onChange={(e) => setBulkTarget(e.target.value)}
              options={QUOTE_STATUSES.map((s) => ({ value: s, label: t(`admin.status.${s}`) }))}
            />
            <Button variant="primary" size="sm" disabled={bulkBusy} onClick={runBulk}>
              {t('admin.quotes.bulkApply')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              {t('admin.quotes.bulkClear')}
            </Button>
          </div>
        </Card>
      )}

      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{t('admin.quotes.loadError')}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.quotes.empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)', margin: 0 }}>
            {t('admin.quotes.showing', { n: rows.length })}
          </p>
          {/* Mount-triggered (not scroll/whileInView) — this list re-renders on every
              filter/search change while already on-screen, so a viewport-visibility
              trigger would depend on scroll position and could fail to re-arm. */}
          <motion.div
            key={filter + '::' + query}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {rows.map((r) => (
              <StaggerItem key={r.id}>
                <Card variant="outline" padding={20}>
              <div style={{ display: 'flex', gap: 14 }}>
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleSelected(r.id)}
                  aria-label={t('admin.quotes.selectRow')}
                  style={{ marginTop: 4, accentColor: 'var(--nr-accent)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-body-lg)' }}>{r.name}</strong>
                      <Badge tone={STATUS_TONE[r.status] || 'neutral'} soft>{t(`admin.status.${r.status}`)}</Badge>
                      {r._stale && <Badge tone="danger" soft>{t('admin.quotes.stale')}</Badge>}
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>{fmtDate(r.created_at)}</span>
                    </div>
                    <PipelineStepper
                      status={r.status}
                      priced={r.price_amount != null}
                      priceLabel={r.price_amount != null ? fmtMoney(r.price_amount, r.price_currency) : null}
                      t={t}
                    />
                    <div style={{ marginTop: 8, display: 'grid', gap: 4, fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}>
                      <Field label={t('admin.quotes.phone')}><a href={'tel:' + r.phone} style={linkStyle}>{r.phone}</a></Field>
                      {r.email && <Field label={t('admin.quotes.email')}><a href={'mailto:' + r.email} style={linkStyle}>{r.email}</a></Field>}
                      {r.product_name && <Field label={t('admin.quotes.product')}>{r.product_name}</Field>}
                      {r.quantity && <Field label={t('admin.quotes.quantity')}>{r.quantity}</Field>}
                      {r.assigned_email && <Field label={t('admin.quotes.assignee')}>{r.assigned_email}</Field>}
                    </div>
                    {priceFormRowId === r.id && (
                      <div style={{ marginTop: 10 }}>
                        <PriceForm
                          quoteId={r.id}
                          size="sm"
                          autoFocus
                          onSubmitted={() => { setPriceFormRowId(null); refresh(); }}
                          onError={(msg) => toast.error(msg)}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
                    {/* ONE primary button: the next required step for this row.
                        Backward/undo transitions live only in the details modal. */}
                    {(() => {
                      const next = nextQuoteAction(r);
                      if (next.kind === 'accept') {
                        return (
                          <Button variant="primary" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, 'accepted')}>
                            {t('admin.quotes.acceptAction')}
                          </Button>
                        );
                      }
                      if (next.kind === 'setPrice') {
                        return (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busyId === r.id}
                            onClick={() => setPriceFormRowId(priceFormRowId === r.id ? null : r.id)}
                          >
                            {t('admin.quotes.setPriceAction')}
                          </Button>
                        );
                      }
                      if (next.kind === 'finish') {
                        return (
                          <Button variant="primary" size="sm" disabled={busyId === r.id} onClick={() => act(r.id, 'completed')}>
                            {t('admin.quotes.finishAction')}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                    <Button variant="outline" size="sm" onClick={() => setDetailId(r.id)}>
                      {t('admin.quotes.details')}
                    </Button>
                    <Button variant="danger" size="sm" disabled={busyId === r.id} onClick={() => remove(r)}>
                      {t('admin.quotes.delete')}
                    </Button>
                  </div>
                </div>
              </div>
                </Card>
              </StaggerItem>
            ))}
          </motion.div>
        </div>
      )}

      {detailId && (
        <QuoteDetail
          id={detailId}
          onClose={() => setDetailId(null)}
          onChanged={onDetailChanged}
        />
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

// 3-step funnel indicator: Accept -> Price -> Finish. Purely visual — the
// real state is still just `status` + whether a price exists; this just
// makes a row's pipeline position scannable at a glance. Once a price is
// set, the "Price" step shows the actual formatted amount instead of the
// generic label, so admins can see it without opening the detail modal.
function PipelineStepper({ status, priced, priceLabel, t }) {
  const step1Done = status !== 'new';
  const step2Done = priced;
  const step3Done = status === 'completed';
  const steps = [
    { key: 'accept', label: t('admin.quotes.stepper.accept'), done: step1Done, current: status === 'new' },
    { key: 'price', label: priced && priceLabel ? priceLabel : t('admin.quotes.stepper.price'), done: step2Done, current: status === 'accepted' && !priced },
    { key: 'finish', label: t('admin.quotes.stepper.finish'), done: step3Done, current: status === 'accepted' && priced },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span style={{ width: 14, height: 1, background: 'var(--border-default)' }} />}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 'var(--fs-caption)',
            color: s.done ? 'var(--success)' : s.current ? 'var(--nr-accent)' : 'var(--text-muted)',
            fontWeight: s.current ? 'var(--fw-semibold)' : 'var(--fw-regular)',
          }}>
            <span aria-hidden style={{
              width: 6, height: 6, borderRadius: '50%',
              background: s.done ? 'var(--success)' : s.current ? 'var(--nr-accent)' : 'var(--border-default)',
              display: 'inline-block',
            }} />
            {s.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
