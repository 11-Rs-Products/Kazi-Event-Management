'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn('w-9 h-9 rounded-xl bg-surface-sunken/60 dark:bg-white/5', className)} />;
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'group relative w-9 h-9 grid place-items-center rounded-xl overflow-hidden cursor-pointer',
        'border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]',
        'bg-white dark:bg-[#232328] text-ink transition-all duration-100',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
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
            <Sun className="w-[18px] h-[18px] text-[#FFE873] stroke-[2.5]" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-ink stroke-[2.5]" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
