import React from 'react';
import { Icon } from './Icon';

export function Photo({ label, src, alt, icon = 'factory', height = 220, dark = false, style }) {
  const [failed, setFailed] = React.useState(false);
  const showImage = src && !failed;

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        background: dark
          ? 'linear-gradient(135deg, var(--slate-800), var(--slate-950))'
          : 'repeating-linear-gradient(45deg, var(--slate-100) 0 14px, var(--slate-200) 14px 28px)',
        border: dark ? '1px solid var(--border-on-inverse)' : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: dark ? 'var(--slate-400)' : 'var(--text-subtle)',
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || label || ''}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <>
          <Icon name={icon} size={40} stroke={1.5} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em' }}>{label}</span>
        </>
      )}
    </div>
  );
}
