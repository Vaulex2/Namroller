import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem, VIEWPORT } from './variants';
import { useScrollContainer } from './ScrollContext';

/* Container whose direct children cascade in on scroll. Wrap each child in
   <StaggerItem> (or give it the `staggerItem` variant). */
export function Stagger({ as = 'div', amount, style, children, ...rest }) {
  const reduce = useReducedMotion();
  const scrollRef = useScrollContainer();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag style={style} {...rest}>{children}</Tag>;
  }

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ ...VIEWPORT, amount: amount ?? 0.15, root: scrollRef }}
      variants={staggerContainer}
      style={style}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* A single staggered child. Inherits animation state from <Stagger>. */
export function StaggerItem({ as = 'div', style, children, ...rest }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag style={style} {...rest}>{children}</Tag>;
  }

  return (
    <MotionTag variants={staggerItem} style={style} {...rest}>
      {children}
    </MotionTag>
  );
}
