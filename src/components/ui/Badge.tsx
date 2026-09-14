import React from 'react';
import { cn } from '@/lib/utils/cn';

type Tone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'live'
  | 'warn'
  | 'danger'
  | 'info'
  | 'inverse';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'sm' | 'md';
  /** Solid fills read louder — use for a single primary status per surface. */
  solid?: boolean;
  /** Adds a pulsing dot. For genuinely live states only. */
  pulse?: boolean;
}

const soft: Record<Tone, string> = {
  neutral: 'bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:bg-white dark:border-white',
  brand: 'bg-[#5EEAD4] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:border-white',
  accent: 'bg-[#FFE873] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:border-white',
  live: 'bg-[#86EFAC] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:border-white',
  warn: 'bg-[#FDBA74] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:border-white',
  danger: 'bg-[#FFA0A0] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:border-white',
  info: 'bg-[#C4B5FD] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] dark:border-white',
  inverse: 'bg-[#121212] text-white border-2 border-black shadow-[1.5px_1.5px_0px_#FFE873] dark:border-white',
};

const filled: Record<Tone, string> = {
  neutral: 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:bg-white dark:border-white',
  brand: 'bg-[#5EEAD4] text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white',
  accent: 'bg-[#FFE873] text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white',
  live: 'bg-[#86EFAC] text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white',
  warn: 'bg-[#FDBA74] text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white',
  danger: 'bg-[#FF708F] text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white',
  info: 'bg-[#C4B5FD] text-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white',
  inverse: 'bg-[#121212] text-white border-2 border-black shadow-[2px_2px_0px_#FFE873] dark:border-white',
};

const dotTone: Record<Tone, string> = {
  neutral: 'bg-black',
  brand: 'bg-teal-900',
  accent: 'bg-amber-900',
  live: 'bg-green-900',
  warn: 'bg-orange-900',
  danger: 'bg-red-900',
  info: 'bg-purple-900',
  inverse: 'bg-white',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  size = 'md',
  solid = false,
  pulse = false,
  className,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-display font-black',
      'uppercase tracking-wider whitespace-nowrap select-none',
      size === 'sm' ? 'px-2.5 py-0.5 text-[0.625rem]' : 'px-3 py-1 text-[0.6875rem]',
      solid ? filled[tone] : soft[tone],
      className
    )}
    {...props}
  >
    {pulse && (
      <span className="relative flex w-1.5 h-1.5 shrink-0" aria-hidden>
        <span
          className={cn('absolute inset-0 rounded-full animate-live-ping', dotTone[tone])}
        />
        <span className={cn('relative w-1.5 h-1.5 rounded-full', dotTone[tone])} />
      </span>
    )}
    {children}
  </span>
);
