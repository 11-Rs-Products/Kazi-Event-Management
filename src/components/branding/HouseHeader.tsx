'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from '../ui/Motion';

interface HouseHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small tracked-out label above the title. */
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  /** Statistics or meta rendered along the bottom edge. */
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * The dark editorial masthead that opens a page: an aurora-lit stage with
 * film grain, a specular top edge and a gold baseline rule.
 */
export const HouseHeader: React.FC<HouseHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  footer,
  size = 'md',
  className,
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? undefined : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
      className={cn(
        'relative isolate overflow-hidden rounded-3xl',
        'ed-hero-masthead ed-mesh ed-grain ed-edge-light',
        size === 'lg' ? 'px-6 py-11 sm:px-12 sm:py-16' : 'px-6 py-9 sm:px-10 sm:py-12',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-5 max-w-3xl min-w-0">
          {badge && (
            <div className="inline-flex items-center gap-2.5 text-eyebrow uppercase font-display text-accent dark:text-[rgb(var(--accent-vivid))] font-semibold">
              <span
                className="w-7 h-px bg-gradient-to-r from-accent dark:from-[rgb(var(--accent-vivid))] to-transparent"
                aria-hidden
              />
              {badge}
            </div>
          )}

          <h1
            className={cn(
              'font-display font-black tracking-tight text-ink dark:text-white',
              'dark:[text-shadow:0_2px_24px_rgba(0,0,0,0.45)]',
              size === 'lg' ? 'text-display-lg' : 'text-display-md'
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-body text-ink-muted dark:text-white/70 leading-relaxed max-w-xl">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>

      {footer && (
        <div className="mt-9 pt-7 border-t border-hairline dark:border-white/[0.12]">{footer}</div>
      )}

      {/* Gold baseline rule. */}
      <span
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 dark:via-[rgb(var(--accent-vivid))]/50 to-transparent"
        aria-hidden
      />
    </motion.header>
  );
};

/**
 * The divided statistic row used along the bottom of a masthead. Values sit
 * above labels so the numerals stay on one baseline when a label wraps.
 */
export const HeaderStats: React.FC<{
  items: { label: string; value: React.ReactNode }[];
}> = ({ items }) => (
  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6">
    {items.map((item, i) => (
      <div
        key={item.label}
        className={cn(
          'flex flex-col gap-2 px-0 sm:px-6 first:sm:pl-0 last:sm:pr-0',
          // Hairline dividers between columns, never before the first in a row.
          i > 0 && 'sm:border-l sm:border-hairline dark:sm:border-white/[0.12]',
          i % 2 === 1 && 'border-l border-hairline dark:border-white/[0.12] pl-5 sm:pl-6'
        )}
      >
        <dd className="text-display-sm font-display font-black text-ink dark:text-white nums leading-none">
          {item.value}
        </dd>
        <dt className="text-eyebrow uppercase font-display text-ink-faint dark:text-white/45">{item.label}</dt>
      </div>
    ))}
  </dl>
);
