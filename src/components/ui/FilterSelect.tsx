'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FilterSelectOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  icon?: React.ReactNode;
  placeholder?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  icon,
  placeholder,
  ariaLabel,
  size = 'md',
  disabled = false,
  className,
  containerClassName,
}) => {
  const isSm = size === 'sm';
  const isDefault =
    !value ||
    value.toUpperCase() === 'ALL' ||
    value.toLowerCase() === 'default' ||
    value.toLowerCase() === 'any';

  return (
    <div
      className={cn(
        'relative inline-flex items-center min-w-0 transition-all rounded-xl border',
        'bg-surface-raised dark:bg-surface-sunken text-ink',
        isDefault
          ? 'border-hairline hover:border-hairline-strong'
          : 'border-accent/40 dark:border-accent/40 bg-accent/[0.04] dark:bg-accent/[0.04]',
        disabled && 'opacity-50 cursor-not-allowed',
        containerClassName
      )}
    >
      {icon && (
        <span
          className={cn(
            'pointer-events-none shrink-0 transition-colors',
            isSm ? 'pl-2.5 [&>svg]:w-3.5 [&>svg]:h-3.5' : 'pl-3 [&>svg]:w-4 [&>svg]:h-4',
            isDefault ? 'text-ink-faint' : 'text-accent'
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'w-full bg-transparent appearance-none cursor-pointer border-none outline-none font-semibold transition-colors',
          'focus:outline-none focus:ring-0',
          isSm ? 'h-9 text-caption pr-7' : 'h-10 text-caption sm:text-sm pr-8',
          icon ? (isSm ? 'pl-2' : 'pl-2.5') : (isSm ? 'pl-3' : 'pl-3.5'),
          isDefault ? 'text-ink-muted' : 'text-ink font-bold',
          className
        )}
      >
        {placeholder && <option value="" className="bg-surface-raised dark:bg-stage-900 text-ink">{placeholder}</option>}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-surface-raised dark:bg-stage-900 text-ink"
          >
            {opt.label}
            {typeof opt.count === 'number' ? ` (${opt.count})` : ''}
          </option>
        ))}
      </select>

      <ChevronDown
        className={cn(
          'absolute pointer-events-none text-ink-faint shrink-0',
          isSm ? 'right-2 w-3.5 h-3.5' : 'right-2.5 w-4 h-4'
        )}
        aria-hidden="true"
      />
    </div>
  );
};
