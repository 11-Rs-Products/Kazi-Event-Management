import React from 'react';
import { cn } from '@/lib/utils/cn';

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** Secondary line under the value — a delta, a deadline, a total. */
  meta?: React.ReactNode;
  tone?: 'default' | 'brand' | 'accent' | 'live';
  className?: string;
}

const toneRing: Record<NonNullable<StatProps['tone']>, string> = {
  default: 'text-black bg-white dark:bg-[#232328] dark:text-white',
  brand: 'text-black bg-[#5EEAD4]',
  accent: 'text-black bg-[#FFE873]',
  live: 'text-black bg-[#86EFAC]',
};

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  icon,
  meta,
  tone = 'default',
  className,
}) => (
  <div
    className={cn(
      'group relative flex items-start gap-4 p-5 rounded-2xl overflow-hidden',
      'bg-surface-raised border-2 border-black dark:border-white shadow-[3px_3px_0px_#121212] dark:shadow-[3px_3px_0px_#FFFFFF]',
      'transition-all duration-150 ease-out',
      'hover:shadow-[5px_5px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 dark:hover:shadow-[5px_5px_0px_#FFE873]',
      className
    )}
  >
    {icon && (
      <span
        className={cn(
          'relative flex items-center justify-center w-11 h-11 rounded-xl shrink-0',
          'border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]',
          '[&>svg]:w-5 [&>svg]:h-5',
          toneRing[tone]
        )}
        aria-hidden
      >
        {icon}
      </span>
    )}
    <div className="relative min-w-0 space-y-0.5">
      <div className="text-display-sm font-display font-black text-ink nums leading-none">
        {value}
      </div>
      <div className="text-caption font-bold text-ink-muted">{label}</div>
      {meta && <div className="text-micro font-medium text-ink-faint pt-0.5">{meta}</div>}
    </div>
  </div>
);
