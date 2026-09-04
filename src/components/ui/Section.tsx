import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SectionHeadingProps {
  /** Small tracked-out label above the title. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions — a link or button, kept to one or two. */
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

const titleSize = {
  sm: 'text-title',
  md: 'text-title-lg',
  lg: 'text-display-sm',
};

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  actions,
  size = 'md',
  className,
  as: Tag = 'h2',
}) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-end justify-between gap-4',
      className
    )}
  >
    <div className="space-y-2 min-w-0">
      {eyebrow && <div className="ed-eyebrow">{eyebrow}</div>}
      <Tag className={cn('font-display font-extrabold text-ink', titleSize[size])}>
        {title}
      </Tag>
      {description && (
        <p className="text-caption text-ink-muted max-w-prose">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

/** A hairline-separated editorial band. */
export const Section: React.FC<
  React.HTMLAttributes<HTMLElement> & { divided?: boolean }
> = ({ className, divided = false, children, ...props }) => (
  <section
    className={cn(
      'space-y-5',
      divided && 'pt-8 mt-8 border-t border-hairline',
      className
    )}
    {...props}
  >
    {children}
  </section>
);
