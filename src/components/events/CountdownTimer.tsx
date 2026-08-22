'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string | Date | null | undefined;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference <= 0) {
        return null;
      }
      
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60)
      };
    };

    // Set initial state
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-kaziranga-950/80 backdrop-blur-md border border-kaziranga-700/50 shadow-lg z-10 pointer-events-none">
      <Clock className="w-3 h-3 text-gold-400" />
      <div className="flex gap-1.5 text-xs font-mono font-bold text-white tracking-wide">
        {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
        <span>{String(timeLeft.h).padStart(2, '0')}h</span>
        <span>{String(timeLeft.m).padStart(2, '0')}m</span>
        <span>{String(timeLeft.s).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};
