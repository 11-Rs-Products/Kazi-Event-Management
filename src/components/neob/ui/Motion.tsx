'use client';

import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

/**
 * Shared easing. Matches `ease-editorial` in the Tailwind config so CSS
 * transitions and Framer animations feel like one system.
 */
export const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts a block into place. */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** Animate when scrolled into view rather than on mount. */
  onScroll?: boolean;
}> = ({ children, delay = 0, y = 16, className, onScroll = false }) => {
  const reduce = useReducedMotion();

  const motionProps = reduce
    ? {}
    : onScroll
      ? {
          initial: { opacity: 0, y },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-80px' },
        }
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
        };

  return (
    <motion.div
      className={className}
      transition={{ duration: 0.55, delay, ease: EASE_EDITORIAL }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_EDITORIAL } },
};

/** Wrap a grid or list; each `<StaggerItem>` child enters in sequence. */
export const Stagger: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
};

/** Page-level entrance used by the app shell. */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_EDITORIAL }}
    >
      {children}
    </motion.div>
  );
};
