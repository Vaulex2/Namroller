import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card } from '../../components/surfaces/Card';
import { Button } from '../../components/core/Button';
import { quoteAnalytics } from '../../lib/admin';
import { useAdminResource } from '../../hooks/useAdminResource';
import { StatCard } from './shared/StatCard';

const GRANULARITIES = ['day', 'week', 'month', 'year'];

// Categorical cycle for pie slices — reuses existing design tokens rather
// than introducing new colors, so charts stay on-brand in both themes.
const PIE_COLORS = ['var(--nr-accent)', 'var(--slate-500)', 'var(--warning)', 'var(--success)', 'var(--danger)', 'var(--slate-300)'];

/* Inquiry analytics: a volume time series switchable between day/week/month/
   year granularity, conversion funnel, top requested products, and source /
   language split. Switching granularity re-fetches from the edge function
   (bucketing happens server-side) — topProducts/sources/langs/rates are
   always computed over the SAME window as the chart, so they never drift out
   of sync with what the chart is showing. All aggregation happens in the
   admin-quotes edge function; this component only renders, via recharts. */
export function AnalyticsPanel() {
  const { t, i18n } = useTranslation();
  const [granularity, setGranularity] = React.useState('week');
  const fetcher = React.useCallback(() => quoteAnalytics(granularity), [granularity]);
  const { data, loading, error, reload } = useAdminResource(fetcher);

  const pct = (v) => `${Math.round(v * 100)}%`;
  const locale = i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU';

  const fmtPeriod = (period) => {
    try {
      if (granularity === 'year') return period;
      if (granularity === 'month') {
        const [y, m] = period.split('-');
        return new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
      }
      // day or week: period is a "YYYY-MM-DD" string.
      return new Date(period).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    } catch { return period; }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>;
  if (error || !data) {
    return (
      <div>
        <p style={{ color: 'var(--danger)' }}>{t('admin.analytics.loadError')}</p>
        <Button variant="outline" size="sm" onClick={reload}>
          {t('admin.refresh')}
        </Button>
      </div>
    );
  }

  const seriesData = data.series.map((s) => ({ ...s, label: fmtPeriod(s.period) }));
  const sourceData = Object.entries(data.sources).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));
  const langData = Object.entries(data.langs).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Funnel: volume + how far inquiries get through the pipeline */}
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      }}>
        <StatCard label={t('admin.analytics.totalN', { days: data.days })} value={data.total} />
        <StatCard label={t('admin.analytics.acceptedRate')} value={pct(data.acceptedRate)} tone="accent" />
        <StatCard label={t('admin.analytics.completedRate')} value={pct(data.completedRate)} tone="success" />
      </div>

      {/* Volume over time — switchable granularity */}
      <Card variant="outline" padding={20}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <SectionTitle noMargin>{t('admin.analytics.volume')}</SectionTitle>
          <div style={{ display: 'flex', gap: 6 }}>
            {GRANULARITIES.map((g) => (
              <Button
                key={g}
                variant={granularity === g ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setGranularity(g)}
              >
                {t(`admin.analytics.granularity.${g}`)}
              </Button>
            ))}
          </div>
        </div>
        {seriesData.length === 0 ? (
          <Empty t={t} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={seriesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-default)' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-strong)' }}
              />
              <Bar dataKey="count" name={t('admin.analytics.volume')} fill="var(--nr-accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top requested products */}
      <Card variant="outline" padding={20}>
        <SectionTitle>{t('admin.analytics.topProducts')}</SectionTitle>
        {data.topProducts.length === 0 ? (
          <Empty t={t} />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(140, data.topProducts.length * 40)}>
            <BarChart data={data.topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fill: 'var(--text-body)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-strong)' }}
              />
              <Bar dataKey="count" name={t('admin.analytics.topProducts')} fill="var(--nr-accent)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Source + language split */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <BreakdownChart title={t('admin.analytics.sources')} data={sourceData} t={t} />
        <BreakdownChart title={t('admin.analytics.langs')} data={langData} t={t} />
      </div>
    </div>
  );
}

function BreakdownChart({ title, data, t }) {
  return (
    <Card variant="outline" padding={20}>
      <SectionTitle>{title}</SectionTitle>
      {data.length === 0 ? (
        <Empty t={t} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-body)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--text-strong)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function SectionTitle({ children, noMargin }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-muted)', marginBottom: noMargin ? 0 : 12,
    }}>
      {children}
    </div>
  );
}

function Empty({ t }) {
  return <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)' }}>{t('admin.analytics.empty')}</p>;
}
