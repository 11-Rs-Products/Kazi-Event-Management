'use client';

import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FieldShellProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error, with the wiring done once. */
export const Field: React.FC<FieldShellProps> = ({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="block text-caption font-semibold text-ink-muted"
      >
        {label}
        {required && <span className="text-signal-danger ml-1">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="flex items-start gap-1.5 text-micro text-signal-danger">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
        <span>{error}</span>
      </p>
    ) : (
      hint && <p className="text-micro text-ink-faint">{hint}</p>
    )}
  </div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, className, containerClassName, id, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={inputId}
        className={containerClassName}
      >
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none [&>svg]:w-4 [&>svg]:h-4">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn(
              'ed-field',
              leftIcon && 'pl-10',
              error && 'border-signal-danger focus:border-signal-danger focus:ring-signal-danger/15',
              className
            )}
            {...props}
          />
        </div>
      </Field>
    );
  }
);
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  containerClassName?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, containerClassName, id, required, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const areaId = id ?? autoId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={areaId}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            'ed-field resize-y',
            error && 'border-signal-danger focus:border-signal-danger focus:ring-signal-danger/15',
            className
          )}
          {...props}
        />
      </Field>
    );
  }
);
Textarea.displayName = 'Textarea';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  containerClassName?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, containerClassName, id, required, children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={selectId}
        className={containerClassName}
      >
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            'ed-select',
            error && 'border-signal-danger focus:border-signal-danger focus:ring-signal-danger/15',
            className
          )}
          {...props}
        >
          {children}
        </select>
      </Field>
    );
  }
);
Select.displayName = 'Select';
