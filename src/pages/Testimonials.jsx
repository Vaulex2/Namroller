import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/core/Button';
import { Reveal } from '../components/motion/Reveal';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';
import { AddReviewModal } from './AddReviewModal';
import { SEED_META } from './testimonialsData';
import { fetchReviews } from '../lib/reviews';

/* Round-robin into 3 columns so reviews spread across the layout. */
function toColumns(list) {
  const cols = [[], [], []];
  list.forEach((item, i) => cols[i % 3].push(item));
  return cols;
}

export function Testimonials() {
  const { t, i18n } = useTranslation();
  const [remote, setRemote] = React.useState(null); // null = not loaded; [] = loaded/empty
  const [open, setOpen] = React.useState(false);

  // Localized seed: merge language-neutral meta (name/image/rating) with the
  // translated text/role from i18n. Recomputes when the language changes.
  const localizedSeed = React.useMemo(() => {
    const texts = t('testimonials.seed', { returnObjects: true });
    const arr = Array.isArray(texts) ? texts : [];
    return SEED_META.map((m, i) => ({
      ...m,
      text: arr[i]?.text || '',
      role: arr[i]?.role || '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.language]);

  React.useEffect(() => {
    let alive = true;
    fetchReviews()
      .then((data) => { if (alive) setRemote(data || []); })
      .catch(() => { if (alive) setRemote([]); /* fall back to localized seed */ });
    return () => { alive = false; };
  }, []);

  // Use stored (approved) reviews when present, otherwise the localized seed.
  // New submissions are held for moderation, so they are NOT injected here — the
  // modal shows a "pending approval" confirmation instead.
  const base = remote && remote.length ? remote : localizedSeed;
  const [c1, c2, c3] = toColumns(base);

  return (
    <section style={{ background: 'var(--surface-page)' }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '80px var(--space-6)' }}>
        {/* Section header — mirrors OurProducts / Capabilities */}
        <Reveal style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 40px' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('testimonials.overline')}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-md)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--text-strong)',
          }}>
            {t('testimonials.headline')}
          </h2>
          <p style={{
            marginTop: 16, fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)',
            color: 'var(--text-body)', margin: '16px 0 0',
          }}>
            {t('testimonials.body')}
          </p>
        </Reveal>

        {/* Scrolling columns */}
        <div
          className="nr-testi-cols"
          style={{
            display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8,
            maxHeight: 740, overflow: 'hidden',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
          }}
        >
          <TestimonialsColumn testimonials={c1} duration={45} />
          <TestimonialsColumn testimonials={c2} duration={55} className="nr-testi-md" />
          <TestimonialsColumn testimonials={c3} duration={50} className="nr-testi-lg" />
        </div>

        {/* Add-review CTA */}
        <Reveal style={{ textAlign: 'center', marginTop: 40 }}>
          <Button variant="primary" size="lg" onClick={() => setOpen(true)}>
            {t('testimonials.addBtn')}
          </Button>
        </Reveal>

        <style>{`
          @keyframes nr-testi-scroll {
            from { transform: translateY(0); }
            to   { transform: translateY(-50%); }
          }
          .nr-testi-track {
            animation-name: nr-testi-scroll;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            will-change: transform;
          }
          .nr-testi-md { display: none; }
          .nr-testi-lg { display: none; }
          @media (min-width: 768px) { .nr-testi-md { display: block; } }
          @media (min-width: 1024px) { .nr-testi-lg { display: block; } }
        `}</style>
      </div>

      <AddReviewModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
