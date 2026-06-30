import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeroBackdrop } from './HeroBackdrop';
import { Reveal } from '../components/motion/Reveal';
import { Stagger, StaggerItem } from '../components/motion/Stagger';

/* Manufacturing clips. All are vertical (9:16) phone footage, so they render
   in portrait cards. Posters live in /public/posters and preload="none" keeps
   the ~48 MB of video off the wire until a visitor actually hits play. */
const CAP_VIDEOS = [
  { src: '/video_2026-06-28_00-30-36.mp4', poster: '/posters/video_2026-06-28_00-30-36.jpg' },
  { src: '/video_2026-06-28_00-30-40.mp4', poster: '/posters/video_2026-06-28_00-30-40.jpg' },
  { src: '/video_2026-06-28_00-31-03.mp4', poster: '/posters/video_2026-06-28_00-31-03.jpg' },
  { src: '/IMG_1823.mp4',                  poster: '/posters/IMG_1823.jpg' },
  { src: '/video_2026-06-28_22-46-37.mp4', poster: '/posters/video_2026-06-28_22-46-37.jpg' },
  { src: '/video_2026-06-28_22-47-34.mp4', poster: '/posters/video_2026-06-28_22-47-34.jpg' },
  { src: '/video_2026-06-28_22-48-05.mp4', poster: '/posters/video_2026-06-28_22-48-05.jpg' },
  { src: '/IMG_0948.mp4',                  poster: '/posters/IMG_0948.jpg' },
  { src: '/IMG_8870.mp4',                  poster: '/posters/IMG_8870.jpg' },
];

function CapVideoCard({ video }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
      background: 'var(--slate-900)', boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06))',
    }}>
      <video
        src={video.src}
        poster={video.poster}
        controls
        playsInline
        preload="none"
        style={{ display: 'block', width: '100%', aspectRatio: '9 / 16', objectFit: 'cover' }}
      />
    </div>
  );
}

/**
 * Imkoniyatlar (Capabilities) page — gallery of vertical manufacturing clips.
 */
export function Capabilities() {
  const { t } = useTranslation();

  return (
    <div style={{ background: 'var(--surface-page)', minHeight: '60vh' }}>
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
            {t('capPage.overline')}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase',
            fontSize: 'var(--fs-display-lg)', lineHeight: 'var(--lh-tight)',
            margin: 0, color: 'var(--white)',
          }}>
            {t('capPage.headline')}
          </h1>
          <p style={{ marginTop: 14, fontSize: 'var(--fs-body-lg)', color: 'var(--slate-400)', maxWidth: 560 }}>
            {t('capPage.body')}
          </p>
        </Reveal>
      </div>

      {/* Content area — vertical manufacturing clips. */}
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '36px var(--space-6) 88px' }}>
        <Stagger style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {CAP_VIDEOS.map((v, i) => (
            <StaggerItem key={i}>
              <CapVideoCard video={v} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
