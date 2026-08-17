import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'gold' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate' | 'kaziranga' | 'rhino';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className = '',
}) => {
  const variantClasses = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    gold: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-gold-400 border-amber-200 dark:border-gold-600/40 font-bold',
    blue: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    kaziranga: 'bg-kaziranga-800 text-cream-300 dark:bg-kaziranga-700 dark:text-cream-200 border-kaziranga-700 dark:border-kaziranga-600 font-bold',
    rhino: 'bg-rhino-red/10 text-rhino-red dark:bg-rhino-red/20 dark:text-rhino-red-light border-rhino-red/30 dark:border-rhino-red/40 font-bold',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};
