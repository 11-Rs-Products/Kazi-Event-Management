import React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'default' | 'raised' | 'sunken' | 'outline' | 'stage' | 'ghost';
type Elevation = 0 | 1 | 2 | 3 | 4;

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: Variant;
  elevation?: Elevation;
  hoverable?: boolean;
  /** Renders a coloured rule down the left edge. */
  accent?: 'brand' | 'accent' | 'danger' | 'none';
  as?: 'div' | 'article' | 'section' | 'li';
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const variants: Record<Variant, string> = {
  default:
    'bg-surface-raised border-2 border-black dark:border-white text-ink',
  raised:
    'bg-surface-raised border-2 border-black dark:border-white text-ink',
  sunken:
    'bg-surface-sunken border-2 border-black dark:border-white/80 text-ink',
  outline:
    'bg-transparent border-2 border-black dark:border-white text-ink',
  stage:
    'bg-[#18181B] border-2 border-white text-white',
  ghost: 'bg-transparent border-0',
};

const elevations: Record<Elevation, string> = {
  0: 'shadow-none',
  1: 'shadow-[3px_3px_0px_#121212] dark:shadow-[3px_3px_0px_#FFFFFF]',
  2: 'shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#FFFFFF]',
  3: 'shadow-[6px_6px_0px_#121212] dark:shadow-[6px_6px_0px_#FFFFFF]',
  4: 'shadow-[8px_8px_0px_#121212] dark:shadow-[8px_8px_0px_#FFFFFF]',
};

const accents = {
  none: '',
  brand: 'before:bg-[#5EEAD4]',
  accent: 'before:bg-[#FFE873]',
  danger: 'before:bg-[#FF708F]',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  elevation = 1,
  hoverable = false,
  accent = 'none',
  as: Tag = 'div',
  ...props
}) => (
  <Tag
    className={cn(
      'relative rounded-2xl overflow-hidden',
      'transition-all duration-150 ease-out',
      variants[variant],
      elevations[elevation],
      accent !== 'none' &&
        'before:absolute before:left-0 before:inset-y-0 before:w-[5px] before:content-[""] before:z-10 before:border-r-2 before:border-black',
      accents[accent],
      hoverable &&
        'cursor-pointer hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#121212] dark:hover:shadow-[6px_6px_0px_#FFE873]',
      className
    )}
    {...(props as any)}
  >
    {children}
  </Tag>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('px-5 pt-5 pb-3', className)} {...props} />;

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('px-5 py-4', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('px-5 py-4 border-t border-hairline flex items-center gap-3', className)}
    {...props}
  />
);
