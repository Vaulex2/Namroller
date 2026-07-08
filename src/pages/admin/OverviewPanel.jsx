import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/surfaces/Card';
import { Badge } from '../../components/core/Badge';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { quotesOverview, listReviews, quoteAnalytics, recentQuoteEvents } from '../../lib/admin';
import { listAllVideos } from '../../lib/videos';
import { useAdminResource } from '../../hooks/useAdminResource';
import { StatCard } from './shared/StatCard';
import { AdminTable } from './shared/AdminTable';
import { EventText, EventIcon } from './shared/eventText';
import { STALE_MS } from './shared/constants';

const fetchOverview = async () => {
  const [{ stats, rows }, reviews, analytics, { events }, videos] = await Promise.all([
    quotesOverview(200), listReviews(), quoteAnalytics(), recentQuoteEvents(20), listAllVideos(),
  ]);
  // Stamp staleness at fetch time (Date.now() is impure — not during render),
  // same pattern QuotesPanel uses.
  const staleBefore = Date.now() - STALE_MS;
  const staleCount = rows.filter((r) => r.status === 'new' && new Date(r.created_at).getTime() < staleBefore).length;
  return { stats, rows, reviews, analytics, events, videos, staleCount };
};

/* Cross-entity landing tab: KPIs, a merged recent-activity feed (quote
   events + new reviews + video uploads), and a lightweight team-performance
   table computed from already-fetched quote rows (no extra fetch).
   Deliberately NOT included (see the plan this was built from): per-admin
   response-time metrics (would need a quote_events fetch per quote — N+1 and
   too expensive) and lifetime team totals (team stats below only reflect the
   200 most recent quotes, the same cap quotesOverview always uses). */
export function OverviewPanel({ goTab }) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useAdminResource(fetchOverview);

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'); }
    catch { return iso; }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>;
  if (error || !data) {
    return (
      <div>
        <p style={{ color: 'var(--danger)' }}>{t('admin.overview.loadError')}</p>
        <button
          type="button" onClick={reload}
          style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', cursor: 'pointer', color: 'var(--text-body)' }}
        >
          {t('admin.refresh')}
        </button>
      </div>
    );
  }

  const { stats, rows, reviews, analytics, events, videos, staleCount } = data;

  const pendingReviews = reviews.filter((r) => !r.approved).length;

  const weekly = analytics.series;
  const thisWeek = weekly[weekly.length - 1]?.count ?? 0;
  const lastWeek = weekly[weekly.length - 2]?.count ?? 0;
  const weekDelta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

  // Merge the 3 activity sources into one feed, newest first.
  const feed = [
    ...events.map((e) => ({ kind: 'quote', created_at: e.created_at, data: e })),
    ...reviews.filter((r) => !r.approved).map((r) => ({ kind: 'review', created_at: r.created_at, data: r })),
    ...videos.map((v) => ({ kind: 'video', created_at: v.created_at, data: v })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);

  // Team performance: assigned/completed counts per admin, computed purely
  // from the already-fetched quote rows (capped at the 200 most recent).
  const teamMap = new Map();
  for (const r of rows) {
    if (!r.assigned_email) continue;
    const entry = teamMap.get(r.assigned_email) ?? { email: r.assigned_email, assigned: 0, completed: 0 };
    entry.assigned += 1;
    if (r.status === 'completed') entry.completed += 1;
    teamMap.set(r.assigned_email, entry);
  }
  const team = [...teamMap.values()].sort((a, b) => b.assigned - a.assigned);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <StatCard
          label={t('admin.overview.pending')}
          value={<AnimatedCounter value={String(stats.new)} />}
          tone="warning"
          icon="message-square"
          onClick={() => goTab?.('quotes')}
        />
        <StatCard
          label={t('admin.overview.stale')}
          value={<AnimatedCounter value={String(staleCount)} />}
          tone="danger"
          icon="alert-triangle"
          onClick={() => goTab?.('quotes')}
        />
        <StatCard
          label={t('admin.overview.pendingReviews')}
          value={<AnimatedCounter value={String(pendingReviews)} />}
          tone="accent"
          icon="star"
          onClick={() => goTab?.('reviews')}
        />
        <StatCard
          label={t('admin.overview.weekVolume')}
          value={<AnimatedCounter value={String(thisWeek)} />}
          tone="dark"
          icon="bar-chart"
          onClick={() => goTab?.('analytics')}
        >
          {weekDelta !== null && (
            <div style={{ marginTop: 4, fontSize: 'var(--fs-caption)', color: weekDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {weekDelta >= 0 ? '+' : ''}{weekDelta}% {t('admin.overview.vsLastWeek')}
            </div>
          )}
        </StatCard>
      </div>

      {/* Activity feed + team performance side by side */}
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <Card variant="outline" padding={20}>
          <SectionTitle>{t('admin.overview.activity')}</SectionTitle>
          {feed.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)' }}>{t('admin.overview.activityEmpty')}</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {feed.map((item, i) => (
                <div key={`${item.kind}-${item.data.id ?? i}`} style={{ display: 'flex', gap: 10, fontSize: 'var(--fs-body-sm)' }}>
                  <span aria-hidden style={{ width: 18, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                    {item.kind === 'quote' ? <EventIcon type={item.data.type} /> :
                      item.kind === 'review' ? <EventIcon type="note" /> : <EventIcon type="assign" />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: 'var(--text-body)' }}>
                      {item.kind === 'quote' && <EventText ev={item.data} t={t} fmtMoney={(v, c) => `${v} ${c}`} />}
                      {item.kind === 'review' && t('admin.overview.newReview', { name: item.data.name })}
                      {item.kind === 'video' && t('admin.overview.newVideo', { title: item.data.title || t('admin.overview.untitled') })}
                    </span>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>
                      {item.kind === 'quote' ? (item.data.quote_name || item.data.actor_email || '—') : fmtDate(item.created_at)}
                      {item.kind === 'quote' && ` · ${fmtDate(item.created_at)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="outline" padding={20}>
          <SectionTitle>{t('admin.overview.team')}</SectionTitle>
          <AdminTable
            columns={[
              { key: 'email', header: t('admin.overview.admin'), render: (r) => r.email },
              { key: 'assigned', header: t('admin.overview.assigned'), align: 'right' },
              {
                key: 'completed', header: t('admin.overview.completed'), align: 'right',
                render: (r) => <Badge tone="success" soft>{r.completed}</Badge>,
              },
            ]}
            rows={team}
            rowKey={(r) => r.email}
            emptyMessage={t('admin.overview.teamEmpty')}
          />
          <p style={{ margin: '10px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--fs-caption)' }}>
            {t('admin.overview.teamCaveat')}
          </p>
        </Card>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-muted)', marginBottom: 12,
    }}>
      {children}
    </div>
  );
}
