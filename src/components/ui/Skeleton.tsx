import React from 'react';
import { cn } from '@/lib/utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'rounded-lg bg-surface-sunken relative overflow-hidden',
      'after:absolute after:inset-0 after:animate-shimmer',
      'after:bg-gradient-to-r after:from-transparent after:via-hairline-strong/40 after:to-transparent',
      'after:bg-[length:200%_100%]',
      className
    )}
    aria-hidden
  />
);

export const EventCardSkeleton: React.FC = () => (
  <div className="rounded-2xl bg-surface-raised border border-hairline overflow-hidden shadow-e-1">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-4 mt-1 border-t border-hairline flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  </div>
);

export const RowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-hairline bg-surface-raised">
    <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
  </div>
);
