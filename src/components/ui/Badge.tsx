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
  neutral: 'bg-surface-sunken text-ink-muted border-hairline-strong',
  brand: 'bg-brand-soft text-brand border-brand/25',
  accent: 'bg-accent-soft text-accent border-accent/30',
  live: 'bg-signal-live/10 text-signal-live border-signal-live/25',
  warn: 'bg-signal-warn/10 text-signal-warn border-signal-warn/25',
  danger: 'bg-signal-danger/10 text-signal-danger border-signal-danger/25',
  info: 'bg-signal-info/10 text-signal-info border-signal-info/25',
  inverse: 'bg-ink/85 text-ink-invert border-transparent backdrop-blur-md',
};

const filled: Record<Tone, string> = {
  neutral: 'bg-ink-faint text-ink-invert border-transparent',
  brand: 'bg-brand text-brand-contrast border-transparent',
  accent: 'bg-[rgb(var(--accent-vivid))] text-accent-contrast border-transparent',
  live: 'bg-signal-live text-white border-transparent',
  warn: 'bg-signal-warn text-white border-transparent',
  danger: 'bg-signal-danger text-white border-transparent',
  info: 'bg-signal-info text-white border-transparent',
  inverse: 'bg-ink text-ink-invert border-transparent',
};

const dotTone: Record<Tone, string> = {
  neutral: 'bg-ink-faint',
  brand: 'bg-brand',
  accent: 'bg-[rgb(var(--accent-vivid))]',
  live: 'bg-signal-live',
  warn: 'bg-signal-warn',
  danger: 'bg-signal-danger',
  info: 'bg-signal-info',
  inverse: 'bg-ink-invert',
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
      'inline-flex items-center gap-1.5 rounded-full border font-display font-bold',
      'uppercase tracking-wider whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-[0.625rem]' : 'px-2.5 py-1 text-[0.6875rem]',
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
