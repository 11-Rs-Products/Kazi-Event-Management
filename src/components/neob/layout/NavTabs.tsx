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
        bg-surface/95 backdrop-blur-md border-b-2 border-black dark:border-white"
    >
      <div
        ref={listRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
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
                'relative shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded-xl',
                'text-caption font-display whitespace-nowrap',
                'border-2 transition-all duration-100',
                isActive
                  ? 'bg-[#FFE873] text-black font-extrabold border-black dark:border-white shadow-[2.5px_2.5px_0px_#121212] dark:shadow-[2.5px_2.5px_0px_#FFFFFF]'
                  : 'bg-surface-raised dark:bg-surface-sunken text-ink font-bold border-transparent hover:border-black dark:hover:border-white shadow-none hover:shadow-[2px_2px_0px_#121212] dark:hover:shadow-[2px_2px_0px_#FFFFFF]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0 stroke-[2.5]', isActive ? 'text-black' : 'text-ink-muted')} aria-hidden />
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'ml-1 px-2 py-0.5 rounded-full text-[0.625rem] font-black nums border border-black',
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-white dark:bg-[#18181B] text-ink'
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
