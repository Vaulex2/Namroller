import React from 'react';
import { motion } from 'framer-motion';

export function Button({
  children,
  as = 'button',
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const MotionTag = motion[as] || motion.button;
  const isButton = as === 'button';
  const sizes = {
    sm: { padding: '0 16px', height: 36, fontSize: '0.75rem' },
    md: { padding: '0 22px', height: 44, fontSize: '0.8125rem' },
    lg: { padding: '0 32px', height: 52, fontSize: '0.9375rem' },
  };

  const variants = {
    primary: {
      background: 'var(--nr-accent)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--nr-accent)',
      boxShadow: 'var(--shadow-accent)',
    },
    secondary: {
      background: 'var(--slate-900)',
      color: 'var(--white)',
      border: '1px solid var(--slate-900)',
      boxShadow: 'var(--shadow-sm)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-strong)',
      border: '1px solid var(--border-default)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-body)',
      border: '1px solid transparent',
      boxShadow: 'none',
    },
    danger: {
      background: 'var(--danger)',
      color: 'var(--white)',
      border: '1px solid var(--danger)',
      boxShadow: 'none',
    },
  };

  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;

  return (
    <MotionTag
      type={isButton ? type : undefined}
      disabled={isButton ? disabled : undefined}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -1, filter: 'brightness(0.9)' }}
      whileTap={disabled ? undefined : { y: 1 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--fw-semibold)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 1,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        width: fullWidth ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        boxSizing: 'border-box',
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        ...v,
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </MotionTag>
  );
}
