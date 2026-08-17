import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  variant?: 'default' | 'teal' | 'dark' | 'cream';
  accent?: 'teal' | 'red' | 'gold' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  glass = false,
  variant = 'default',
  accent = 'none',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200 overflow-hidden';

  const variantStyles = {
    default: glass
      ? 'bg-white/80 dark:bg-kaziranga-900/60 backdrop-blur-md border border-cream-400/30 dark:border-kaziranga-800/60 shadow-arena'
      : 'bg-arena-surface dark:bg-kaziranga-900/80 border border-cream-400/20 dark:border-kaziranga-800/50 shadow-arena',
    teal: 'bg-kaziranga-800 dark:bg-kaziranga-900 text-cream-300 border border-kaziranga-700/50 dark:border-kaziranga-800 shadow-kaziranga',
    dark: 'bg-rhino-black text-cream-300 border border-kaziranga-900/50 shadow-kaziranga-lg',
    cream: 'bg-cream-300 dark:bg-kaziranga-900/40 text-rhino-black dark:text-cream-200 border border-cream-400/40 dark:border-kaziranga-800/50 shadow-arena',
  };

  const hoverStyles = hoverable
    ? 'hover:shadow-arena-hover hover:-translate-y-1 cursor-pointer'
    : '';

  const accentStyles = {
    none: '',
    teal: 'accent-left-teal',
    red: 'accent-left-red',
    gold: 'accent-left-gold',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${accentStyles[accent]} ${className}`} {...props}>
      {children}
    </div>
  );
};
