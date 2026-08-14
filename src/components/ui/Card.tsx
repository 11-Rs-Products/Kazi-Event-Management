import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  glass = false,
  ...props
}) => {
  const baseStyles = 'rounded-2xl border transition-all duration-200 overflow-hidden';
  const themeStyles = glass
    ? 'bg-white/80 dark:bg-kaziranga-950/80 backdrop-blur-md border-kaziranga-100 dark:border-kaziranga-900/60 shadow-sm'
    : 'bg-white dark:bg-kaziranga-950 border-kaziranga-100 dark:border-kaziranga-900/50 shadow-sm dark:shadow-kaziranga-950/40';

  const hoverStyles = hoverable
    ? 'hover:shadow-md hover:border-kaziranga-300 dark:hover:border-kaziranga-700 hover:-translate-y-0.5'
    : '';

  return (
    <div className={`${baseStyles} ${themeStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
