import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants } from './variants';

/* Wraps a routed page for enter/exit transitions. Use inside <AnimatePresence>
   with a stable `key` per route. */
export function PageTransition({ children, style, ...rest }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div style={style} {...rest}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
