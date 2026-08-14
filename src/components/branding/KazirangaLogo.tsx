'use client';

import React, { useState } from 'react';

interface KazirangaLogoProps {
  variant?: 'full' | 'compact' | 'iconOnly';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoSrc?: string;
  className?: string;
}

export const KazirangaLogo: React.FC<KazirangaLogoProps> = ({
  variant = 'full',
  size = 'md',
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
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Kaziranga Logo Seal - Precision Circular Shape */}
      {!imgError ? (
        <div
          className={`relative rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-kaziranga-800/40 dark:ring-kaziranga-400/50 bg-white ${sizeClasses[size]}`}
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
          className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-kaziranga-800 via-kaziranga-700 to-kaziranga-900 text-white shadow-md border border-kaziranga-600/30 ${sizeClasses[size]}`}
        >
          <span className="font-serif font-black tracking-tighter text-gold-400">K</span>
        </div>
      )}

      {variant !== 'iconOnly' && (
        <div className="flex flex-col justify-center">
          <span
            className={`tracking-tight bg-gradient-to-r from-kaziranga-950 via-kaziranga-800 to-kaziranga-700 dark:from-white dark:via-kaziranga-200 dark:to-kaziranga-400 bg-clip-text text-transparent font-black leading-none ${textSizes[size]}`}
          >
            KAZIRANGA<span className="text-gold-600 dark:text-gold-400 font-light ml-1">HOUSE</span>
          </span>
          {variant === 'full' && (
            <span
              className={`tracking-widest font-bold uppercase text-kaziranga-600 dark:text-kaziranga-300 mt-1 leading-none ${subtitleSizes[size]}`}
            >
              Inter-House Portal
            </span>
          )}
        </div>
      )}
    </div>
  );
};
