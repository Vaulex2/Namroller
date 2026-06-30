import React from 'react';
import { Icon } from './Icon';

/* Subtle, non-interactive background for the hero: blueprint grid,
   drifting diagonal motion lines, slow gear outlines and a corner glow.
   Everything is low-opacity and freezes under prefers-reduced-motion. */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="nr-backdrop"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    >
      {/* Blueprint grid */}
      <div className="nr-grid" style={{ position: 'absolute', inset: '-2px' }} />

      {/* Drifting diagonal motion lines */}
      <div className="nr-lines" style={{ position: 'absolute', inset: '-20%' }} />

      {/* Faint gear outlines */}
      <div className="nr-gear nr-gear-a" style={{ position: 'absolute', top: '-90px', right: '8%' }}>
        <Icon name="cog" size={280} stroke={1} color="#FFFFFF" />
      </div>
      <div className="nr-gear nr-gear-b" style={{ position: 'absolute', bottom: '-70px', left: '-40px' }}>
        <Icon name="cog" size={200} stroke={1} color="var(--nr-accent)" />
      </div>

      {/* Corner accent glow */}
      <div
        style={{
          position: 'absolute', top: '-160px', right: '-120px',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.18), rgba(249,115,22,0) 70%)',
        }}
      />

      <style>{`
        .nr-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 120% 100% at 70% 30%, #000 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 120% 100% at 70% 30%, #000 40%, transparent 100%);
        }
        .nr-lines {
          background-image: repeating-linear-gradient(
            -38deg,
            rgba(249,115,22,0.10) 0 2px,
            transparent 2px 64px
          );
          animation: nr-drift 9s linear infinite;
          opacity: 0.6;
        }
        .nr-gear { opacity: 0.05; }
        .nr-gear-a { animation: nr-rot 90s linear infinite; }
        .nr-gear-b { animation: nr-rot-rev 70s linear infinite; opacity: 0.07; }

        @keyframes nr-drift { from { transform: translate(0,0); } to { transform: translate(82px, 64px); } }
        @keyframes nr-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nr-rot-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .nr-lines, .nr-gear-a, .nr-gear-b { animation: none; }
        }
      `}</style>
    </div>
  );
}
