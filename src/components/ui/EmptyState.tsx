import React from 'react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-dashed border-hairline-strong',
      'flex flex-col items-center justify-center text-center',
      size === 'sm' ? 'px-6 py-10 gap-3' : 'px-6 py-16 gap-4',
      className
    )}
  >
    <div className="absolute inset-0 ed-hatch opacity-[0.35] pointer-events-none" aria-hidden />
    <div className="relative flex flex-col items-center gap-4 max-w-sm">
      {icon && (
        <span
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-sunken text-ink-faint [&>svg]:w-6 [&>svg]:h-6"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <div className="space-y-1.5">
        <h3 className="font-display font-bold text-title-sm text-ink">{title}</h3>
        {description && (
          <p className="text-caption text-ink-muted leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  </div>
);
