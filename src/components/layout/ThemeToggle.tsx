'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('kazi-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kazi-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kazi-theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-kaziranga-700/30 ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl text-cream-300 hover:text-gold-400 hover:bg-kaziranga-700/60 transition-colors focus:outline-none ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Arena Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-gold-400 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-cream-300" />
      )}
    </button>
  );
};
