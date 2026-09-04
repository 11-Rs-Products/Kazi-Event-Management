'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { isValidUrl, normalizeUrl } from '@/lib/utils/urlValidation';

export interface UrlInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * A dedicated URL input that:
 * 1. Suppresses error display while the user is actively typing or focused.
 * 2. Validates on blur when the user moves away to other fields; displays error if non-empty and invalid.
 * 3. Immediately clears the error as soon as the user returns (focuses) to correct the field.
 * 4. Automatically normalizes valid URLs by prepending https:// if omitted.
 */
export const UrlInput = React.forwardRef<HTMLInputElement, UrlInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'https://...',
      errorMessage = 'Please enter a valid web link (e.g. https://...)',
      className,
      containerClassName,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [hasError, setHasError] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Immediately remove error when user returns to update
      setHasError(false);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const trimmed = value?.trim() || '';
      if (trimmed) {
        if (isValidUrl(trimmed)) {
          setHasError(false);
          onChange(normalizeUrl(trimmed));
        } else {
          // User moved to other fields with an invalid link
          setHasError(true);
        }
      } else {
        setHasError(false);
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Suppress error while typing
      if (hasError) {
        setHasError(false);
      }
      onChange(e.target.value);
    };

    return (
      <div className={cn('space-y-1 w-full', containerClassName)}>
        <input
          ref={ref}
          type="url"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-invalid={hasError ? true : undefined}
          className={cn(
            'ed-field',
            hasError && 'border-signal-danger focus:border-signal-danger',
            className
          )}
          {...props}
        />
        {hasError && (
          <p className="text-micro text-signal-danger flex items-center gap-1 animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    );
  }
);

UrlInput.displayName = 'UrlInput';
