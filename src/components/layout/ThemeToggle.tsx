'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('kazi-theme');
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;

    const next = !isDark;
    const applyTheme = () => {
      setIsDark(next);
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('kazi-theme', next ? 'dark' : 'light');
    };

    const doc = document as any;
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(applyTheme);
    } else {
      document.documentElement.classList.add('theme-transitioning');
      applyTheme();
      window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 350);
    }
  };

  if (!mounted) {
    return <div className={cn('w-9 h-9 rounded-xl bg-surface-sunken/60 dark:bg-white/5', className)} />;
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'group relative w-9 h-9 grid place-items-center rounded-xl overflow-hidden',
        'text-ink-muted hover:text-ink hover:bg-surface-sunken',
        'dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 transition-colors',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 grid place-items-center"
        >
          {isDark ? (
            <Sun className="w-[18px] h-[18px] text-[rgb(var(--accent-vivid))]" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-ink-muted group-hover:text-ink transition-colors" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
