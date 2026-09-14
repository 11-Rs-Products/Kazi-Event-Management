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
  debounceMs?: number;
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
      debounceMs = 150,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const handleChange = (newVal: string) => {
      setLocalValue(newVal);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (debounceMs <= 0) {
        onChange(newVal);
      } else {
        timeoutRef.current = setTimeout(() => {
          onChange(newVal);
        }, debounceMs);
      }
    };

    const handleClear = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLocalValue('');
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
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border-2 border-black dark:border-white bg-white dark:bg-[#232328] text-ink placeholder:text-ink-faint font-medium',
            'shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]',
            'transition-all duration-150',
            'focus:outline-none focus:shadow-[4px_4px_0px_#121212] dark:focus:shadow-[4px_4px_0px_#FFE873] focus:-translate-x-0.5 focus:-translate-y-0.5',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
            isSm ? 'h-9 pl-9 pr-8 text-caption' : 'h-10 pl-10 pr-9 text-caption sm:text-sm',
            shortcut && !localValue && (isSm ? 'pr-9' : 'pr-11'),
            className
          )}
          {...props}
        />

        {localValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className={cn(
              'absolute rounded-lg text-ink hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
              isSm ? 'right-2 p-1' : 'right-2.5 p-1'
            )}
          >
            <X className={cn(isSm ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          </button>
        ) : shortcut ? (
          <kbd
            className={cn(
              'absolute text-micro font-mono font-bold text-black bg-[#FFE873] border border-black rounded px-1.5 py-0.5 pointer-events-none select-none shadow-[1px_1px_0px_#121212]',
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
