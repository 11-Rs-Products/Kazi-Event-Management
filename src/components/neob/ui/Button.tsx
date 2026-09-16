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
  // Neo-Brutalist buttons with bold black borders, hard shadows, and physical tactile click
  primary:
    'bg-[#FFA0A0] text-black font-bold border-2 border-black ' +
    'shadow-[3px_3px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] ' +
    'dark:border-white dark:text-black dark:bg-[#FFA0A0] dark:shadow-[3px_3px_0px_#FFFFFF] dark:hover:shadow-[4px_4px_0px_#FFFFFF]',
  accent:
    'bg-[#FFE873] text-black font-bold border-2 border-black ' +
    'shadow-[3px_3px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] ' +
    'dark:border-white dark:text-black dark:bg-[#FFE873] dark:shadow-[3px_3px_0px_#FFFFFF] dark:hover:shadow-[4px_4px_0px_#FFFFFF]',
  secondary:
    'bg-[#C4B5FD] text-black font-bold border-2 border-black ' +
    'shadow-[3px_3px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] ' +
    'dark:border-white dark:text-black dark:bg-[#C4B5FD] dark:shadow-[3px_3px_0px_#FFFFFF] dark:hover:shadow-[4px_4px_0px_#FFFFFF]',
  outline:
    'bg-white dark:bg-[#1C1C20] text-ink font-bold border-2 border-black dark:border-white ' +
    'shadow-[3px_3px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] ' +
    'dark:shadow-[3px_3px_0px_#FFFFFF] dark:hover:shadow-[4px_4px_0px_#FFFFFF]',
  ghost:
    'bg-transparent text-ink font-bold hover:bg-black/5 dark:hover:bg-white/10 ' +
    'active:translate-y-0 border-0 shadow-none',
  danger:
    'bg-[#FF708F] text-black font-bold border-2 border-black ' +
    'shadow-[3px_3px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] ' +
    'dark:border-white dark:text-black dark:bg-[#FF708F] dark:shadow-[3px_3px_0px_#FFFFFF] dark:hover:shadow-[4px_4px_0px_#FFFFFF]',
  link:
    'text-ink font-bold underline-offset-4 hover:underline p-0 h-auto shadow-none border-0',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-caption gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-caption gap-2 rounded-xl',
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
        'relative inline-flex items-center justify-center font-display select-none cursor-pointer',
        'whitespace-nowrap transition-all duration-100 ease-out',
        variant !== 'link' && variant !== 'ghost' && 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0',
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
