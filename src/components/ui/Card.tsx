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
  // A whisper of top-light gradient keeps surfaces from reading as flat fills.
  default:
    'bg-surface-raised border border-hairline bg-gradient-to-b from-white/[0.5] to-transparent dark:from-white/[0.03]',
  raised:
    'bg-surface-overlay border border-hairline bg-gradient-to-b from-white/[0.6] to-transparent dark:from-white/[0.04]',
  sunken: 'bg-surface-sunken border border-hairline',
  outline: 'bg-transparent border border-hairline-strong',
  stage: 'ed-stage ed-edge-light border border-white/10 text-white',
  ghost: 'bg-transparent border-0',
};

const elevations: Record<Elevation, string> = {
  0: '',
  1: 'shadow-e-1',
  2: 'shadow-e-2',
  3: 'shadow-e-3',
  4: 'shadow-e-4',
};

const accents = {
  none: '',
  brand: 'before:bg-brand',
  accent: 'before:bg-[rgb(var(--accent-vivid))]',
  danger: 'before:bg-signal-danger',
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
      'transition-[transform,box-shadow,border-color] duration-300 ease-editorial',
      variants[variant],
      elevations[elevation],
      accent !== 'none' &&
        'before:absolute before:left-0 before:inset-y-0 before:w-[3px] before:content-[""] before:z-10',
      accents[accent],
      hoverable &&
        'cursor-pointer hover:-translate-y-1.5 hover:shadow-e-3 hover:border-hairline-strong',
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
