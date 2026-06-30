import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Icon } from '../../pages/Icon';
import { PHONE_HREF, TELEGRAM_HREF } from '../../lib/contact';

/* Floating click-to-chat dock — fixed bottom-right on every page.
 * Telegram + Call are the channels Uzbek B2B buyers actually use, so we keep
 * them one tap away regardless of where the visitor is. Sits below modals
 * (z-index 90 < the 100 used by QuoteModal/AddReviewModal). */

const ACTIONS = [
  { id: 'telegram', icon: 'telegram', href: TELEGRAM_HREF, external: true,  bg: '#229ED9' },
  { id: 'call',     icon: 'phone',    href: PHONE_HREF,    external: false, bg: 'var(--nr-accent)' },
];

function DockButton({ action, label }) {
  const [hover, setHover] = React.useState(false);
  return (
    <motion.a
      href={action.href}
      {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      aria-label={label}
      title={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        height: 52, padding: hover ? '0 20px 0 16px' : 0,
        width: hover ? 'auto' : 52,
        borderRadius: 'var(--radius-pill)',
        background: action.bg, color: 'var(--white)',
        boxShadow: 'var(--shadow-md)', textDecoration: 'none',
        overflow: 'hidden', justifyContent: hover ? 'flex-start' : 'center',
        transition: 'width var(--dur-base), padding var(--dur-base)',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 52, height: 52, flexShrink: 0, marginLeft: hover ? -16 : 0,
        transition: 'margin var(--dur-base)',
      }}>
        <Icon name={action.icon} size={24} color="var(--white)" stroke={2} />
      </span>
      {hover && (
        <span style={{
          fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-body-sm)', letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
    </motion.a>
  );
}

export function ContactDock() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', right: 'var(--space-6)', bottom: 'var(--space-6)',
        zIndex: 90, display: 'flex', flexDirection: 'column', gap: 12,
        alignItems: 'flex-end',
      }}
    >
      {ACTIONS.map((a) => (
        <DockButton key={a.id} action={a} label={t(`chat.${a.id}`)} />
      ))}
    </motion.div>
  );
}
