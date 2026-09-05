'use client';

import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  size?: 'sm' | 'md';
  containerClassName?: string;
  shortcut?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      size = 'md',
      placeholder = 'Search…',
      className,
      containerClassName,
      shortcut,
      disabled,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;

    const handleClear = () => {
      onChange('');
      if (onClear) onClear();
      resolvedRef.current?.focus();
    };

    const isSm = size === 'sm';

    return (
      <div className={cn('relative flex items-center min-w-0', containerClassName)}>
        <Search
          className={cn(
            'absolute pointer-events-none text-ink-faint transition-colors',
            isSm ? 'left-3 w-3.5 h-3.5' : 'left-3.5 w-4 h-4'
          )}
          aria-hidden="true"
        />

        <input
          ref={resolvedRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border border-hairline bg-surface-raised dark:bg-surface-sunken text-ink placeholder:text-ink-faint',
            'transition-[border-color,box-shadow,background-color] duration-200',
            'focus:outline-none focus:border-brand dark:focus:border-accent',
            'focus:ring-2 focus:ring-brand/10 dark:focus:ring-accent/15',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
            isSm ? 'h-9 pl-9 pr-8 text-caption' : 'h-10 pl-10 pr-9 text-caption sm:text-sm',
            shortcut && !value && (isSm ? 'pr-9' : 'pr-11'),
            className
          )}
          {...props}
        />

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className={cn(
              'absolute rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken dark:hover:bg-white/10 transition-colors',
              isSm ? 'right-2 p-1' : 'right-2.5 p-1'
            )}
          >
            <X className={cn(isSm ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          </button>
        ) : shortcut ? (
          <kbd
            className={cn(
              'absolute text-micro font-mono text-ink-faint bg-surface-sunken dark:bg-white/5 border border-hairline rounded px-1.5 py-0.5 pointer-events-none select-none',
              isSm ? 'right-2 text-[0.65rem]' : 'right-2.5 text-[0.7rem]'
            )}
            aria-hidden="true"
          >
            {shortcut}
          </kbd>
        ) : null}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
