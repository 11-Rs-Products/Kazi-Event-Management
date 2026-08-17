import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-cream-400/40 dark:bg-kaziranga-800/60 ${className}`}
    />
  );
};

export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-arena-surface dark:bg-kaziranga-900/80 border border-cream-400/20 dark:border-kaziranga-800/50 p-5 space-y-4 shadow-arena">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-3 border-t border-cream-400/20 dark:border-kaziranga-800/50 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};
