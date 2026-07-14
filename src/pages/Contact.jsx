import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '../components/core/Button';
import { Input } from '../components/forms/Input';
import { Card } from '../components/surfaces/Card';
import { Icon } from './Icon';
import { Photo } from './Photo';
import { HeroBackdrop } from './HeroBackdrop';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { Accordion } from '../components/surfaces/Accordion';
import { submitQuote } from '../lib/quotes';
import { Turnstile } from '../components/forms/Turnstile';
import { isTurnstileEnabled } from '../lib/turnstile';
import { TELEGRAM_HREF } from '../lib/contact';

const PHONE = '+998 97 374 77 55';
const PHONE_HREF = 'tel:+998973747755';
const EMAIL = 'sales@namroller.com';

export function Contact() {
  const { t, i18n } = useTranslation();
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [token, setToken] = React.useState('');
  const [form, setForm] = React.useState({
    name: '', phone: '', email: '', address: '', deadline: '', msg: '',
  });

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Feeds the same quote_requests pipeline as the product-page modal, so general
  // contact inquiries also reach the sales team's Telegram. Tagged "General
  // inquiry" (no specific product) so they're distinguishable in the message.
  const submit = async (e) => {
    e.preventDefault();
    if (isTurnstileEnabled && !token) {
      setError(t('contact.form.captcha'));
      return;
    }
    setBusy(true); setError('');
    try {
      await submitQuote({
        productName: 'General inquiry (Contact page)',
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        preferredDeadline: form.deadline || undefined,
        note: form.msg.trim(),
        lang: i18n.language,
        source: 'Contact page',
        token,
      });
      setSent(true);
    } catch {
      setError(t('contact.form.error'));
    } finally {
      setBusy(false);
    }
  };

  const info = [
    { icon: 'pin',   hKey: 'contact.info.office', v: 'Namangan, Uzbekistan' },
    { icon: 'phone', hKey: 'contact.info.phone',  v: PHONE, href: PHONE_HREF },
    { icon: 'mail',  hKey: 'contact.info.email',  v: EMAIL, href: `mailto:${EMAIL}` },
  ];

  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <style>{`
        .nr-contact-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; align-items: start; }
        .nr-contact-names { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .nr-contact-row { transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
        a.nr-contact-row:hover { transform: translateX(3px); border-color: var(--nr-accent); box-shadow: var(--shadow-sm); }
        a.nr-contact-row:hover .nr-contact-val { color: var(--nr-accent); }
        .nr-textarea { transition: border-color var(--dur-base), box-shadow var(--dur-base); }
        .nr-textarea:focus { border-color: var(--nr-accent); box-shadow: var(--focus-ring); }
        @media (max-width: 880px) { .nr-contact-grid { grid-template-columns: 1fr; gap: 28px; } }
        @media (max-width: 520px) { .nr-contact-names { grid-template-columns: 1fr; } }
      `}</style>

      {/* Page header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, var(--slate-950), var(--slate-900))',
        borderBottom: '1px solid var(--border-on-inverse)',
      }}>
        <HeroBackdrop />
        <Reveal style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--container)', margin: '0 auto', padding: '52px var(--space-6) 48px' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('contact.overline')}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-lg)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--white)',
          }}>
            {t('contact.headline')}
          </h1>
          <p style={{ marginTop: 14, fontSize: 'var(--fs-body-lg)', color: 'var(--slate-400)', maxWidth: 540 }}>
            {t('contact.body')}
          </p>
        </Reveal>
      </div>

      {/* Form + info */}
      <div className="nr-contact-grid" style={{
        maxWidth: 'var(--container)', margin: '0 auto',
        padding: '48px var(--space-6) 88px',
      }}>
        {/* Form card */}
        <Reveal>
        <Card accentBar padding={32}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 64, height: 64,
                  background: 'var(--success-bg)', borderRadius: '50%',
                  color: 'var(--success)', marginBottom: 20,
                }}>
                <Icon name="check" size={30} />
              </motion.span>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                textTransform: 'uppercase', fontSize: 28,
                color: 'var(--text-strong)', margin: 0,
              }}>
                {t('contact.success.title')}
              </h2>
              <p style={{ marginTop: 12, color: 'var(--text-body)', fontSize: 'var(--fs-body)' }}>
                {t('contact.success.body', { name: form.name || '—' })}
              </p>
              <div style={{ marginTop: 24 }}>
                <Button variant="outline" onClick={() => setSent(false)}>
                  {t('contact.success.again')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="nr-contact-names">
                <Input
                  label={t('contact.form.name')} value={form.name} onChange={set('name')}
                  placeholder={t('contact.form.namePh')} required
                  iconLeft={<Icon name="user" size={16} />}
                />
                <Input
                  label={t('contact.form.phone')} type="tel" value={form.phone} onChange={set('phone')}
                  placeholder={t('contact.form.phonePh')} required
                  iconLeft={<Icon name="phone" size={16} />}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <Input
                  label={t('contact.form.email')} type="email" value={form.email} onChange={set('email')}
                  placeholder={t('contact.form.emailPh')}
                  iconLeft={<Icon name="mail" size={16} />}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <Input
                  label={t('contact.form.address')} value={form.address} onChange={set('address')}
                  placeholder={t('contact.form.addressPh')}
                  iconLeft={<Icon name="pin" size={16} />}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <Input
                  label={t('contact.form.deadline')} type="date" lang="en-CA"
                  value={form.deadline} onChange={set('deadline')}
                  hint={t('contact.form.deadlineHint')}
                  iconLeft={<Icon name="clock" size={16} />}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{
                  display: 'block', marginBottom: 6,
                  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                  fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  {t('contact.form.details')}
                </label>
                <textarea
                  className="nr-textarea"
                  value={form.msg}
                  onChange={set('msg')}
                  placeholder={t('contact.form.detailsPh')}
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', padding: '12px',
                    background: 'var(--surface-sunken)',
                    fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
                    color: 'var(--text-strong)', resize: 'vertical', outline: 'none',
                  }}
                />
              </div>

              {isTurnstileEnabled && (
                <div style={{ marginTop: 16 }}>
                  <Turnstile onToken={setToken} />
                </div>
              )}

              {error && (
                <p style={{ marginTop: 14, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>
                  {error}
                </p>
              )}

              <div style={{ marginTop: 24 }}>
                <Button type="submit" variant="primary" size="lg" fullWidth
                  disabled={busy || (isTurnstileEnabled && !token)}
                  iconRight={<Icon name="arrow" size={18} />}>
                  {busy ? t('contact.form.sending') : t('contact.form.submit')}
                </Button>
              </div>

              <div style={{
                marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start',
                color: 'var(--text-muted)', fontSize: 'var(--fs-caption)',
              }}>
                <Icon name="shield" size={15} color="var(--success)" style={{ marginTop: 1 }} />
                <span>{t('contact.form.privacy')}</span>
              </div>
            </form>
          )}
        </Card>
        </Reveal>

        {/* Contact info sidebar */}
        <Stagger style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Response-time highlight */}
          <StaggerItem style={{
            display: 'flex', gap: 14, alignItems: 'center',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-100)',
            borderRadius: 'var(--radius-md)', padding: '18px 20px',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 42, height: 42, flexShrink: 0,
              background: 'var(--nr-accent)', borderRadius: '50%',
              color: 'var(--white)', boxShadow: 'var(--shadow-accent)',
            }}>
              <Icon name="clock" size={20} />
            </span>
            <div>
              <div style={{
                fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-bold)',
                fontSize: 'var(--fs-body)', color: 'var(--text-strong)', marginBottom: 2,
              }}>
                {t('contact.info.respTitle')}
              </div>
              <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-snug)' }}>
                {t('contact.info.respValue')}
              </div>
            </div>
          </StaggerItem>

          {info.map((it) => {
            const isLink = Boolean(it.href);
            return (
              <StaggerItem
                key={it.hKey}
                as={isLink ? 'a' : 'div'}
                className="nr-contact-row"
                {...(isLink ? { href: it.href } : {})}
                style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '3px solid var(--nr-accent)',
                  borderRadius: 'var(--radius-md)', padding: '18px 20px',
                  textDecoration: 'none',
                  cursor: isLink ? 'pointer' : 'default',
                }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40,
                  background: 'var(--orange-50)',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                }}>
                  <Icon name={it.icon} size={18} color="var(--nr-accent)" />
                </span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                    fontSize: 'var(--fs-overline)', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', marginBottom: 5,
                  }}>
                    {t(it.hKey)}
                  </div>
                  <div className="nr-contact-val" style={{
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-body)',
                    color: 'var(--text-strong)', transition: 'color .18s ease',
                  }}>
                    {it.v}
                  </div>
                </div>
              </StaggerItem>
            );
          })}

          {/* Chat / call CTAs */}
          <StaggerItem>
            <Button
              as="a" href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer"
              variant="primary" size="lg" fullWidth
              iconLeft={<Icon name="telegram" size={16} color="var(--white)" />}
            >
              {t('chat.telegram')}
            </Button>
          </StaggerItem>
          <StaggerItem>
            <Button
              as="a" href={PHONE_HREF}
              variant="secondary" size="lg" fullWidth
              iconLeft={<Icon name="phone" size={16} />}
            >
              {t('contact.info.callCta')}
            </Button>
          </StaggerItem>

          <StaggerItem>
            <Photo
              label={t('contact.info.map')}
              icon="pin"
              height={180}
              style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
            />
          </StaggerItem>
        </Stagger>
      </div>

      {/* FAQ */}
      <FaqSection />
    </div>
  );
}

/* Frequently-asked questions — accordion fed from i18n (faq.items). */
function FaqSection() {
  const { t } = useTranslation();
  const items = t('faq.items', { returnObjects: true, defaultValue: [] });
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '64px var(--space-6) 88px' }}>
        <Reveal>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('faq.overline')}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 32, lineHeight: 'var(--lh-tight)',
            color: 'var(--text-strong)', margin: '0 0 28px',
          }}>
            {t('faq.heading')}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion items={items} defaultOpen={0} />
        </Reveal>
      </div>
    </div>
  );
}
