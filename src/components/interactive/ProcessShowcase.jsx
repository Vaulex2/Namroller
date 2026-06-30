import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../../pages/Icon';
import { Reveal } from '../motion/Reveal';

/* ── Manufacturing process showcase ────────────────────────────
   An interactive "process explorer": a centered, numbered stepper the visitor
   clicks through fabrication stages — or just watches as it auto-advances while
   in view. The active stage expands to reveal its description and spec chips.
   Keyboard-navigable; under reduced motion it stops auto-advancing but stays clickable. */

const STAGE_ICONS = ['ruler', 'flame', 'cog', 'wrench', 'check'];
const AUTO_MS = 4200;

function Header({ t }) {
  return (
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
  );
}

export function ProcessShowcase() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const stepRefs = useRef([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  const stages = t('process.stages', { returnObjects: true, defaultValue: [] });
  const n = Array.isArray(stages) ? stages.length : 0;

  // Only run the auto-advance loop while the section is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance. Restarts on every `active` change so a manual pick gets a full
  // dwell before the next auto-step. Skipped under reduced motion / hover / off-screen.
  const running = !reduce && inView && !paused && n > 1;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setActive((i) => (i + 1) % n), AUTO_MS);
    return () => clearInterval(id);
  }, [running, n, active]);

  if (!n) return null;

  const onKeyDown = (e) => {
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (active + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (active - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    stepRefs.current[next]?.focus();
  };

  return (
    <section
      ref={sectionRef}
      className="nr-process"
      style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-subtle)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '80px var(--space-6)' }}>
        <Header t={t} />

        {/* Stage stepper with progress rail */}
        <div
          role="group"
          aria-label={t('process.headline')}
          onKeyDown={onKeyDown}
          style={{ position: 'relative', maxWidth: 640, margin: '48px auto 0', paddingLeft: 28 }}
        >
          {/* rail track + fill */}
          <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--border-default)' }} />
          <div style={{
            position: 'absolute', left: 7, top: 4, width: 2,
            height: `calc(${((active + 1) / n) * 100}% - 8px)`,
            background: 'var(--nr-accent)', transition: 'height var(--dur-base)',
          }} />

          {stages.map((s, i) => {
            const on = i <= active;
            const isCurrent = i === active;
            const chips = Array.isArray(s.chips) ? s.chips : [];
            return (
              <button
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => setActive(i)}
                className="nr-process-tab"
                style={{
                  position: 'relative', display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0',
                  font: 'inherit', color: 'inherit',
                }}
              >
                <span aria-hidden="true" style={{
                  position: 'absolute', left: -28, top: 18, width: 16, height: 16, borderRadius: '50%',
                  background: on ? 'var(--nr-accent)' : 'var(--surface-card)',
                  border: `2px solid ${on ? 'var(--nr-accent)' : 'var(--border-default)'}`,
                  transition: 'background var(--dur-base), border-color var(--dur-base)',
                }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: isCurrent ? 1 : on ? 0.85 : 0.5,
                  transition: 'opacity var(--dur-base)',
                }}>
                  <Icon name={STAGE_ICONS[i]} size={20} color={isCurrent ? 'var(--nr-accent)' : 'var(--text-muted)'} stroke={1.7} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase',
                    fontSize: isCurrent ? 24 : 19, lineHeight: 'var(--lh-snug)',
                    color: isCurrent ? 'var(--text-strong)' : 'var(--text-body)',
                    transition: 'font-size var(--dur-base), color var(--dur-base)',
                  }}>
                    {s.title}
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: reduce ? 0 : 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{
                        fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)',
                        color: 'var(--text-body)', margin: '8px 0 0', maxWidth: 560,
                      }}>
                        {s.text}
                      </p>
                      {chips.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {chips.map((c, ci) => (
                            <span key={ci} style={{
                              fontFamily: 'var(--font-mono, var(--font-body))', fontSize: 12, fontWeight: 'var(--fw-semibold)',
                              letterSpacing: '0.02em', color: 'var(--orange-700)',
                              padding: '4px 10px', borderRadius: 'var(--radius-pill, 999px)',
                              background: 'var(--orange-50)', border: '1px solid rgba(249,115,22,0.25)',
                              whiteSpace: 'nowrap',
                            }}>{c}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .nr-process-tab:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
          border-radius: var(--radius-sm);
        }
      `}</style>
    </section>
  );
}
