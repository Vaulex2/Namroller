import React, { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '../components/core/Button';
import { Tag } from '../components/core/Tag';
import { Card } from '../components/surfaces/Card';
import { SpecTable } from '../components/surfaces/SpecTable';
import { Icon } from './Icon';
import { Photo } from './Photo';
import { HeroBackdrop } from './HeroBackdrop';
import { NR_PRODUCTS } from './data';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';
import { QuoteModal } from './QuoteModal';
import { TELEGRAM_HREF } from '../lib/contact';

// Three.js viewer is heavy — load it only when a product page mounts a 3D view.
const Product3DViewer = lazy(() => import('../components/interactive/Product3DViewer'));

const toKey = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/* Product media with a Photo ⇄ 3D toggle (3D offered for physical rollers only). */
function ProductMedia({ p, name }) {
  const { t } = useTranslation();
  const supports3D = p.cat !== 'Systems';
  const [view, setView] = useState('photo');
  const is3D = supports3D && view === '3d';

  const fallback = (
    <Photo
      label={`${name} — ${t('viewer.photo')}`}
      src={p.image}
      alt={name}
      icon={p.icon}
      height={340}
      style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
    />
  );

  return (
    <div style={{ position: 'relative' }}>
      {is3D ? <Suspense fallback={fallback}><Product3DViewer product={p} height={340} /></Suspense> : fallback}

      {supports3D && (
        <div style={{
          position: 'absolute', top: 12, right: 12, display: 'flex',
          background: 'var(--surface-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-pill)', padding: 3, boxShadow: 'var(--shadow-sm)',
        }}>
          {[
            { id: 'photo', icon: 'image', label: t('viewer.photo') },
            { id: '3d',    icon: 'cube',  label: t('viewer.view3d') },
          ].map((opt) => {
            const on = view === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setView(opt.id)}
                aria-pressed={on}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-pill)',
                  background: on ? 'var(--nr-accent)' : 'transparent',
                  color: on ? 'var(--white)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
                  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'background var(--dur-fast), color var(--dur-fast)',
                }}
              >
                <Icon name={opt.icon} size={14} color="currentColor" stroke={1.8} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {is3D && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-400)',
          background: 'rgba(2,6,23,0.55)', padding: '4px 10px', borderRadius: 'var(--radius-pill)',
        }}>
          <Icon name="rotate" size={13} color="var(--nr-accent)" stroke={1.8} />
          {t('viewer.dragHint')}
        </div>
      )}
    </div>
  );
}

function useSpecTranslation() {
  const { t } = useTranslation();
  return (specs) =>
    specs.map((r) => ({
      ...r,
      label: t(`sl.${toKey(r.label)}`, r.label),
      value: t(`sv.${toKey(r.value)}`, r.value),
    }));
}

function ProductCard({ p, go }) {
  const { t } = useTranslation();
  const [hover, setHover] = React.useState(false);
  const name  = t(`pd.${p.id}.name`,  p.name);
  const blurb = t(`pd.${p.id}.blurb`, p.blurb);
  const cat   = t(`cat.${p.cat}`,     p.cat);

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
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transition: 'border-color var(--dur-base), box-shadow var(--dur-base)',
      }}
    >
      <div style={{
        height: 3,
        background: hover ? 'var(--nr-accent)' : 'transparent',
        transition: 'background var(--dur-base)',
      }} />
      <Photo
        label={`${name} — фото`}
        src={p.image}
        alt={name}
        icon={p.icon}
        height={160}
        style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-subtle)' }}
      />
      <div style={{ padding: '20px 20px 22px' }}>
        <span style={{
          display: 'inline-block',
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: hover ? 'var(--nr-accent)' : 'var(--text-muted)',
          border: `1px solid ${hover ? 'var(--nr-accent)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-xs)', padding: '2px 7px', marginBottom: 10,
          transition: 'color var(--dur-base), border-color var(--dur-base)',
        }}>
          {cat}
        </span>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
          textTransform: 'uppercase', fontSize: 20,
          lineHeight: 'var(--lh-snug)', margin: '0 0 8px',
          color: 'var(--text-strong)',
        }}>
          {name}
        </h3>
        <p style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', minHeight: 40 }}>
          {blurb}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 16,
          color: 'var(--nr-accent)',
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-body-sm)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {t('catalog.viewSpecs')}
          <Icon name="arrow" size={14} color="var(--nr-accent)" />
        </div>
      </div>
    </motion.div>
  );
}

export function Products({ go }) {
  const { t } = useTranslation();
  const filterDefs = [
    { id: 'All',     label: t('catalog.filters.All') },
    { id: 'Idlers',  label: t('catalog.filters.Idlers') },
    { id: 'Pulleys', label: t('catalog.filters.Pulleys') },
    { id: 'Systems', label: t('catalog.filters.Systems') },
  ];
  const [catId, setCatId] = React.useState('All');
  const list = catId === 'All' ? NR_PRODUCTS : NR_PRODUCTS.filter((p) => p.cat === catId);

  return (
    <div style={{ background: 'var(--surface-page)' }}>
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
            {t('catalog.overline')}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-lg)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--white)',
          }}>
            {t('catalog.headline')}
          </h1>
          <p style={{ marginTop: 14, fontSize: 'var(--fs-body-lg)', color: 'var(--slate-400)', maxWidth: 560 }}>
            {t('catalog.body')}
          </p>
        </Reveal>
      </div>

      {/* Filters + grid */}
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '36px var(--space-6) 88px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {filterDefs.map((f) => (
            <Tag
              key={f.id}
              active={catId === f.id}
              onClick={() => setCatId(f.id)}
            >
              {f.label}
            </Tag>
          ))}
        </div>
        {/* Re-stagger the grid whenever the active filter changes */}
        <Stagger key={catId} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {list.map((p) => (
            <StaggerItem key={p.id}>
              <ProductCard p={p} go={go} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}

// Full-width editorial band with a section heading. Alternating background.
function SectionBand({ heading, sunken = false, children }) {
  return (
    <div style={{
      background: sunken ? 'var(--surface-sunken)' : 'var(--surface-page)',
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '56px var(--space-6)' }}>
        <Reveal>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 28,
            color: 'var(--text-strong)', margin: '0 0 24px',
          }}>
            {heading}
          </h2>
        </Reveal>
        {children}
      </div>
    </div>
  );
}

// "How it's made" — numbered steps. Zips icon names (from data) with {title,text} (from i18n).
function ProcessSteps({ icons, steps }) {
  return (
    <Stagger style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 20 }}>
      {steps.map((s, i) => (
        <StaggerItem key={i}>
          <div style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: 'var(--nr-accent)', color: 'var(--white)',
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 15,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <Icon name={icons[i] || 'cog'} size={22} color="var(--text-strong)" stroke={1.5} />
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
              textTransform: 'uppercase', fontSize: 15, lineHeight: 'var(--lh-snug)',
              margin: '0 0 6px', color: 'var(--text-strong)',
            }}>
              {s.title}
            </h3>
            <p style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', margin: 0 }}>
              {s.text}
            </p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

// "Characteristics" — grid of feature cards. Zips icon names (from data) with {title,text} (from i18n).
function FeatureGrid({ icons, features }) {
  return (
    <Stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
      {features.map((f, i) => (
        <StaggerItem key={i}>
          <Card variant="default" padding={24} style={{ height: '100%' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, flexShrink: 0,
                borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)',
                border: '1px solid var(--border-subtle)',
              }}>
                <Icon name={icons[i] || 'check'} size={22} color="var(--nr-accent)" stroke={1.5} />
              </span>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                  textTransform: 'uppercase', fontSize: 16, lineHeight: 'var(--lh-snug)',
                  margin: '0 0 6px', color: 'var(--text-strong)',
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', margin: 0 }}>
                  {f.text}
                </p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

// "Applications" — list of use cases as static chips.
function ApplicationTags({ items }) {
  return (
    <Stagger style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {items.map((a, i) => (
        <StaggerItem key={i}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-medium)',
            fontSize: 'var(--fs-body-sm)',
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-card)', color: 'var(--text-body)',
            border: '1px solid var(--border-default)',
          }}>
            <Icon name="check" size={15} color="var(--nr-accent)" />
            {a}
          </span>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function ProductDetail({ id, go }) {
  const { t } = useTranslation();
  const translateSpecs = useSpecTranslation();
  const p = NR_PRODUCTS.find((x) => x.id === id) || NR_PRODUCTS[0];
  const related = NR_PRODUCTS.filter((x) => x.id !== p.id).slice(0, 3);
  const [quoteOpen, setQuoteOpen] = React.useState(false);
  const name  = t(`pd.${p.id}.name`,  p.name);
  const blurb = t(`pd.${p.id}.blurb`, p.blurb);
  const cat   = t(`cat.${p.cat}`,     p.cat);

  // Editorial prose lives in i18n; icon arrays in data drive section lengths.
  const overview     = t(`pd.${p.id}.overview`, '');
  const process      = t(`pd.${p.id}.process`,      { returnObjects: true, defaultValue: [] });
  const features     = t(`pd.${p.id}.features`,     { returnObjects: true, defaultValue: [] });
  const applications = t(`pd.${p.id}.applications`, { returnObjects: true, defaultValue: [] });
  const procIcons = p.content?.process  || [];
  const featIcons = p.content?.features || [];

  return (
    <div style={{ background: 'var(--surface-page)' }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '20px var(--space-6) 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        }}>
          <span style={{ cursor: 'pointer' }} onClick={() => go('home')}>{t('catalog.bc.home')}</span>
          <Icon name="chevron" size={12} />
          <span style={{ cursor: 'pointer' }} onClick={() => go('products')}>{t('catalog.bc.products')}</span>
          <Icon name="chevron" size={12} />
          <span style={{ color: 'var(--text-strong)' }}>{name}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 'var(--container)', margin: '0 auto',
        padding: '28px var(--space-6) 48px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48,
      }}>
        {/* Image column */}
        <Reveal>
          <ProductMedia p={p} name={name} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {p.videos?.length ? (
              p.videos.map((v, i) => (
                <video
                  key={i}
                  src={v.src}
                  poster={v.poster}
                  controls
                  muted
                  loop
                  playsInline
                  preload="none"
                  style={{
                    flex: 1, minWidth: 0, height: 120, objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                    background: 'var(--slate-900)',
                  }}
                />
              ))
            ) : (
              [0, 1, 2].map((i) => (
                <Photo
                  key={i} label="" src={p.image} alt={name} icon={p.icon} height={76}
                  style={{ flex: 1, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                />
              ))
            )}
          </div>
        </Reveal>

        {/* Info column */}
        <Reveal delay={0.1}>
          <span style={{
            display: 'inline-block',
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--nr-accent)',
            border: '1px solid var(--nr-accent)',
            borderRadius: 'var(--radius-xs)', padding: '2px 8px', marginBottom: 14,
          }}>
            {cat}
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            lineHeight: 'var(--lh-tight)', margin: 0,
            color: 'var(--text-strong)',
          }}>
            {name}
          </h1>
          <p style={{ marginTop: 14, fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)' }}>
            {blurb}
          </p>

          {/* Key specs quick view */}
          <div style={{
            display: 'flex', gap: 32, margin: '24px 0',
            padding: '20px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {t('catalog.diameter')}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                fontSize: 28, color: 'var(--text-strong)', marginTop: 4,
              }}>
                {p.diameter}
                <span style={{ fontSize: 14, color: 'var(--nr-accent)' }}> mm</span>
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)',
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {t('catalog.maxLoad')}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                fontSize: 28, color: 'var(--text-strong)', marginTop: 4,
              }}>
                {p.load}
                <span style={{ fontSize: 14, color: 'var(--nr-accent)' }}> N</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" onClick={() => setQuoteOpen(true)}>
              {t('catalog.reqQuote')}
            </Button>
            <Button
              as="a" href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer"
              variant="secondary" size="lg"
              iconLeft={<Icon name="telegram" size={16} color="var(--white)" />}
            >
              {t('chat.telegram')}
            </Button>
            <Button variant="outline" size="lg" iconLeft={<Icon name="download" size={16} color="var(--text-body)" />}>
              {t('catalog.specSheet')}
            </Button>
          </div>
        </Reveal>
      </div>

      {/* Overview */}
      {overview && (
        <SectionBand heading={t('catalog.sections.overview')} sunken>
          <Reveal>
            <p style={{
              fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)',
              color: 'var(--text-body)', margin: 0, maxWidth: 760,
            }}>
              {overview}
            </p>
          </Reveal>
        </SectionBand>
      )}

      {/* How it's made */}
      {process.length > 0 && (
        <SectionBand heading={t('catalog.sections.process')}>
          <ProcessSteps icons={procIcons} steps={process} />
        </SectionBand>
      )}

      {/* Characteristics */}
      {features.length > 0 && (
        <SectionBand heading={t('catalog.sections.features')} sunken>
          <FeatureGrid icons={featIcons} features={features} />
        </SectionBand>
      )}

      {/* Applications */}
      {applications.length > 0 && (
        <SectionBand heading={t('catalog.sections.applications')}>
          <ApplicationTags items={applications} />
        </SectionBand>
      )}

      {/* Full specifications */}
      <SectionBand heading={t('catalog.sections.fullSpecs')} sunken>
        <Reveal style={{ maxWidth: 760 }}>
          <SpecTable rows={translateSpecs(p.specs)} />
        </Reveal>
      </SectionBand>

      {/* Related products */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--surface-sunken)',
      }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '48px var(--space-6) 80px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 28,
            color: 'var(--text-strong)', margin: '0 0 24px',
          }}>
            {t('catalog.related')}
          </h2>
          <Stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {related.map((r) => (
              <StaggerItem key={r.id}>
                <ProductCard p={r} go={go} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>

      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} product={p} />
    </div>
  );
}
