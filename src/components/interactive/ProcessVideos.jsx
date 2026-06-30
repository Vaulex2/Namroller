import { useTranslation } from 'react-i18next';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';
import { ProcessShowcase } from './ProcessShowcase';

/* ── Manufacturing video gallery ───────────────────────────────
   Replaces the interactive process stepper on the Home page with a small
   gallery of real manufacturing videos (cutting, welding, assembly, …).

   To add videos: drop the files into /public/videos/ and add an entry below.
   `src` is resolved from the site root, so "/videos/foo.mp4" maps to
   public/videos/foo.mp4. While the list is empty the section falls back to
   the original <ProcessShowcase /> stepper, so the live page is never blank. */

const PROCESS_VIDEOS = [
  { src: '/video_2026-06-27_17-26-16.mp4', title: '' },
  { src: '/video_2026-06-27_17-26-45.mp4', title: '' },
  { src: '/video_2026-06-27_17-27-11.mp4', title: '' },
];

function VideoCard({ video }) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{
        position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden',
        border: '1px solid var(--border-subtle)', background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06))',
      }}>
        <video
          src={video.src}
          poster={video.poster}
          controls
          preload="metadata"
          playsInline
          style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', background: 'var(--slate-900)' }}
        />
      </div>
      {video.title && (
        <figcaption style={{
          marginTop: 12, fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-snug)',
          color: 'var(--text-body)', fontWeight: 'var(--fw-medium)',
        }}>
          {video.title}
        </figcaption>
      )}
    </figure>
  );
}

export function ProcessVideos() {
  const { t } = useTranslation();

  // No videos wired up yet — keep the interactive stepper in place.
  if (PROCESS_VIDEOS.length === 0) return <ProcessShowcase />;

  return (
    <section
      className="nr-process-videos"
      style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-subtle)' }}
    >
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '80px var(--space-6)' }}>
        <Reveal style={{ maxWidth: 660, margin: '0 auto 8px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('process.overline')}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 'var(--fs-display-md)',
            lineHeight: 'var(--lh-tight)', margin: 0, color: 'var(--text-strong)',
          }}>
            {t('process.headline')}
          </h2>
          <p style={{ marginTop: 16, fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', margin: '16px 0 0' }}>
            {t('process.body')}
          </p>
        </Reveal>

        <Stagger
          style={{
            display: 'grid', gap: 24, marginTop: 48,
            gridTemplateColumns: PROCESS_VIDEOS.length === 1
              ? 'minmax(0, 820px)'
              : 'repeat(auto-fit, minmax(320px, 1fr))',
            justifyContent: 'center',
          }}
        >
          {PROCESS_VIDEOS.map((v, i) => (
            <StaggerItem key={i}>
              <VideoCard video={v} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
