'use client';

import React from 'react';

/**
 * InteractiveBackground
 * 
 * Topographic Contour Elevation Canvas:
 * Inspired by the topography of Kaziranga National Park (hills, ridges, and river floodplains).
 * - Light Mode: Warm sepia/pine ink contour lines softly etched into paper.
 * - Dark Mode: Whisper-soft emerald and teal contours harmonized with the deep dark forest stage.
 * - Zero cursor tracking or distracting spotlights.
 */
export const InteractiveBackground: React.FC = React.memo(() => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-surface overflow-hidden select-none transform-gpu [contain:strict]"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* ─── 1. Ambient atmospheric glow (subtle, non-distracting depth) ─── */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full
          bg-brand-soft/25 dark:bg-emerald-500/[0.035]
          blur-[100px] transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full
          bg-accent-soft/20 dark:bg-teal-500/[0.025]
          blur-[100px] transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* ─── 2. Topographic Contour Elevation Map ─── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-[#2A443A] dark:stroke-[#2DD4BF] transition-colors duration-500"
        >
          {/* Ridge Peak A (Upper Right Quadrant) */}
          <path
            d="M 1050 180 C 1120 170, 1200 200, 1240 250 C 1280 300, 1260 380, 1200 420 C 1140 460, 1060 450, 1010 400 C 960 350, 980 190, 1050 180 Z"
            strokeWidth="1"
            className="opacity-[0.04] dark:opacity-[0.035]"
          />
          <path
            d="M 1010 140 C 1110 125, 1240 165, 1290 230 C 1340 295, 1320 410, 1240 460 C 1160 510, 1030 495, 960 430 C 890 365, 910 155, 1010 140 Z"
            strokeWidth="1"
            className="opacity-[0.05] dark:opacity-[0.04]"
          />
          {/* Index contour 120m */}
          <path
            d="M 970 100 C 1100 80, 1280 130, 1340 210 C 1400 290, 1380 440, 1280 500 C 1180 560, 1000 540, 910 460 C 820 380, 840 120, 970 100 Z"
            strokeWidth="1.25"
            className="opacity-[0.07] dark:opacity-[0.06]"
          />
          <path
            d="M 930 60 C 1090 35, 1320 95, 1390 190 C 1460 285, 1440 470, 1320 540 C 1200 610, 970 585, 860 490 C 750 395, 770 85, 930 60 Z"
            strokeWidth="1"
            className="opacity-[0.05] dark:opacity-[0.04]"
          />
          <path
            d="M 890 20 C 1080 -10, 1360 60, 1440 170 C 1520 280, 1500 500, 1360 580 C 1220 660, 940 630, 810 520 C 680 410, 700 50, 890 20 Z"
            strokeWidth="1"
            className="opacity-[0.04] dark:opacity-[0.035]"
          />

          {/* Sweeping Floodplain & Valley Contours (Spanning center to bottom-left) */}
          <path
            d="M -100 220 C 200 260, 450 180, 700 320 C 950 460, 1100 650, 1350 680 C 1500 700, 1650 620, 1750 650"
            strokeWidth="1"
            className="opacity-[0.05] dark:opacity-[0.04]"
          />
          <path
            d="M -100 280 C 220 320, 470 240, 720 370 C 970 500, 1110 700, 1360 730 C 1510 750, 1660 680, 1750 710"
            strokeWidth="1"
            className="opacity-[0.055] dark:opacity-[0.045]"
          />
          {/* Index contour 80m */}
          <path
            d="M -100 340 C 240 380, 490 300, 740 420 C 990 540, 1120 750, 1370 780 C 1520 800, 1670 740, 1750 770"
            strokeWidth="1.25"
            className="opacity-[0.075] dark:opacity-[0.065]"
          />
          <path
            d="M -100 400 C 260 440, 510 360, 760 470 C 1010 580, 1130 800, 1380 830 C 1530 850, 1680 800, 1750 830"
            strokeWidth="1"
            className="opacity-[0.055] dark:opacity-[0.045]"
          />
          <path
            d="M -100 460 C 280 500, 530 420, 780 520 C 1030 620, 1140 850, 1390 880 C 1540 900, 1690 860, 1750 890"
            strokeWidth="1"
            className="opacity-[0.05] dark:opacity-[0.04]"
          />

          {/* Ridge Peak B (Lower Left / South Basin) */}
          <path
            d="M 280 650 C 350 630, 440 670, 470 730 C 500 790, 460 870, 390 900 C 320 930, 230 890, 200 830 C 170 770, 210 670, 280 650 Z"
            strokeWidth="1"
            className="opacity-[0.045] dark:opacity-[0.035]"
          />
          <path
            d="M 240 610 C 340 585, 470 635, 510 710 C 550 785, 500 895, 410 935 C 320 975, 190 930, 150 850 C 110 770, 140 635, 240 610 Z"
            strokeWidth="1"
            className="opacity-[0.055] dark:opacity-[0.045]"
          />
          {/* Index contour 40m */}
          <path
            d="M 200 570 C 330 540, 500 600, 550 690 C 600 780, 540 920, 430 970 C 320 1020, 150 970, 100 870 C 50 770, 70 600, 200 570 Z"
            strokeWidth="1.25"
            className="opacity-[0.075] dark:opacity-[0.065]"
          />
          <path
            d="M 160 530 C 320 495, 530 565, 590 670 C 650 775, 580 945, 450 1005 C 320 1065, 110 1010, 50 890 C -10 770, 0 565, 160 530 Z"
            strokeWidth="1"
            className="opacity-[0.05] dark:opacity-[0.04]"
          />

          {/* North Plateau Flowing Ridge (Top Left) */}
          <path
            d="M -50 40 C 150 70, 300 10, 480 90 C 660 170, 720 260, 850 280"
            strokeWidth="1"
            className="opacity-[0.045] dark:opacity-[0.035]"
          />
          <path
            d="M -50 90 C 160 120, 310 60, 490 140 C 670 220, 730 300, 860 320"
            strokeWidth="1"
            className="opacity-[0.05] dark:opacity-[0.04]"
          />
          <path
            d="M -50 140 C 170 170, 320 110, 500 190 C 680 270, 740 340, 870 360"
            strokeWidth="1.25"
            className="opacity-[0.07] dark:opacity-[0.06]"
          />
        </g>

        {/* Delicate Topographic Coordinates & Elevation Indicators */}
        <g
          className="fill-[#2A443A] dark:fill-[#2DD4BF] font-mono text-[9px] uppercase tracking-widest transition-colors duration-500"
          style={{ letterSpacing: '0.2em' }}
        >
          {/* North East Coordinates */}
          <text
            x="1260"
            y="245"
            className="opacity-[0.14] dark:opacity-[0.12]"
            transform="rotate(22 1260 245)"
          >
            26°40′N 93°21′E • EL 120M
          </text>
          {/* Central Floodplain Marker */}
          <text
            x="760"
            y="415"
            className="opacity-[0.12] dark:opacity-[0.10]"
            transform="rotate(14 760 415)"
          >
            KAZIRANGA TERRAIN • 80M
          </text>
          {/* South Basin Marker */}
          <text
            x="480"
            y="685"
            className="opacity-[0.14] dark:opacity-[0.12]"
            transform="rotate(-18 480 685)"
          >
            SANCTUARY TRANSECT • 40M
          </text>
        </g>
      </svg>

      {/* ─── 3. Subtle Authentic Tactile Paper Grain ─── */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-screen pointer-events-none transform-gpu [contain:strict]"
        style={{
          transform: 'translateZ(0)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
        }}
      />
    </div>
  );
});

InteractiveBackground.displayName = 'InteractiveBackground';
