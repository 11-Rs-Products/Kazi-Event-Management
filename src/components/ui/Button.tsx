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
      'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]';

    const variants = {
      primary:
        'bg-kaziranga-800 hover:bg-kaziranga-700 text-cream-100 shadow-md shadow-kaziranga-900/20 focus:ring-kaziranga-600 dark:bg-kaziranga-700 dark:hover:bg-kaziranga-600',
      secondary:
        'bg-cream-300 text-kaziranga-800 hover:bg-cream-400 dark:bg-kaziranga-900/60 dark:text-cream-200 dark:hover:bg-kaziranga-800/80 focus:ring-kaziranga-500 font-bold',
      outline:
        'border-2 border-kaziranga-800/30 dark:border-kaziranga-600/50 text-kaziranga-800 dark:text-cream-200 hover:bg-kaziranga-800/5 dark:hover:bg-kaziranga-800/30 focus:ring-kaziranga-500',
      danger:
        'bg-rhino-red hover:bg-rhino-red-dark text-white shadow-md shadow-rhino-red/20 focus:ring-rhino-red',
      ghost:
        'text-kaziranga-700 dark:text-cream-300 hover:bg-kaziranga-800/5 dark:hover:bg-kaziranga-800/30 focus:ring-kaziranga-500',
      gold:
        'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-kaziranga-950 font-bold hover:brightness-110 shadow-md shadow-gold-500/20 focus:ring-gold-400',
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
