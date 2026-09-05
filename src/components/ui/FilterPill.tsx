'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  active,
  onClick,
  children,
  count,
  size = 'md',
  disabled = false,
  className,
  icon,
}) => {
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border font-display font-semibold transition-all duration-200',
        'whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer select-none',
        'focus:outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-accent/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSm ? 'px-3 h-8 text-micro' : 'px-3.5 h-9 text-caption',
        active
          ? 'bg-brand text-brand-contrast border-brand shadow-sm dark:bg-brand/25 dark:text-brand dark:border-brand/60 dark:shadow-[0_0_12px_rgba(45,212,191,0.18)]'
          : 'bg-surface-raised dark:bg-surface-sunken text-ink-muted border-hairline hover:border-hairline-strong hover:text-ink dark:hover:text-white dark:hover:bg-white/5',
        className
      )}
    >
      {icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'px-1.5 py-0.2 rounded-full font-mono text-[0.625rem] leading-tight font-bold transition-colors',
            active
              ? 'bg-white/20 text-white dark:bg-brand/35 dark:text-brand'
              : 'bg-surface-sunken dark:bg-white/10 text-ink-faint dark:text-white/60'
          )}
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  );
};
