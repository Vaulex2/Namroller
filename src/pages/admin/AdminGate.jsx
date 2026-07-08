import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/core/Button';
import { Card } from '../../components/surfaces/Card';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { getSession, onAuthChange, checkIsAdmin, signOut, authConfigured } from '../../lib/auth';

/* Auth guard for the admin panel.
 *
 * SECURITY NOTE: this guard is UX ONLY. It decides what to render, not what data
 * is reachable. Every privileged path is enforced server-side — RLS is_admin()
 * on reviews/videos/storage and requireAdmin in the admin-quotes edge function.
 * A user who bypasses this component still cannot read PII or mutate anything. */
export function AdminGate() {
  const { t } = useTranslation();
  const [state, setState] = React.useState({ loading: true, session: null, isAdmin: false });

  // Resolve session + admin status. Returns data; never sets state itself, so
  // callers control when/whether to apply it (avoids setState-in-effect).
  const evaluate = React.useCallback(() => {
    return getSession().then(async (session) => {
      const isAdmin = session ? await checkIsAdmin() : false;
      return { loading: false, session, isAdmin };
    });
  }, []);

  // Event-handler refresh (login success / sign-out). setState in a handler is fine.
  const refresh = React.useCallback(() => {
    evaluate().then(setState);
  }, [evaluate]);

  React.useEffect(() => {
    let alive = true;
    const run = () => evaluate().then((next) => { if (alive) setState(next); });
    run();
    // Re-evaluate on sign-in / sign-out / token refresh.
    const off = onAuthChange(run);
    return () => { alive = false; off(); };
  }, [evaluate]);

  if (!authConfigured()) {
    return (
      <CenteredCard>
        <h1 style={titleStyle}>{t('admin.title')}</h1>
        <p style={{ color: 'var(--text-body)', marginTop: 12 }}>{t('admin.notConfigured')}</p>
      </CenteredCard>
    );
  }

  if (state.loading) {
    return (
      <CenteredCard>
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      </CenteredCard>
    );
  }

  if (!state.session) {
    return <AdminLogin onSignedIn={refresh} />;
  }

  if (!state.isAdmin) {
    return (
      <CenteredCard>
        <h1 style={titleStyle}>{t('admin.title')}</h1>
        <p style={{ color: 'var(--text-body)', margin: '12px 0 24px' }}>{t('admin.notAuthorized')}</p>
        <Button variant="outline" onClick={async () => { await signOut(); refresh(); }}>
          {t('admin.signOut')}
        </Button>
      </CenteredCard>
    );
  }

  return <AdminDashboard session={state.session} onSignOut={async () => { await signOut(); refresh(); }} />;
}

const titleStyle = {
  fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
  textTransform: 'uppercase', fontSize: 26, color: 'var(--text-strong)', margin: 0,
};

export function CenteredCard({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <Card accentBar padding={32} style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        {children}
      </Card>
    </div>
  );
}
