'use client';

import React, { useState } from 'react';

interface KazirangaLogoProps {
  variant?: 'full' | 'compact' | 'iconOnly';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textVariant?: 'light' | 'dark' | 'auto';
  logoSrc?: string;
  className?: string;
}

export const KazirangaLogo: React.FC<KazirangaLogoProps> = ({
  variant = 'full',
  size = 'md',
  textVariant = 'light',
  logoSrc = '/kaziranga-logo.svg',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  const textSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg font-extrabold',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  const subtitleSizes = {
    sm: 'text-[9px] tracking-[0.13em]',
    md: 'text-[10.5px] tracking-[0.18em]',
    lg: 'text-[13px] tracking-[0.20em]',
    xl: 'text-[16px] tracking-[0.22em]',
  };

  const titleColor =
    textVariant === 'light'
      ? 'text-cream-100'
      : textVariant === 'dark'
      ? 'text-kaziranga-900'
      : 'text-kaziranga-900 dark:text-cream-100';

  const subtitleColor =
    textVariant === 'light'
      ? 'text-cream-400/80'
      : textVariant === 'dark'
      ? 'text-kaziranga-600'
      : 'text-kaziranga-600 dark:text-cream-400/80';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Kaziranga Logo Seal */}
      {!imgError ? (
        <div
          className={`relative rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-gold-500/40 bg-cream-100 ${sizeClasses[size]}`}
          title="Kaziranga House Emblem"
        >
          <img
            src={logoSrc}
            alt="Kaziranga House Emblem"
            className="w-full h-full object-cover rounded-full transform scale-[1.04] transition-transform duration-300"
            onError={() => {
              if (logoSrc.endsWith('.svg')) {
                const img = new Image();
                img.src = '/kaziranga-logo.png';
                img.onload = () => setImgError(false);
                img.onerror = () => setImgError(true);
              } else {
                setImgError(true);
              }
            }}
          />
        </div>
      ) : (
        <div
          className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-kaziranga-800 via-kaziranga-700 to-kaziranga-900 text-cream-100 shadow-md border border-gold-500/30 ${sizeClasses[size]}`}
        >
          <span className="font-serif font-black tracking-tighter text-gold-400">K</span>
        </div>
      )}

      {variant !== 'iconOnly' && (
        <div className="flex flex-col justify-center">
          <span
            className={`tracking-tight font-display leading-none ${titleColor} ${textSizes[size]}`}
          >
            KAZIRANGA<span className="text-gold-500 font-light ml-1">HOUSE</span>
          </span>
          {variant === 'full' && (
            <span
              className={`font-bold uppercase mt-0.5 leading-none font-display ${subtitleColor} ${subtitleSizes[size]}`}
            >
              RHINOS • Event Arena
            </span>
          )}
        </div>
      )}
    </div>
  );
};
