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
  default: 'text-ink-muted bg-surface-sunken',
  brand: 'text-brand bg-brand-soft',
  accent: 'text-accent bg-accent-soft',
  live: 'text-signal-live bg-signal-live/10',
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
      'bg-surface-raised border border-hairline shadow-e-1',
      'bg-gradient-to-b from-white/[0.5] to-transparent dark:from-white/[0.03]',
      'transition-[border-color,box-shadow,transform] duration-300 ease-editorial',
      'hover:border-hairline-strong hover:shadow-e-2 hover:-translate-y-0.5',
      className
    )}
  >
    {/* A faint tonal wash bleeding in from the icon corner. */}
    <span
      className={cn(
        'absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-60 pointer-events-none',
        tone === 'brand' && 'bg-brand/15',
        tone === 'accent' && 'bg-[rgb(var(--accent-vivid))]/15',
        tone === 'live' && 'bg-signal-live/15',
        tone === 'default' && 'bg-ink/[0.06]'
      )}
      aria-hidden
    />

    {icon && (
      <span
        className={cn(
          'relative flex items-center justify-center w-11 h-11 rounded-xl shrink-0',
          'ring-1 ring-inset ring-current/10',
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
      <div className="text-caption font-semibold text-ink-muted">{label}</div>
      {meta && <div className="text-micro text-ink-faint pt-0.5">{meta}</div>}
    </div>
  </div>
);
