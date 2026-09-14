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
      transition={{ duration: 0.35 }}
      className={cn(
        'relative isolate overflow-hidden rounded-3xl',
        'border-2 sm:border-[2.5px] border-black dark:border-white shadow-[6px_6px_0px_#121212] dark:shadow-[6px_6px_0px_#FFE873] bg-surface-raised',
        size === 'lg' ? 'px-6 py-10 sm:px-10 sm:py-14' : 'px-6 py-8 sm:px-9 sm:py-10',
        className
      )}
    >
      {/* Playful Scrapbook Decorative Star in corner */}
      <div className="absolute top-4 right-5 sm:top-6 sm:right-7 select-none pointer-events-none" aria-hidden="true">
        <span className="text-2xl sm:text-3xl text-[#FFE873] drop-shadow-[2px_2px_0px_#121212]">✦</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4 max-w-3xl min-w-0">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] bg-[#FFE873] text-black text-eyebrow uppercase font-display font-black">
              {badge}
            </div>
          )}

          <h1
            className={cn(
              'font-display font-black tracking-tight text-ink dark:text-white',
              size === 'lg' ? 'text-display-lg' : 'text-display-md'
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-body font-medium text-ink-muted leading-relaxed max-w-xl">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>

      {footer && (
        <div className="mt-8 pt-6 border-t-2 border-black dark:border-white">{footer}</div>
      )}
    </motion.header>
  );
};

/**
 * The divided statistic row used along the bottom of a masthead.
 */
export const HeaderStats: React.FC<{
  items: { label: string; value: React.ReactNode }[];
}> = ({ items }) => (
  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6">
    {items.map((item, i) => (
      <div
        key={item.label}
        className={cn(
          'flex flex-col gap-1.5 px-0 sm:px-6 first:sm:pl-0 last:sm:pr-0',
          i > 0 && 'sm:border-l-2 sm:border-black dark:sm:border-white',
          i % 2 === 1 && 'border-l-2 border-black dark:border-white pl-5 sm:pl-6'
        )}
      >
        <dd className="text-display-sm font-display font-black text-ink nums leading-none">
          {item.value}
        </dd>
        <dt className="text-eyebrow uppercase font-display font-bold text-ink-muted">{item.label}</dt>
      </div>
    ))}
  </dl>
);
