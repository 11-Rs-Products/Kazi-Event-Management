import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-kaziranga-800 hover:bg-kaziranga-700 text-white shadow-md shadow-kaziranga-900/20 focus:ring-kaziranga-600 dark:bg-kaziranga-700 dark:hover:bg-kaziranga-600',
      secondary:
        'bg-kaziranga-100 text-kaziranga-900 hover:bg-kaziranga-200 dark:bg-kaziranga-900/60 dark:text-kaziranga-100 dark:hover:bg-kaziranga-800/80 focus:ring-kaziranga-500',
      outline:
        'border border-kaziranga-300 dark:border-kaziranga-700 text-kaziranga-800 dark:text-kaziranga-200 hover:bg-kaziranga-50 dark:hover:bg-kaziranga-900/50 focus:ring-kaziranga-500',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/20 focus:ring-rose-500',
      ghost:
        'text-kaziranga-700 dark:text-kaziranga-200 hover:bg-kaziranga-100/60 dark:hover:bg-kaziranga-900/40 focus:ring-kaziranga-500',
      gold:
        'bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 text-kaziranga-950 font-bold hover:brightness-110 shadow-md shadow-gold-500/20 focus:ring-gold-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
