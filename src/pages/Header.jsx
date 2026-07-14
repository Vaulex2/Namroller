import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '../components/core/Button';
import { Icon } from './Icon';
import { UzbekistanMap } from './UzbekistanMap';
import NavHeader from '../components/ui/nav-header';
import { TELEGRAM_HREF, INSTAGRAM_HREF } from '../lib/contact';

export function Logo({ onClick, light = false }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, background: light ? 'rgba(255,255,255,0.08)' : 'var(--white)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${light ? 'rgba(255,255,255,0.16)' : 'var(--border-subtle)'}`,
        overflow: 'hidden', flexShrink: 0,
      }}>
        <img src="/logo-namroller-full.png" alt="Nam Roller" style={{ height: 36, width: 'auto' }} />
      </span>
      <span style={{ textAlign: 'left', lineHeight: 1 }}>
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--fw-bold)',
          fontSize: 22,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: light ? 'var(--white)' : 'var(--text-strong)',
        }}>Nam Roller</span>
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--fw-semibold)',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: light ? 'var(--slate-400)' : 'var(--nr-accent)',
          marginTop: 3,
        }}>{t('logo.tagline')}</span>
      </span>
    </button>
  );
}

const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'fa', label: 'FA' },
];

/* Flat, always-visible row of language pills — no floating overlay. Used
   inside the mobile drawer: that panel is a Framer Motion element with an
   animated `transform`, and Chromium fails to paint text inside a
   `position: absolute` dropdown nested under a transformed ancestor (the box
   renders, the glyphs don't — reproduces on real phones, not just headless).
   A dropdown never even attempts that layout, so it can't hit the bug. */
function InlineLanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={lang === l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          style={{
            padding: '7px 11px',
            background: lang === l.code ? 'var(--nr-accent)' : 'transparent',
            color: lang === l.code ? 'var(--white)' : 'var(--slate-400)',
            border: `1px solid ${lang === l.code ? 'var(--nr-accent)' : 'var(--border-on-inverse)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--fw-semibold)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          minHeight: 40, padding: '5px 12px',
          background: 'transparent',
          color: 'var(--slate-400)',
          border: '1px solid var(--border-on-inverse)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--fw-semibold)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          transition: 'background var(--dur-fast), color var(--dur-fast)',
        }}
      >
        {current.label}
        <Icon name="chevron" size={12} stroke={2} color="currentColor" style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            minWidth: 120,
            background: 'var(--slate-900)',
            border: '1px solid var(--border-on-inverse)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={lang === l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '9px 14px',
                background: lang === l.code ? 'var(--nr-accent)' : 'transparent',
                color: lang === l.code ? 'var(--white)' : 'var(--slate-300)',
                border: 'none',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--fw-semibold)',
                fontSize: 12,
                letterSpacing: '0.04em',
                transition: 'background var(--dur-fast), color var(--dur-fast)',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Sun/moon theme toggle. Sits in the header right-controls and inside the
   mobile drawer. Icon shows the theme it will switch *to* (moon when light). */
function ThemeToggle({ theme, toggle }) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const label = isDark ? t('theme.light') : t('theme.dark');
  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, flexShrink: 0,
        background: 'transparent',
        border: '1px solid var(--border-on-inverse)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--slate-200)', cursor: 'pointer',
        transition: 'background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--nr-accent)'; e.currentTarget.style.color = 'var(--nr-accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-on-inverse)'; e.currentTarget.style.color = 'var(--slate-200)'; }}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={17} stroke={1.9} color="currentColor" />
    </button>
  );
}

export function Header({ route, go, theme, toggleTheme }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  const nav = [
    { id: 'home',     label: t('nav.home') },
    { id: 'products', label: t('nav.products') },
    { id: 'about',    label: t('nav.capabilities') },
    { id: 'contact',  label: t('nav.contact') },
  ];

  const activeId = route === 'product' ? 'products' : route;

  // Drawer: lock body scroll + Escape-to-close while open.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [menuOpen]);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 'var(--z-header)',
      background: 'rgba(15,23,42,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-on-inverse)',
    }}>
      <div className="nr-header-bar" style={{
        maxWidth: 'var(--container)', margin: '0 auto',
        height: 'var(--header-h)', padding: '0 var(--space-6)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-6)',
      }}>
        {/* Logo */}
        <Logo light onClick={() => go('home')} />

        {/* Nav — desktop */}
        <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="desktop-nav">
            <NavHeader items={nav} activeId={activeId} onSelect={go} light />
          </div>
        </nav>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span className="nr-header-controls" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle theme={theme} toggle={toggleTheme} />
            <LanguageSwitcher />
          </span>
          <span className="nr-header-cta">
            <Button variant="primary" size="sm" onClick={() => go('contact')}>
              {t('nav.cta')}
            </Button>
          </span>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44,
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, color: 'var(--white)',
            }}
            aria-label="Menu"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} color="var(--white)" />
          </button>
        </div>
      </div>

      {/* Mobile drawer — portaled to <body> so it isn't trapped inside the
          header's backdrop-filter, which creates a new containing block for
          position:fixed descendants and would otherwise collapse the
          drawer's height down to the header's own ~72px instead of the
          full viewport. */}
      {createPortal(
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 'var(--z-header)',
                background: 'rgba(2,6,23,0.72)', willChange: 'opacity',
              }}
            />
            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.menu')}
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 'calc(var(--z-header) + 1)',
                width: 'min(84vw, 320px)',
                background: 'var(--slate-900)',
                borderLeft: '1px solid var(--border-on-inverse)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex', flexDirection: 'column',
                padding: 'var(--space-5) var(--space-5) var(--space-6)',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label={t('quote.form.close')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--white)',
                  }}
                >
                  <Icon name="close" size={22} color="var(--white)" />
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column' }}>
                {nav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { go(item.id); setMenuOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '14px 0', background: 'none', border: 'none',
                      borderBottom: '1px solid var(--border-on-inverse)', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-medium)',
                      fontSize: 'var(--fs-body)', textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: item.id === activeId ? 'var(--nr-accent)' : 'var(--slate-200)',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Controls: language + theme */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, marginTop: 'var(--space-5)',
              }}>
                <InlineLanguageSwitcher />
                <ThemeToggle theme={theme} toggle={toggleTheme} />
              </div>

              {/* CTA — reachable on phones where the header CTA is hidden */}
              <div style={{ marginTop: 'var(--space-5)' }}>
                <Button variant="primary" size="lg" fullWidth onClick={() => { go('contact'); setMenuOpen(false); }}>
                  {t('nav.cta')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .nr-header-controls { display: none !important; }
          .nr-header-cta { display: none !important; }
          .nr-header-bar { padding: 0 var(--space-4) !important; gap: var(--space-3) !important; }
        }
      `}</style>
    </header>
  );
}

function FooterLink({ children, onClick }) {
  return (
    <li>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick?.(); }}
        style={{
          color: 'var(--slate-400)',
          fontSize: 'var(--fs-body-sm)',
          textDecoration: 'none',
          transition: 'color var(--dur-fast)',
        }}
        onMouseEnter={(e) => { e.target.style.color = 'var(--nr-accent)'; }}
        onMouseLeave={(e) => { e.target.style.color = 'var(--slate-400)'; }}
      >
        {children}
      </a>
    </li>
  );
}

const COL_HEADING = {
  fontFamily: 'var(--font-body)',
  fontWeight: 'var(--fw-semibold)',
  fontSize: 'var(--fs-overline)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--white)',
  marginBottom: 18,
};

const SOCIALS = [
  { icon: 'telegram',  label: 'Telegram',  href: TELEGRAM_HREF },
  { icon: 'instagram', label: 'Instagram', href: INSTAGRAM_HREF },
  { icon: 'facebook',  label: 'Facebook',  href: '#' },
  { icon: 'youtube',   label: 'YouTube',   href: '#' },
];

export function Footer({ go }) {
  const { t } = useTranslation();

  const products = [
    t('footer.cols.products.l1'), t('footer.cols.products.l2'),
    t('footer.cols.products.l3'), t('footer.cols.products.l4'),
    t('footer.cols.products.l5'),
  ];
  const quick = [
    { label: t('footer.cols.company.l1'), onClick: () => go('about') },
    { label: t('footer.cols.company.l2'), onClick: () => go('about') },
    { label: t('footer.cols.company.l3'), onClick: () => go('about') },
    { label: t('footer.cols.support.l2'), onClick: () => go('contact') },
    { label: t('footer.cols.support.l3'), onClick: () => go('contact') },
    { label: t('footer.cols.support.l4'), onClick: () => go('contact') },
  ];

  return (
    <footer style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, var(--slate-950), var(--slate-900))',
      color: 'var(--text-on-inverse)',
      borderTop: '1px solid var(--border-on-inverse)',
    }}>
      {/* Faint Uzbekistan territory */}
      <UzbekistanMap
        fill="var(--slate-700)"
        aria-hidden="true"
        style={{
          position: 'absolute', right: '-40px', top: '46%',
          transform: 'translateY(-50%)',
          width: 'min(640px, 52%)', height: 'auto',
          opacity: 0.13, pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div className="nr-footer-grid" style={{
        position: 'relative', zIndex: 1,
        maxWidth: 'var(--container)', margin: '0 auto',
        padding: '64px var(--space-6) 32px',
        display: 'grid',
        gridTemplateColumns: '1.7fr 1fr 1fr 1.4fr',
        gap: 48,
      }}>
        {/* Brand column */}
        <div>
          <Logo light onClick={() => go('home')} />
          <p style={{
            marginTop: 20, fontSize: 'var(--fs-body-sm)',
            lineHeight: 'var(--lh-relaxed)', maxWidth: 300,
            color: 'var(--slate-400)',
          }}>
            {t('footer.desc')}
          </p>

          <div style={{ ...COL_HEADING, marginTop: 28, marginBottom: 12 }}>
            {t('footer.follow')}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {SOCIALS.map((s) => (
              <a
                key={s.icon}
                href={s.href}
                aria-label={s.label}
                {...(s.href === '#'
                  ? { onClick: (e) => e.preventDefault() }
                  : { target: '_blank', rel: 'noopener noreferrer' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 38, height: 38,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-on-inverse)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--slate-300)',
                  transition: 'background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--nr-accent)';
                  e.currentTarget.style.borderColor = 'var(--nr-accent)';
                  e.currentTarget.style.color = 'var(--white)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-on-inverse)';
                  e.currentTarget.style.color = 'var(--slate-300)';
                }}
              >
                <Icon name={s.icon} size={17} stroke={1.8} color="currentColor" />
              </a>
            ))}
          </div>
        </div>

        {/* Main products */}
        <div>
          <div style={COL_HEADING}>{t('footer.cols.products.h')}</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {products.map((l) => (
              <FooterLink key={l} onClick={() => go('products')}>{l}</FooterLink>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <div style={COL_HEADING}>{t('footer.quickLinks')}</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quick.map((q) => (
              <FooterLink key={q.label} onClick={q.onClick}>{q.label}</FooterLink>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 18, lineHeight: 'var(--lh-snug)',
            color: 'var(--white)', marginBottom: 20, maxWidth: 260,
          }}>
            {t('footer.contactTitle')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
            <a href={`tel:${t('footer.phone').replace(/\s/g, '')}`} style={CONTACT_ROW}>
              <Icon name="phone" size={15} color="var(--nr-accent)" />
              <span>{t('footer.phone')}</span>
            </a>
            <a href={`mailto:${t('footer.email')}`} style={CONTACT_ROW}>
              <Icon name="mail" size={15} color="var(--nr-accent)" />
              <span>{t('footer.email')}</span>
            </a>
            <div style={{ ...CONTACT_ROW, alignItems: 'flex-start' }}>
              <Icon name="pin" size={15} color="var(--nr-accent)" style={{ marginTop: 2 }} />
              <span>{t('footer.address')}</span>
            </div>
          </div>

          <Button variant="primary" size="md" onClick={() => go('contact')}>
            {t('footer.contactBtn')}
          </Button>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border-on-inverse)' }}>
        <div style={{
          maxWidth: 'var(--container)', margin: '0 auto',
          padding: '20px var(--space-6)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          fontSize: 'var(--fs-caption)', color: 'var(--slate-500)',
          fontFamily: 'var(--font-mono)', flexWrap: 'wrap',
        }}>
          <span>{t('footer.copy')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => go('privacy')} className="nr-foot-legal" style={LEGAL_LINK}>
              {t('legal.privacyLink')}
            </button>
            <button type="button" onClick={() => go('terms')} className="nr-foot-legal" style={LEGAL_LINK}>
              {t('legal.termsLink')}
            </button>
            <button type="button" onClick={() => go('cookies')} className="nr-foot-legal" style={LEGAL_LINK}>
              {t('legal.cookiesLink')}
            </button>
            <span>{t('footer.locBottom')}</span>
          </div>
        </div>
      </div>

      <style>{`
        .nr-foot-legal:hover { color: var(--slate-200) !important; }
        @media (max-width: 900px) {
          .nr-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 36px !important; }
        }
        @media (max-width: 560px) {
          .nr-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

const CONTACT_ROW = {
  display: 'flex', alignItems: 'center', gap: 10,
  color: 'var(--slate-300)', textDecoration: 'none',
  fontSize: 'var(--fs-body-sm)', fontFamily: 'var(--font-body)',
};

const LEGAL_LINK = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
  color: 'var(--slate-500)', letterSpacing: '0.02em',
  transition: 'color var(--dur-fast)',
};
