import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/core/Button';
import { Icon } from './Icon';
import { UzbekistanMap } from './UzbekistanMap';
import NavHeader from '../components/ui/nav-header';

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

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      border: '1px solid var(--border-on-inverse)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      {['ru', 'uz'].map((l, idx) => (
        <button
          key={l}
          onClick={() => i18n.changeLanguage(l)}
          style={{
            padding: '5px 10px',
            background: lang === l ? 'var(--nr-accent)' : 'transparent',
            color: lang === l ? 'var(--white)' : 'var(--slate-400)',
            border: 'none',
            borderLeft: idx > 0 ? '1px solid var(--border-on-inverse)' : 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--fw-semibold)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'background var(--dur-fast), color var(--dur-fast)',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Header({ route, go }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { id: 'home',     label: t('nav.home') },
    { id: 'products', label: t('nav.products') },
    { id: 'about',    label: t('nav.capabilities') },
    { id: 'contact',  label: t('nav.contact') },
  ];

  const activeId = route === 'product' ? 'products' : route;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 'var(--z-header)',
      background: 'rgba(15,23,42,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-on-inverse)',
    }}>
      <div style={{
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
          <LanguageSwitcher />
          <Button variant="primary" size="sm" onClick={() => go('contact')}>
            {t('nav.cta')}
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, color: 'var(--white)',
            }}
            aria-label="Menu"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} color="var(--white)" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          borderTop: '1px solid var(--border-on-inverse)',
          background: 'var(--slate-900)',
          padding: 'var(--space-4) var(--space-6)',
        }}>
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => { go(item.id); setMenuOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 0', background: 'none', border: 'none',
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
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
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
  { icon: 'telegram',  label: 'Telegram',  href: '#' },
  { icon: 'instagram', label: 'Instagram', href: '#' },
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
                onClick={(e) => e.preventDefault()}
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
          <span>{t('footer.locBottom')}</span>
        </div>
      </div>

      <style>{`
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
