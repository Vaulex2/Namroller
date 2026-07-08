import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/core/Button';
import { Input } from '../../components/forms/Input';
import { Card } from '../../components/surfaces/Card';
import { AdminLangSwitcher } from './AdminDashboard';
import { signIn } from '../../lib/auth';

/* Email + password login for the admin panel. The admin user is created manually
   in Supabase; public signup is disabled, so there is no "register" path. */
export function AdminLogin({ onSignedIn }) {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t('admin.login.required'));
      return;
    }
    setBusy(true); setError('');
    try {
      await signIn(email.trim(), password);
      onSignedIn?.();
    } catch {
      setError(t('admin.login.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <Card accentBar padding={32} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <AdminLangSwitcher />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
          textTransform: 'uppercase', fontSize: 24, color: 'var(--text-strong)', margin: '0 0 4px',
        }}>
          {t('admin.login.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)', margin: '0 0 24px' }}>
          {t('admin.login.subtitle')}
        </p>
        <form onSubmit={submit}>
          <Input
            label={t('admin.login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@namroller.uz"
            autoComplete="username"
            required
          />
          <div style={{ marginTop: 16 }}>
            <Input
              label={t('admin.login.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p style={{ marginTop: 12, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{error}</p>
          )}
          <div style={{ marginTop: 24 }}>
            <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>
              {busy ? t('admin.login.signingIn') : t('admin.login.signIn')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
