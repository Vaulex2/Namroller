import React from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../components/motion/Reveal';
import { Icon } from './Icon';
import { useScrollContainer } from '../components/motion/ScrollContext';
import { EMAIL, EMAIL_HREF } from '../lib/contact';

/* Legal pages (Privacy Policy / Terms of Service) styled as a *controlled
 * engineering document* — the vernacular of NamRoller's spec sheets. A mono
 * "document control" block in the hero, and a sticky numbered "spec index"
 * table of contents with a scroll-spy active state. Content lives in i18n
 * (privacy.* / terms.*) so both Russian and Uzbek stay in sync. */

const num = (i) => String(i + 1).padStart(2, '0');

function LegalDocument({ ns }) {
  const { t, i18n } = useTranslation();
  const scrollRef = useScrollContainer();
  const sections = t(`${ns}.sections`, { returnObjects: true }) || [];
  const secId = React.useCallback((i) => `${ns}-sec-${i}`, [ns]);
  const [active, setActive] = React.useState(secId(0));

  // Scroll-spy: highlight the topmost visible clause in the index. Observes the
  // app's inner scroll container (not the window) — see ScrollContext.
  React.useEffect(() => {
    const root = scrollRef?.current || null;
    const ids = sections.map((_, i) => secId(i));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { root, rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scrollRef, secId, sections.length, i18n.language]);

  const prefersReduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  };

  const toTop = () =>
    scrollRef?.current?.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });

  return (
    <div style={{ background: 'var(--surface-page)' }}>
      <style>{`
        .nr-legal-grid { display: grid; grid-template-columns: 248px 1fr; gap: 56px; align-items: start; }
        .nr-legal-toc { position: sticky; top: calc(var(--header-h) + 24px); }
        .nr-legal-section { scroll-margin-top: calc(var(--header-h) + 20px); }
        .nr-legal-toc-link { transition: color var(--dur-fast), border-color var(--dur-fast); }
        .nr-legal-toc-link:hover { color: var(--nr-accent) !important; border-color: var(--nr-accent) !important; }
        @media (max-width: 860px) {
          .nr-legal-grid { grid-template-columns: 1fr; gap: 28px; }
          .nr-legal-toc { position: static; }
        }
      `}</style>

      {/* Hero — dark controlled-document header */}
      <div style={{ background: 'var(--surface-inverse)' }}>
        <Reveal style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '52px var(--space-6) 44px' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('legal.overline')}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-lg)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--white)',
          }}>
            {t(`${ns}.title`)}
          </h1>
        </Reveal>
      </div>

      {/* Body — spec index + clauses */}
      <div className="nr-legal-grid" style={{
        maxWidth: 'var(--container)', margin: '0 auto',
        padding: '48px var(--space-6) 88px',
      }}>
        {/* Index */}
        <nav className="nr-legal-toc" aria-label={t('legal.toc')}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)',
            paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border-default)',
          }}>
            {t('legal.toc')}
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {sections.map((s, i) => {
              const id = secId(i);
              const on = active === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => goTo(id)}
                    className="nr-legal-toc-link"
                    aria-current={on ? 'true' : undefined}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: 'none', border: 'none',
                      display: 'flex', gap: 12, alignItems: 'baseline',
                      padding: '8px 0 8px 12px',
                      borderLeft: `2px solid ${on ? 'var(--nr-accent)' : 'var(--border-subtle)'}`,
                      color: on ? 'var(--text-strong)' : 'var(--text-muted)',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
                      color: on ? 'var(--nr-accent)' : 'var(--text-muted)', flexShrink: 0,
                    }}>
                      {num(i)}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-medium)',
                      fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-snug)',
                    }}>
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Clauses */}
        <div style={{ minWidth: 0 }}>
          <Reveal>
            <p style={{
              fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-relaxed)',
              color: 'var(--text-body)', margin: 0, maxWidth: 720,
            }}>
              {t(`${ns}.intro`)}
            </p>
          </Reveal>

          {sections.map((s, i) => (
            <section
              key={secId(i)}
              id={secId(i)}
              className="nr-legal-section"
              style={{ marginTop: 40, paddingTop: 40, borderTop: '1px solid var(--border-subtle)' }}
            >
              <Reveal>
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-bold)',
                    fontSize: 'var(--fs-body)', color: 'var(--nr-accent)', flexShrink: 0,
                  }}>
                    {num(i)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{
                      fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                      textTransform: 'uppercase', fontSize: 22, lineHeight: 'var(--lh-snug)',
                      margin: 0, color: 'var(--text-strong)',
                    }}>
                      {s.title}
                    </h2>
                    {(s.body || []).map((p, j) => (
                      <p key={j} style={{
                        marginTop: j === 0 ? 14 : 12, maxWidth: 720,
                        fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-relaxed)',
                        color: 'var(--text-body)',
                      }}>
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>
            </section>
          ))}

          {/* Footer note — contact + revision + back to top */}
          <div style={{
            marginTop: 44, paddingTop: 24, borderTop: '1px solid var(--border-default)',
            display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
            alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-muted)' }}>
              <span>{t(`${ns}.contactNote`)} </span>
              <a href={EMAIL_HREF} style={{ color: 'var(--nr-accent)', fontWeight: 'var(--fw-semibold)' }}>
                {EMAIL}
              </a>
              <div style={{
                marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
                color: 'var(--text-subtle)',
              }}>
                {t(`${ns}.updated`)}
              </div>
            </div>
            <button
              type="button"
              onClick={toTop}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                background: 'none', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)',
              }}
            >
              <Icon name="chevron" size={14} style={{ transform: 'rotate(-90deg)' }} />
              {t('legal.backTop')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return <LegalDocument ns="privacy" />;
}

export function TermsOfService() {
  return <LegalDocument ns="terms" />;
}

export function CookiePolicy() {
  return <LegalDocument ns="cookies" />;
}
