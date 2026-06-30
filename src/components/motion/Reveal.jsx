import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, VIEWPORT } from './variants';
import { useScrollContainer } from './ScrollContext';

/* Scroll-triggered entrance reveal. Renders a motion element that fades/slides
   in once when it scrolls into the app's scroll container.

   Props:
     as       - motion tag to render ('div' default, e.g. 'section')
     variants - variant override (default: fadeUp)
     delay    - extra delay (seconds) before the reveal
     amount   - viewport amount threshold (default from VIEWPORT)
   Under prefers-reduced-motion the content renders immediately, no transform. */
export function Reveal({
  as = 'div',
  variants = fadeUp,
  delay = 0,
  amount,
  style,
  children,
  ...rest
}) {
  const reduce = useReducedMotion();
  const scrollRef = useScrollContainer();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag style={style} {...rest}>{children}</Tag>;
  }

  // Merge delay into the visible variant so it isn't lost to the variant's
  // own transition (variant transitions take precedence over the prop).
  const v = delay
    ? { ...variants, visible: { ...variants.visible, transition: { ...variants.visible?.transition, delay } } }
    : variants;

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ ...VIEWPORT, amount: amount ?? VIEWPORT.amount, root: scrollRef }}
      variants={v}
      style={style}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
