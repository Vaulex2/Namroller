import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UzbekistanMap } from '../../pages/UzbekistanMap';
import { Icon } from '../../pages/Icon';
import { Reveal } from '../motion/Reveal';
import { Stagger, StaggerItem } from '../motion/Stagger';
import { NR_PROJECTS } from '../../pages/projects';

/* ── Interactive Uzbekistan projects map ───────────────────────
   City pins overlaid on the country silhouette. Hover (or tap) a pin to
   reveal a project detail card. Pins stagger in and pulse; static & tappable
   under reduced motion. */

function Pin({ p, active, onActivate, onClear, onToggle }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const city = t(`projects.items.${p.id}.city`, p.id);

  return (
    <div
      style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
      onMouseEnter={onActivate}
      onMouseLeave={onClear}
      onClick={onToggle}
    >
      {/* Pulse halo */}
      {!reduce && (
        <motion.span
          aria-hidden="true"
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 14, height: 14, borderRadius: '50%',
            background: 'var(--nr-accent)', translateX: '-50%', translateY: '-50%',
          }}
          animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: (p.x % 7) * 0.18 }}
        />
      )}

      {/* Dot */}
      <button
        type="button"
        aria-label={city}
        style={{
          position: 'relative', display: 'block',
          width: active ? 18 : 14, height: active ? 18 : 14,
          borderRadius: '50%', cursor: 'pointer', padding: 0,
          background: 'var(--nr-accent)',
          border: '2px solid var(--white)',
          boxShadow: active ? 'var(--shadow-accent)' : 'var(--shadow-sm)',
          transition: 'width var(--dur-fast), height var(--dur-fast)',
        }}
      />

      {/* City label */}
      <span style={{
        position: 'absolute', left: '50%', top: 'calc(100% + 4px)', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'nowrap',
        color: active ? 'var(--text-strong)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400, pointerEvents: 'none',
      }}>
        {city}
      </span>

      {/* Detail card — edge pins anchor left/right instead of centering, so
          the card can't spill past the map/viewport edge (nukus, urgench on
          the left; namangan, fergana, andijan on the right, per NR_PROJECTS'
          x coordinates). A capped vw width adds a further safety margin on
          narrow phones regardless of exact pin position. */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', bottom: 'calc(100% + 12px)',
              ...(p.x <= 30
                ? { left: 0 }
                : p.x >= 78
                  ? { right: 0 }
                  : { left: '50%', transform: 'translateX(-50%)' }),
              width: 'min(220px, 62vw)', zIndex: 5, pointerEvents: 'none',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, flexShrink: 0,
                background: 'var(--orange-50)', border: '1px solid var(--orange-100)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <Icon name={p.icon} size={16} color="var(--nr-accent)" />
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
                  textTransform: 'uppercase', fontSize: 15, lineHeight: 1, color: 'var(--text-strong)',
                }}>
                  {city}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {p.year}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-snug)',
              color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)', marginBottom: 4,
            }}>
              {t(`projects.items.${p.id}.name`)}
            </div>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-body)' }}>
              {t(`projects.items.${p.id}.type`)} · {t(`projects.items.${p.id}.capacity`)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProjectsMap() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(null);

  return (
    <section style={{ background: 'var(--surface-page)', borderTop: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '80px var(--space-6)' }}>
        <Reveal style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 40px' }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
            fontSize: 'var(--fs-overline)', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--nr-accent)', marginBottom: 12,
          }}>
            {t('projects.overline')}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
            textTransform: 'uppercase', fontSize: 'var(--fs-display-md)',
            lineHeight: 'var(--lh-tight)', margin: 0, color: 'var(--text-strong)',
          }}>
            {t('projects.headline')}
          </h2>
          <p style={{ marginTop: 16, fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-body)', color: 'var(--text-body)', margin: '16px 0 0' }}>
            {t('projects.body')}
          </p>
        </Reveal>

        {/* Map + pins */}
        <Stagger
          className="nr-map-wrap"
          style={{
            position: 'relative', width: '100%', maxWidth: 860, margin: '0 auto',
            aspectRatio: '1 / 1',
          }}
          onMouseLeave={() => setActiveId(null)}
        >
          <UzbekistanMap
            fill="var(--border-default)"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
            }}
          />

          {NR_PROJECTS.map((p) => (
            <StaggerItem
              key={p.id}
              style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 0, height: 0 }}
            >
              <Pin
                p={p}
                active={activeId === p.id}
                onActivate={() => setActiveId(p.id)}
                onClear={() => setActiveId((cur) => (cur === p.id ? null : cur))}
                // Touch has no hover-to-clear gesture, so tapping the
                // already-open pin again is the only way to dismiss it there.
                onToggle={() => setActiveId((cur) => (cur === p.id ? null : p.id))}
              />
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal style={{ textAlign: 'center', marginTop: 28 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            {t('projects.hint')}
          </span>
        </Reveal>
      </div>
    </section>
  );
}
