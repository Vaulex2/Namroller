import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/* ── Isometric projection ──────────────────────────────────────
   A small dimetric projection: the conveyor runs along +y (length),
   the belt width along x, and z is height. Increasing y moves the
   point down-left (front); decreasing y moves it up-right (back),
   so material travels "up the line" toward the upper-right. */
const COS30 = 0.8660254, SIN30 = 0.5, S = 26, OX = 300, OY = 188;
const P = (x, y, z) => [OX + (x - y) * COS30 * S, OY + (x + y) * SIN30 * S - z * S];
const pt = (x, y, z) => { const [a, b] = P(x, y, z); return `${a.toFixed(1)},${b.toFixed(1)}`; };

const W = 1.45, Y0 = -5, Y1 = 5, ZB = 3;

/* Belt deck surface (top) */
const DECK = [pt(-W, Y0, ZB), pt(W, Y0, ZB), pt(W, Y1, ZB), pt(-W, Y1, ZB)].join(' ');
/* Front-right rail (belt thickness on the +x side) */
const RAIL = [pt(W, Y0, ZB), pt(W, Y1, ZB), pt(W, Y1, ZB - 0.3), pt(W, Y0, ZB - 0.3)].join(' ');
/* Front end cap (+y end of the belt) */
const ENDCAP = [pt(-W, Y1, ZB), pt(W, Y1, ZB), pt(W, Y1, ZB - 0.3), pt(-W, Y1, ZB - 0.3)].join(' ');

/* Roller wheels along the front-right edge */
const WHEELS = [];
for (let y = -4; y <= 4; y += 1) WHEELS.push(P(W, y, ZB - 0.55));

/* Support legs (two A-frames) */
const LEGS = [-3, 3].flatMap((y) => ([
  { a: pt(W, y, ZB - 0.3),  b: pt(W, y, 0) },
  { a: pt(-W, y, ZB - 0.3), b: pt(-W, y, 0) },
  { a: pt(W, y, 0.2),       b: pt(-W, y, 0.2) }, // cross member
]));

/* Belt chevrons (motion lines across the deck) */
const CHEVRONS = [];
for (let y = -6; y <= 6; y += 0.9) CHEVRONS.push({ a: pt(-W, y, ZB + 0.02), b: pt(W, y, ZB + 0.02) });
/* One chevron-spacing of travel in screen space (Δy = -0.9, up the line) */
const CHEV_DX = (0.9 * COS30 * S).toFixed(2);
const CHEV_DY = (-0.9 * SIN30 * S).toFixed(2);

/* Package travel: from front (y=4) to back (y=-4), i.e. Δy = -8 */
const PKG_DX = (8 * COS30 * S);   // +180
const PKG_DY = (-8 * SIN30 * S);  // -104

/* One steel package (3 visible faces) at belt-space center (cx, cy) */
function Package({ cx = 0, cy = 4 }) {
  const hw = 0.62, hd = 0.62, h = 1.2;
  const top = [
    pt(cx - hw, cy - hd, ZB + h), pt(cx + hw, cy - hd, ZB + h),
    pt(cx + hw, cy + hd, ZB + h), pt(cx - hw, cy + hd, ZB + h),
  ].join(' ');
  const front = [
    pt(cx - hw, cy + hd, ZB), pt(cx + hw, cy + hd, ZB),
    pt(cx + hw, cy + hd, ZB + h), pt(cx - hw, cy + hd, ZB + h),
  ].join(' ');
  const right = [
    pt(cx + hw, cy + hd, ZB), pt(cx + hw, cy - hd, ZB),
    pt(cx + hw, cy - hd, ZB + h), pt(cx + hw, cy + hd, ZB + h),
  ].join(' ');
  return (
    <g>
      <polygon points={right} fill="#475569" />
      <polygon points={front} fill="#64748B" />
      <polygon points={top} fill="#CBD5E1" stroke="var(--nr-accent)" strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

export function HeroConveyor({ reduce = false }) {
  const { t } = useTranslation();

  const specs = [
    { key: 'diameter', text: t('hero.specs.diameter'), style: { left: '4%',  top: '70%' } },
    { key: 'material', text: t('hero.specs.material'), style: { right: '3%', top: '34%' } },
    { key: 'bearing',  text: t('hero.specs.bearing'),  style: { left: '30%', top: '88%' } },
    { key: 'capacity', text: t('hero.specs.capacity'), style: { right: '5%', top: '8%'  } },
  ];

  const pkgTransition = (delay) => ({
    duration: 7, delay, repeat: Infinity, ease: 'linear',
  });

  return (
    <div className="nr-conveyor" style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox="0 0 600 440"
        width="100%"
        height="auto"
        role="img"
        aria-label="Isometric conveyor with rotating rollers and moving packages"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="nr-deck" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#334155" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
          <radialGradient id="nr-wheel" cx="0.38" cy="0.34" r="0.75">
            <stop offset="0" stopColor="#94A3B8" />
            <stop offset="0.6" stopColor="#475569" />
            <stop offset="1" stopColor="#1E293B" />
          </radialGradient>
          <clipPath id="nr-deck-clip"><polygon points={DECK} /></clipPath>
        </defs>

        {/* Ground shadow */}
        <ellipse cx={OX} cy={OY + 132} rx="150" ry="26" fill="#020617" opacity="0.35" />

        {/* Support legs */}
        {LEGS.map((l, i) => (
          <line key={i} x1={l.a.split(',')[0]} y1={l.a.split(',')[1]}
                x2={l.b.split(',')[0]} y2={l.b.split(',')[1]}
                stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        ))}

        {/* Belt body */}
        <polygon points={ENDCAP} fill="#0F172A" />
        <polygon points={RAIL} fill="#1E293B" />
        <polygon points={DECK} fill="url(#nr-deck)" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Animated belt chevrons (clipped to the deck) */}
        <g clipPath="url(#nr-deck-clip)">
          <g className="nr-belt">
            {CHEVRONS.map((c, i) => (
              <line key={i} x1={c.a.split(',')[0]} y1={c.a.split(',')[1]}
                    x2={c.b.split(',')[0]} y2={c.b.split(',')[1]}
                    stroke="#FFFFFF" strokeWidth="1.4" opacity="0.16" />
            ))}
          </g>
        </g>

        {/* Roller wheels (spinning) */}
        {WHEELS.map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx.toFixed(1)},${cy.toFixed(1)})`}>
            <circle r="12.5" fill="url(#nr-wheel)" stroke="#0F172A" strokeWidth="1.5" />
            <g className="nr-spin" style={{ animationDelay: `${(i * 0.22).toFixed(2)}s` }}>
              <line x1="-9" y1="0" x2="9" y2="0" stroke="#CBD5E1" strokeWidth="1.6" />
              <line x1="-4.5" y1="-7.8" x2="4.5" y2="7.8" stroke="var(--nr-accent)" strokeWidth="1.8" />
              <line x1="4.5" y1="-7.8" x2="-4.5" y2="7.8" stroke="#CBD5E1" strokeWidth="1.6" />
            </g>
            <circle r="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
          </g>
        ))}

        {/* Travelling packages */}
        {reduce ? (
          <>
            <g transform={`translate(${(2 * COS30 * S).toFixed(1)},${(-2 * SIN30 * S).toFixed(1)})`}><Package cx={0} cy={2} /></g>
            <g transform={`translate(${(6 * COS30 * S).toFixed(1)},${(-6 * SIN30 * S).toFixed(1)})`}><Package cx={0} cy={2} /></g>
          </>
        ) : (
          <>
            <motion.g
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: [0, PKG_DX], y: [0, PKG_DY], opacity: [0, 1, 1, 0] }}
              transition={pkgTransition(0)}
            >
              <Package cx={0} cy={4} />
            </motion.g>
            <motion.g
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: [0, PKG_DX], y: [0, PKG_DY], opacity: [0, 1, 1, 0] }}
              transition={pkgTransition(3.5)}
            >
              <Package cx={0} cy={4} />
            </motion.g>
          </>
        )}
      </svg>

      {/* Low-opacity technical spec annotations */}
      {specs.map((s) => (
        <div key={s.key} className="nr-spec" style={{ position: 'absolute', ...s.style }}>
          <span className="nr-spec-dot" />
          <span className="nr-spec-text">{s.text}</span>
        </div>
      ))}

      <style>{`
        @keyframes nr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nr-belt { from { transform: translate(0,0); } to { transform: translate(${CHEV_DX}px, ${CHEV_DY}px); } }
        .nr-spin { transform-box: fill-box; transform-origin: center; animation: nr-spin 3.4s linear infinite; }
        .nr-belt { animation: nr-belt 1.7s linear infinite; }

        .nr-spec {
          display: flex; align-items: center; gap: 8px;
          opacity: 0.55; pointer-events: none; white-space: nowrap;
        }
        .nr-spec-dot {
          width: 6px; height: 6px; flex-shrink: 0;
          border: 1px solid var(--nr-accent); border-radius: 50%;
          background: rgba(249,115,22,0.25);
        }
        .nr-spec-text {
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.02em;
          color: var(--slate-300);
          border-bottom: 1px solid rgba(148,163,184,0.35); padding-bottom: 2px;
        }

        @media (max-width: 900px) {
          .nr-spec { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nr-spin, .nr-belt { animation: none; }
        }
      `}</style>
    </div>
  );
}
