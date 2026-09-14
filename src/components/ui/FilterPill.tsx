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
        'shrink-0 rounded-full border-2 border-black dark:border-white font-display font-bold transition-all duration-100',
        'whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer select-none',
        'active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none',
        'focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSm ? 'px-3 h-8 text-micro' : 'px-4 h-9 text-caption',
        active
          ? 'bg-[#FFE873] text-black shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]'
          : 'bg-white dark:bg-[#232328] text-ink shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212]',
        className
      )}
    >
      {icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full font-mono text-[0.625rem] leading-tight font-black transition-colors border border-black',
            active
              ? 'bg-black text-white'
              : 'bg-[#5EEAD4] text-black'
          )}
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  );
};
