'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface NavTab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional count rendered as a trailing pill. */
  count?: number;
}

interface NavTabsProps {
  tabs: NavTab[];
  /** Gold treatment for the super-admin suite. */
  accent?: boolean;
  /** Distinguishes the shared `layoutId` when two tab bars coexist. */
  id?: string;
}

/**
 * Sticky, horizontally scrollable section tabs. The active pill is a shared
 * layout element, so switching tabs slides it rather than cutting.
 */
export const NavTabs: React.FC<NavTabsProps> = ({ tabs, accent = false, id = 'nav' }) => {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the active tab in view when the bar overflows on narrow screens.
  useEffect(() => {
    const active = listRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [pathname]);

  return (
    <div
      className="sticky top-[var(--navbar-height)] z-30
        -mt-6 sm:-mt-8 lg:-mt-10 mb-6
        -mx-[var(--gutter)] px-[var(--gutter)] py-3
        bg-surface/85 backdrop-blur-xl border-b border-hairline"
    >
      <div
        ref={listRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        role="tablist"
        aria-label="Section"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative shrink-0 inline-flex items-center gap-2 px-3.5 h-10 rounded-xl',
                'text-caption font-display font-semibold whitespace-nowrap',
                'transition-colors duration-200',
                isActive
                  ? accent
                    ? 'text-accent-contrast'
                    : 'text-brand-contrast dark:text-[rgb(var(--brand))]'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-sunken dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={reduce ? undefined : `${id}-tab-pill`}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className={cn(
                    'absolute inset-0 rounded-xl -z-10 shadow-sm',
                    accent
                      ? 'bg-[rgb(var(--accent-vivid))]'
                      : 'bg-brand dark:bg-brand/20 dark:border dark:border-brand/40 dark:shadow-[0_0_16px_rgba(45,212,191,0.2)]'
                  )}
                />
              )}
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'ml-0.5 px-1.5 py-0.5 rounded-md text-[0.625rem] font-bold nums',
                    isActive
                      ? 'bg-black/15'
                      : 'bg-surface-sunken text-ink-faint'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
