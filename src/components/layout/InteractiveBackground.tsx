'use client';

import React from 'react';

/**
 * InteractiveBackground — Neo-Brutalism Scrapbook Canvas
 * 
 * Inspired by the Neo-Brutalism scrapbook aesthetic:
 * - Subtle geometric dot-grid matrix across warm cream paper.
 * - Scattered playful geometric confetti: 4-pointed stars (✦), rotated pastel squares,
 *   and pill stickers softly decorating the perimeter.
 * - Seamless adaptation to dark mode with contrasting dots and glowing stickers.
 */
export const InteractiveBackground: React.FC = React.memo(() => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-surface overflow-hidden select-none transform-gpu [contain:strict]"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* ─── 1. Neo-Brutalist Dot-Matrix Grid (Light & Dark) ─── */}
      {/* Light mode: crisp dark dots */}
      <div
        className="absolute inset-0 opacity-[0.38] dark:hidden"
        style={{
          backgroundImage:
            'radial-gradient(#121212 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Dark mode: crisp glowing white/cream dots */}
      <div
        className="absolute inset-0 opacity-[0.35] hidden dark:block"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ─── 2. Soft Ambient Color Blooms ─── */}
      <div
        className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full
          bg-[#FFE873]/25 dark:bg-[#FFE873]/[0.12]
          blur-[100px] transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />
      <div
        className="absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full
          bg-[#5EEAD4]/20 dark:bg-[#5EEAD4]/[0.10]
          blur-[90px] transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />
      <div
        className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] rounded-full
          bg-[#FFA0A0]/20 dark:bg-[#FFA0A0]/[0.10]
          blur-[100px] transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* ─── 3. Scrapbook Floating Geometric Stickers & Stars ─── */}
      <svg
        className="absolute inset-0 w-full h-full opacity-65 dark:opacity-60"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-Right Decorative Group */}
        <g transform="translate(1380, 80) rotate(12)">
          {/* Pastel Yellow 4-point Star */}
          <path
            d="M 20 0 Q 20 18, 38 20 Q 20 22, 20 40 Q 20 22, 2 20 Q 20 18, 20 0 Z"
            fill="#FFE873"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(1480, 160) rotate(-18)">
          {/* Confetti Square Mint */}
          <rect
            x="0"
            y="0"
            width="14"
            height="14"
            rx="3"
            fill="#5EEAD4"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(1420, 240) rotate(25)">
          {/* Confetti Coral Pink */}
          <rect
            x="0"
            y="0"
            width="16"
            height="16"
            rx="4"
            fill="#FFA0A0"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>

        {/* Top-Left Decorative Group */}
        <g transform="translate(90, 110) rotate(-15)">
          {/* Pastel Purple 4-point Star */}
          <path
            d="M 16 0 Q 16 14, 30 16 Q 16 18, 16 32 Q 16 18, 2 16 Q 16 14, 16 0 Z"
            fill="#C4B5FD"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(60, 210) rotate(10)">
          {/* Confetti Yellow Square */}
          <rect
            x="0"
            y="0"
            width="12"
            height="12"
            rx="2.5"
            fill="#FFE873"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>

        {/* Mid-Left Group */}
        <g transform="translate(80, 560) rotate(30)">
          {/* Mint Circle Pill */}
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="#5EEAD4"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(45, 660) rotate(-10)">
          <path
            d="M 14 0 Q 14 12, 26 14 Q 14 16, 14 28 Q 14 16, 2 14 Q 14 12, 14 0 Z"
            fill="#FFA0A0"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>

        {/* Bottom-Right Group */}
        <g transform="translate(1510, 720) rotate(-14)">
          {/* Pastel Yellow Star */}
          <path
            d="M 22 0 Q 22 20, 42 22 Q 22 24, 22 44 Q 22 24, 2 22 Q 22 20, 22 0 Z"
            fill="#FFE873"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(1430, 820) rotate(18)">
          <rect
            x="0"
            y="0"
            width="15"
            height="15"
            rx="3"
            fill="#C4B5FD"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(1360, 890) rotate(-22)">
          <circle
            cx="9"
            cy="9"
            r="7"
            fill="#5EEAD4"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>

        {/* Bottom-Left Group */}
        <g transform="translate(120, 880) rotate(15)">
          <rect
            x="0"
            y="0"
            width="16"
            height="16"
            rx="3.5"
            fill="#FFE873"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
});

InteractiveBackground.displayName = 'InteractiveBackground';
