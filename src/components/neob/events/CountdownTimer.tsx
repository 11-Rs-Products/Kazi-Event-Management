'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
}

function getTimeLeft(target: number): TimeLeft | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

interface CountdownTimerProps {
  targetDate: string | Date | null | undefined;
  /**
   * `chip` is a compact position-neutral pill for placing over imagery;
   * `inline` is the full row of editorial numerals.
   */
  variant?: 'chip' | 'inline';
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  variant = 'chip',
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (Number.isNaN(target)) return;

    setTimeLeft(getTimeLeft(target));
    const timer = setInterval(() => {
      const remaining = getTimeLeft(target);
      setTimeLeft(remaining);
      if (!remaining) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const units = [
    { value: timeLeft.d, label: 'days', short: 'd' },
    { value: timeLeft.h, label: 'hrs', short: 'h' },
    { value: timeLeft.m, label: 'min', short: 'm' },
    { value: timeLeft.s, label: 'sec', short: 's' },
  ].filter((u, i) => i > 0 || u.value > 0);

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-stretch gap-2', className)}>
        {units.map((unit) => (
          <div
            key={unit.label}
            className="flex-1 min-w-0 rounded-xl bg-surface-raised dark:bg-surface-sunken border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_#121212] dark:shadow-[2.5px_2.5px_0px_#FFFFFF] px-3 py-2.5 text-center"
          >
            <div className="text-title font-display font-black text-ink nums leading-none">
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-[0.625rem] uppercase tracking-wider font-display font-black text-ink-muted mt-1.5">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full pointer-events-none',
        'bg-[#FFE873] text-black border-2 border-black shadow-[2px_2px_0px_#121212]',
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-black animate-pulse" aria-hidden />
      <span className="text-micro font-display font-black text-black nums tracking-wide">
        {units.map((u) => `${String(u.value).padStart(2, '0')}${u.short}`).join(' ')}
      </span>
    </div>
  );
};
