/* Shared Framer Motion variants & timing for NamRoller.
   Animate only opacity/transform (GPU-friendly). */

export const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: EASE } },
};

/* Container that cascades its children. Pair with `staggerItem`. */
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerItem = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/* Page enter/exit for route transitions. */
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.22, ease: EASE } },
};

/* Default viewport options for scroll reveals (root is supplied per-use). */
export const VIEWPORT = { once: true, amount: 0.25 };
