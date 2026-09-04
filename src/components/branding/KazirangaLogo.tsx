'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface KazirangaLogoProps {
  variant?: 'full' | 'compact' | 'iconOnly';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** `auto` follows the active theme; the others force a fixed colour. */
  textVariant?: 'light' | 'dark' | 'auto';
  logoSrc?: string;
  className?: string;
}

const seal = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-16 w-16', xl: 'h-24 w-24' };
const wordmark = {
  sm: 'text-[0.9375rem]',
  md: 'text-title-sm',
  lg: 'text-title-lg',
  xl: 'text-display-sm',
};
const tagline = {
  sm: 'text-[0.5625rem]',
  md: 'text-[0.625rem]',
  lg: 'text-[0.6875rem]',
  xl: 'text-micro',
};

export const KazirangaLogo: React.FC<KazirangaLogoProps> = ({
  variant = 'full',
  size = 'md',
  textVariant = 'light',
  logoSrc = '/kaziranga-logo.svg',
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const titleColor =
    textVariant === 'light'
      ? 'text-white'
      : textVariant === 'dark'
        ? 'text-ink'
        : 'text-ink';

  const taglineColor =
    textVariant === 'light'
      ? 'text-white/45'
      : textVariant === 'dark'
        ? 'text-ink-faint'
        : 'text-ink-faint';

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      {!imgError ? (
        <span
          className={cn(
            'relative rounded-full overflow-hidden shrink-0 bg-white',
            'ring-1 ring-[rgb(var(--accent-vivid))]/45',
            seal[size]
          )}
        >
          <img
            src={logoSrc}
            alt="Kaziranga House emblem"
            className="w-full h-full object-cover scale-[1.04]"
            onError={() => setImgError(true)}
          />
        </span>
      ) : (
        <span
          className={cn(
            'grid place-items-center rounded-full shrink-0',
            'bg-gradient-to-br from-brand to-stage',
            'ring-1 ring-[rgb(var(--accent-vivid))]/40',
            seal[size]
          )}
          aria-hidden
        >
          <span className="font-display font-black text-[rgb(var(--accent-vivid))]">K</span>
        </span>
      )}

      {variant !== 'iconOnly' && (
        <span className="flex flex-col justify-center min-w-0">
          <span
            className={cn(
              'font-display font-extrabold leading-none tracking-tight',
              titleColor,
              wordmark[size]
            )}
          >
            KAZIRANGA
            <span className="text-[rgb(var(--accent-vivid))] font-light ml-1.5">HOUSE</span>
          </span>
          {variant === 'full' && (
            <span
              className={cn(
                'font-display font-bold uppercase leading-none mt-1.5 tracking-eyebrow',
                taglineColor,
                tagline[size]
              )}
            >
              Rhinos · Event Arena
            </span>
          )}
        </span>
      )}
    </div>
  );
};
