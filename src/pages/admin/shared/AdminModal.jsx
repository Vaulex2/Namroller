import React from 'react';
import { Card } from '../../../components/surfaces/Card';
import { Button } from '../../../components/core/Button';

/* Shared modal chrome: overlay, esc-to-close, body-scroll-lock, close button.
   Extracted from QuoteDetail's hand-built overlay so ProductForm (and any
   future admin modal) doesn't reimplement it. Pure UI shell — callers own
   their own data fetching/mutation state. */
export function AdminModal({ onClose, title, closeLabel, maxWidth = 760, children, footer }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto',
        background: 'rgba(15, 23, 42, 0.55)', padding: 'var(--space-6) 16px',
      }}
    >
      <Card padding={24} className="nr-modal-card" style={{ maxWidth, margin: '0 auto', boxShadow: 'var(--shadow-lg)' }}>
        {(title || closeLabel) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            {title && <strong style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-h5)' }}>{title}</strong>}
            <Button variant="outline" size="sm" onClick={onClose}>{closeLabel}</Button>
          </div>
        )}
        {children}
        {footer && <div style={{ marginTop: 20 }}>{footer}</div>}
      </Card>
    </div>
  );
}
