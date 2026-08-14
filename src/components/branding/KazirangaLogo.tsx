'use client';

import React, { useState } from 'react';

interface KazirangaLogoProps {
  variant?: 'full' | 'compact' | 'iconOnly';
  size?: 'sm' | 'md' | 'lg';
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
    sm: 'h-7 w-7 text-sm',
    md: 'h-9 w-9 text-base',
    lg: 'h-12 w-12 text-xl',
  };

  const containerSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-black',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Kaziranga Logo Image / Emblem Container */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-kaziranga-800 via-kaziranga-700 to-kaziranga-900 text-white shadow-md shadow-kaziranga-900/20 border border-kaziranga-600/30 overflow-hidden ${sizeClasses[size]}`}
        title="Kaziranga House Emblem"
      >
        {!imgError ? (
          <img
            src={logoSrc}
            alt="Kaziranga House Logo"
            className="w-full h-full object-contain p-1"
            onError={() => {
              // Try PNG if SVG fails, else show fallback emblem
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
        ) : (
          <>
            <span className="font-serif font-black tracking-tighter text-gold-400">K</span>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          </>
        )}
      </div>

      {variant !== 'iconOnly' && (
        <div className="flex flex-col">
          <span
            className={`tracking-tight bg-gradient-to-r from-kaziranga-950 via-kaziranga-800 to-kaziranga-700 dark:from-white dark:via-kaziranga-200 dark:to-kaziranga-400 bg-clip-text text-transparent font-black ${containerSizes[size]}`}
          >
            KAZIRANGA<span className="text-gold-600 dark:text-gold-400 font-light ml-1">HOUSE</span>
          </span>
          {variant === 'full' && (
            <span className="text-[10px] tracking-widest font-semibold uppercase text-kaziranga-600 dark:text-kaziranga-300">
              Inter-House Portal
            </span>
          )}
        </div>
      )}
    </div>
  );
};
