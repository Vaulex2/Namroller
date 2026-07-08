import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Button } from '../components/core/Button';
import { Card } from '../components/surfaces/Card';
import { Icon } from './Icon';
import { HeroBackdrop } from './HeroBackdrop';
import RotatingEarth from '@/components/ui/wireframe-dotted-globe';
import { ProjectsMap } from '../components/interactive/ProjectsMap';
import { ProcessVideos } from '../components/interactive/ProcessVideos';
import { Testimonials } from './Testimonials';
import { useProducts } from '../hooks/useProducts';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { AnimatedCounter } from '../components/motion/AnimatedCounter';
import { useScrollContainer } from '../components/motion/ScrollContext';

/* ── Hero ──────────────────────────────────────────────────── */
function Hero({ go }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const scrollRef = useScrollContainer();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    container: scrollRef,
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const trust = [
    { icon: 'gauge', v: t('hero.trust.yearsV'),    l: t('hero.trust.yearsL') },
    { icon: 'check', v: t('hero.trust.projV'),     l: t('hero.trust.projL') },
    { icon: 'truck', v: t('hero.trust.deliveryV'), l: t('hero.trust.deliveryL') },
  ];

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, var(--slate-950), var(--slate-900))',
        borderBottom: '1px solid var(--border-on-inverse)',
      }}
    >
      <HeroBackdrop />

      <div className="nr-hero-grid" style={{
        position: 'relative', zIndex: 1,
        maxWidth: 'var(--container)', margin: '0 auto',
        padding: '88px var(--space-6) 80px',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 56, alignItems: 'center',
      }}>
        {/* Left: text */}
        <Reveal>
          <div style={{
            display: 'inline-block',
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 16,
          }}>
            {t('hero.overline')}
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 4, flexShrink: 0, background: 'var(--nr-accent)', borderRadius: 2 }} />
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--fw-bold)',
              fontSize: 'var(--fs-display-xl)',
              lineHeight: 'var(--lh-tight)',
              letterSpacing: 'var(--ls-mega)',
              textTransform: 'uppercase',
              color: 'var(--white)',
              margin: 0,
              whiteSpace: 'pre-line',
              overflowWrap: 'break-word',
            }}>
              {t('hero.headline')}
            </h1>
          </div>

          <p style={{
            marginTop: 24, fontSize: 'var(--fs-body-lg)',
            lineHeight: 'var(--lh-body)', maxWidth: 460,
            color: 'var(--slate-300)',
          }}>
            {t('hero.body')}
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" size="lg" onClick={() => go('contact')}>
              {t('hero.cta')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => go('products')}
              style={{ color: 'var(--white)', borderColor: 'var(--border-on-inverse)', background: 'transparent' }}
            >
              {t('hero.viewProducts')}
            </Button>
          </div>

          {/* Trust indicators */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 40,
            paddingTop: 28, borderTop: '1px solid var(--border-on-inverse)',
          }}>
            {trust.map((it) => (
              <div key={it.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 38, height: 38, flexShrink: 0,
                  background: 'rgba(249,115,22,0.12)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <Icon name={it.icon} size={18} color="var(--nr-accent)" />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                    fontSize: 22, lineHeight: 1, color: 'var(--white)',
                  }}>
                    {it.v}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 'var(--fs-caption)',
                    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--slate-400)',
                  }}>
                    {it.l}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Right: interactive wireframe globe (subtle parallax) */}
        <motion.div style={reduce
          ? { display: 'flex', justifyContent: 'center' }
          : { y: photoY, display: 'flex', justifyContent: 'center' }}>
          <RotatingEarth width={520} height={520} />
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .nr-hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  );
}

/* ── Stats Strip ────────────────────────────────────────────── */
function StatItem({ s, counter = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
      padding: '0 36px', borderLeft: '1px solid var(--border-on-inverse)',
      whiteSpace: 'nowrap',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 5,
        fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
        fontSize: 'clamp(1.6rem, 2.4vw, 2.1rem)', lineHeight: 1,
        color: 'var(--white)',
      }}>
        {counter ? <AnimatedCounter value={s.value} /> : s.value}
        {s.unit && (
          <span style={{ fontSize: '0.42em', color: 'var(--nr-accent)', fontWeight: 'var(--fw-bold)' }}>
            {s.unit}
          </span>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-medium)',
        fontSize: 'var(--fs-caption)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--slate-400)',
      }}>
        {s.label}
      </div>
    </div>
  );
}

function StatsStrip() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const stats = [
    { value: '12 000', unit: 't/day', label: t('hero.stats.capacity') },
    { value: '1000+',  unit: null,    label: t('hero.stats.projects') },
    { value: '30',     unit: t('hero.stats.yrsUnit'), label: t('hero.stats.operation') },
    { value: '3',      unit: null,    label: 'Линейки продуктов' },
  ];

  // Reduced motion: keep the original static, evenly-spaced strip.
  if (reduce) {
    return (
      <section style={{ background: 'var(--surface-inverse)' }}>
        <Stagger className="nr-grid-4" style={{
          maxWidth: 'var(--container)', margin: '0 auto',
          padding: '48px var(--space-6)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
        }}>
          {stats.map((s, i) => (
            <StaggerItem key={i} style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              paddingLeft: i > 0 ? 32 : 0,
              borderLeft: i > 0 ? '1px solid var(--border-on-inverse)' : 'none',
            }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 6,
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                fontSize: 'clamp(2.25rem, 3.5vw, 3rem)', lineHeight: 1, color: 'var(--white)',
              }}>
                <AnimatedCounter value={s.value} />
                {s.unit && (
                  <span style={{ fontSize: '0.42em', color: 'var(--nr-accent)', fontWeight: 'var(--fw-bold)' }}>
                    {s.unit}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-medium)',
                fontSize: 'var(--fs-caption)', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--slate-400)',
              }}>
                {s.label}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    );
  }

  // Duplicate the list so translateX(-50%) loops seamlessly.
  const track = [...stats, ...stats];

  return (
    <section style={{ background: 'var(--surface-inverse)', overflow: 'hidden' }}>
      <div className="nr-stats-marquee" style={{ padding: '32px 0' }}>
        <div className="nr-stats-track" style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
          {track.map((s, i) => (
            <StatItem key={i} s={s} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes nr-stats-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .nr-stats-track {
          animation: nr-stats-scroll 16s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .nr-stats-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

/* ── Product Preview ─────────────────────────────────────────── */
function SpecStat({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
        fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-subtle)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-medium)',
        fontSize: 'var(--fs-body-sm)', color: 'var(--text-strong)', whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

function ProductCard({ p, go }) {
  const { t } = useTranslation();
  const [hover, setHover] = React.useState(false);
  const name  = t(`pd.${p.id}.name`,  p.name);
  const blurb = t(`pd.${p.id}.blurb`, p.blurb);
  const cat   = t(`cat.${p.cat}`,     p.cat);

  const hasDiameter = p.diameter && p.diameter !== '—';
  const hasLoad     = p.load && p.load !== '—';
  const hasSpecs    = hasDiameter || hasLoad;

  return (
    <motion.div
      onClick={() => go('product', p.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--surface-card)',
        border: hover ? '1px solid var(--nr-accent)' : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      }}
    >
      {/* Top orange accent on hover */}
      <div style={{
        height: 3, background: hover ? 'var(--nr-accent)' : 'transparent',
        transition: 'background var(--dur-base)',
      }} />

      {/* Product image banner */}
      <div style={{
        position: 'relative', height: 180, overflow: 'hidden',
        background: 'var(--surface-sunken)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {p.image && (
          <img
            src={p.image}
            alt={name}
            loading="lazy"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform var(--dur-base)',
            }}
          />
        )}
        {/* Category badge */}
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: hover ? 'var(--nr-accent)' : 'var(--text-muted)',
          background: 'rgba(255,255,255,0.92)',
          border: `1px solid ${hover ? 'var(--nr-accent)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-xs)', padding: '3px 8px',
          backdropFilter: 'blur(2px)',
          transition: 'color var(--dur-base), border-color var(--dur-base)',
        }}>
          {cat}
        </span>
        {/* Icon chip */}
        <span style={{
          position: 'absolute', bottom: 12, left: 12,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--orange-100)',
          backdropFilter: 'blur(2px)',
        }}>
          <Icon name={p.icon} size={20} color="var(--nr-accent)" />
        </span>
      </div>

      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
          textTransform: 'uppercase', fontSize: 20,
          lineHeight: 'var(--lh-snug)', margin: '0 0 8px',
          color: 'var(--text-strong)',
        }}>
          {name}
        </h3>
        <p style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', margin: 0, minHeight: 60 }}>
          {blurb}
        </p>

        {/* Quick-spec row (or scope fallback) */}
        <div style={{
          display: 'flex', gap: 28, marginTop: 16, paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {hasSpecs ? (
            <>
              {hasDiameter && <SpecStat label={t('catalog.diameter')} value={`Ø ${p.diameter} мм`} />}
              {hasLoad     && <SpecStat label={t('catalog.maxLoad')}  value={`${p.load} Н`} />}
            </>
          ) : (
            <SpecStat label={t(`cat.${p.cat}`, p.cat)} value={t('preview.byOrder', 'Проектирование под ключ')} />
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 18,
          color: 'var(--nr-accent)',
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-body-sm)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {t('catalog.viewSpecs')}
          <motion.span
            style={{ display: 'inline-flex' }}
            animate={{ x: hover ? 4 : 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon name="arrow" size={14} color="var(--nr-accent)" />
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

function OurProducts({ go }) {
  const { t } = useTranslation();
  const { products } = useProducts();

  return (
    <section style={{ background: 'var(--surface-page)' }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '80px var(--space-6)' }}>
        {/* Centered heading + intro */}
        <Reveal style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 48px' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('preview.overline')}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-md)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--text-strong)',
          }}>
            {t('preview.headline')}
          </h2>
          <p style={{
            marginTop: 16, fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)',
            color: 'var(--text-body)', margin: '16px 0 0',
          }}>
            {t('preview.body')}
          </p>
        </Reveal>

        {/* Balanced 3-column product grid (all products), responsive */}
        <Stagger className="nr-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {products.map((p) => (
            <StaggerItem key={p.id}>
              <ProductCard p={p} go={go} />
            </StaggerItem>
          ))}
        </Stagger>
        <style>{`
          @media (max-width: 900px) {
            .nr-product-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 560px) {
            .nr-product-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* View-all CTA */}
        <Reveal style={{ textAlign: 'center', marginTop: 40 }}>
          <Button
            variant="outline"
            size="lg"
            onClick={() => go('products')}
            iconRight={<Icon name="arrow" size={15} color="var(--text-body)" />}
          >
            {t('preview.all')}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Capabilities / Trust Section ───────────────────────────── */
function Capabilities() {
  const { t } = useTranslation();
  const items = [
    { icon: 'cog',    h: t('cap.items.cog.h'),    p: t('cap.items.cog.p') },
    { icon: 'shield', h: t('cap.items.shield.h'), p: t('cap.items.shield.p') },
    { icon: 'ruler',  h: t('cap.items.ruler.h'),  p: t('cap.items.ruler.p') },
    { icon: 'truck',  h: t('cap.items.truck.h'),  p: t('cap.items.truck.p') },
  ];

  return (
    <section style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '80px var(--space-6)' }}>
        <Reveal style={{ marginBottom: 44 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 10,
          }}>
            {t('cap.overline')}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-md)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--text-strong)',
          }}>
            {t('cap.headline')}
          </h2>
        </Reveal>

        <Stagger className="nr-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {items.map((it) => (
            <StaggerItem key={it.icon}>
            <Card variant="default" padding={24}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44,
                background: 'var(--orange-50)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--orange-100)',
              }}>
                <Icon name={it.icon} size={22} color="var(--nr-accent)" />
              </span>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                textTransform: 'uppercase', fontSize: 18,
                lineHeight: 'var(--lh-snug)', margin: '16px 0 8px',
                color: 'var(--text-strong)',
              }}>
                {it.h}
              </h3>
              <p style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', margin: 0 }}>
                {it.p}
              </p>
            </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ── CTA Band ───────────────────────────────────────────────── */
function CtaBand({ go }) {
  const { t } = useTranslation();
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, var(--slate-950), var(--slate-900))',
      borderTop: '1px solid var(--border-on-inverse)',
    }}>
      <HeroBackdrop />
      <Reveal style={{
        position: 'relative', zIndex: 1,
        maxWidth: 'var(--container)', margin: '0 auto',
        padding: '72px var(--space-6)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
          textTransform: 'uppercase',
          fontSize: 'var(--fs-display-lg)', lineHeight: 'var(--lh-tight)',
          color: 'var(--white)', margin: 0,
        }}>
          {t('cta.headline')}
        </h2>
        <p style={{
          fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)',
          color: 'var(--slate-400)', maxWidth: 480, margin: 0,
        }}>
          {t('cta.body')}
        </p>
        <Button variant="primary" size="lg" onClick={() => go('contact')}>
          {t('cta.btn')}
        </Button>
      </Reveal>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export function Home({ go }) {
  return (
    <div>
      <Hero go={go} />
      <StatsStrip />
      <OurProducts go={go} />
      <ProcessVideos />
      <ProjectsMap />
      <Capabilities />
      <Testimonials />
      <CtaBand go={go} />
    </div>
  );
}
