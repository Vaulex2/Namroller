import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../../components/core/Button';
import { PageTransition } from '../../components/motion/PageTransition';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../Icon';
import { OverviewPanel } from './OverviewPanel';
import { QuotesPanel } from './QuotesPanel';
import { JournalPanel } from './JournalPanel';
import { ReviewsPanel } from './ReviewsPanel';
import { VideosPanel } from './VideosPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { ProductsPanel } from './ProductsPanel';

const TABS = [
  { id: 'overview', key: 'admin.tabs.overview' },
  { id: 'quotes', key: 'admin.tabs.quotes' },
  { id: 'journal', key: 'admin.tabs.journal' },
  { id: 'products', key: 'admin.tabs.products' },
  { id: 'analytics', key: 'admin.tabs.analytics' },
  { id: 'reviews', key: 'admin.tabs.reviews' },
  { id: 'videos', key: 'admin.tabs.videos' },
];

/* Admin shell: header with sign-out + tab navigation. Each tab owns its own data
   fetching so switching tabs re-loads fresh state. */
export function AdminDashboard({ session, onSignOut }) {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = React.useState('overview');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 26, color: 'var(--text-strong)', margin: 0,
          }}>
            {t('admin.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)', margin: '4px 0 0' }}>
            {session?.user?.email}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={t(theme === 'dark' ? 'admin.theme.toLight' : 'admin.theme.toDark')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </Button>
          <AdminLangSwitcher />
          <Button variant="outline" size="sm" onClick={onSignOut}>{t('admin.signOut')}</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="nr-tabs-scroll" style={{
        display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {TABS.map((tb) => {
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 16px', marginBottom: -1,
                fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                fontSize: 'var(--fs-body-sm)', textTransform: 'uppercase', letterSpacing: '0.06em',
                color: active ? 'var(--nr-accent)' : 'var(--text-muted)',
                borderBottom: `2px solid ${active ? 'var(--nr-accent)' : 'transparent'}`,
              }}
            >
              {t(tb.key)}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <PageTransition key={tab}>
          {tab === 'overview' && <OverviewPanel goTab={setTab} />}
          {tab === 'quotes' && <QuotesPanel />}
          {tab === 'journal' && <JournalPanel />}
          {tab === 'products' && <ProductsPanel />}
          {tab === 'analytics' && <AnalyticsPanel />}
          {tab === 'reviews' && <ReviewsPanel />}
          {tab === 'videos' && <VideosPanel />}
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}

/* RU / UZ toggle, styled for the admin panel's light surface. Persists via the
   same i18n language-detector the marketing site uses. */
export function AdminLangSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      {['ru', 'uz'].map((l, idx) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => i18n.changeLanguage(l)}
            style={{
              padding: '6px 12px',
              background: active ? 'var(--nr-accent)' : 'transparent',
              color: active ? 'var(--white)' : 'var(--text-muted)',
              border: 'none',
              borderLeft: idx > 0 ? '1px solid var(--border-default)' : 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
              fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'background var(--dur-fast), color var(--dur-fast)',
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
