'use client';

import React, { useState } from 'react';

interface RhinoMascotProps {
  pose?: 'welcome' | 'celebrate' | 'thinking' | 'sleeping' | 'charging';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

const POSE_IMAGES: Record<string, string> = {
  welcome: '/mascot/welcome.png',
  celebrate: '/mascot/celebrate.png',
  thinking: '/mascot/thinking.png',
  sleeping: '/mascot/sleeping.png',
  charging: '/mascot/celebrate.png',
};

const POSE_MESSAGES: Record<string, string> = {
  welcome: 'Hey, RHINO!',
  celebrate: 'You did it!',
  thinking: 'Exploring Arena...',
  sleeping: 'All quiet in the arena...',
  charging: "Let's Go RHINOS!",
};

export const RhinoMascot: React.FC<RhinoMascotProps> = ({
  pose = 'welcome',
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
    xl: 'w-52 h-52',
  };

  const imageSrc = POSE_IMAGES[pose] || POSE_IMAGES.welcome;
  const message = POSE_MESSAGES[pose] || POSE_MESSAGES.welcome;
  const animationClass = pose === 'sleeping' ? '' : 'animate-float';

  return (
    <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
      <div className={`${sizeClasses[size]} ${animationClass} relative flex items-center justify-center`}>
        {!imgError ? (
          <div className="relative w-full h-full rounded-3xl overflow-hidden drop-shadow-xl transition-transform hover:scale-105 duration-300">
            <img
              src={imageSrc}
              alt={`Kaziranga House Rhino Mascot - ${pose}`}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          /* SVG Fallback Container */
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-kaziranga-700 via-kaziranga-800 to-kaziranga-900 text-cream-100 flex items-center justify-center shadow-lg border-2 border-gold-500/30">
            <span className="text-3xl">🦏</span>
          </div>
        )}
      </div>

      {showLabel && (
        <p className="text-[11px] font-display font-bold text-kaziranga-700 dark:text-gold-400/90 uppercase tracking-wider text-center">
          {message}
        </p>
      )}
    </div>
  );
};
