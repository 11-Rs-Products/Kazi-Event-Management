import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  // Filled variants carry a subtle top-light gradient and bloom on hover so
  // they read as lit objects rather than flat swatches.
  primary:
    'text-brand-contrast bg-brand bg-gradient-to-b from-white/15 to-transparent ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_2px_6px_rgba(12,26,22,0.18),0_8px_20px_-8px_rgb(var(--brand)/0.55)] ' +
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_4px_10px_rgba(12,26,22,0.2),0_14px_30px_-10px_rgb(var(--brand)/0.7)] ' +
    'hover:-translate-y-px',
  accent:
    'text-accent-contrast font-bold bg-[rgb(var(--accent-vivid))] bg-gradient-to-b from-white/25 to-transparent ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_2px_6px_rgba(12,26,22,0.16),0_8px_22px_-8px_rgb(var(--accent-vivid)/0.6)] ' +
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_4px_12px_rgba(12,26,22,0.18),0_16px_34px_-10px_rgb(var(--accent-vivid)/0.75)] ' +
    'hover:-translate-y-px',
  secondary:
    'bg-surface-raised text-ink border border-hairline-strong shadow-e-1 ' +
    'hover:border-ink-faint hover:shadow-e-2 hover:-translate-y-px',
  outline:
    'border border-hairline-strong text-ink bg-transparent ' +
    'hover:bg-surface-raised hover:border-ink-faint hover:shadow-e-1',
  ghost:
    'text-ink-muted bg-transparent hover:bg-surface-sunken hover:text-ink',
  danger:
    'text-white bg-signal-danger bg-gradient-to-b from-white/15 to-transparent ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_2px_6px_rgba(12,26,22,0.18),0_8px_20px_-8px_rgb(var(--signal-danger)/0.55)] ' +
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.24)_inset,0_4px_12px_rgba(12,26,22,0.2),0_14px_30px_-10px_rgb(var(--signal-danger)/0.7)] ' +
    'hover:-translate-y-px',
  link:
    'text-accent bg-transparent underline-offset-4 hover:underline p-0 h-auto shadow-none',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-caption gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-caption gap-2 rounded-xl',
  lg: 'h-12 px-6 text-body gap-2.5 rounded-xl',
  xl: 'h-14 px-8 text-body-lg gap-3 rounded-2xl',
  icon: 'h-10 w-10 p-0 gap-0 rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold font-display',
        'whitespace-nowrap select-none',
        'transition-all duration-200 ease-editorial',
        'active:scale-[0.98] active:translate-y-0',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant !== 'link' && sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
      ) : (
        leftIcon
      )}
      {children != null && children !== false && <span>{children}</span>}
      {!isLoading && rightIcon}
    </button>
  )
);

Button.displayName = 'Button';
