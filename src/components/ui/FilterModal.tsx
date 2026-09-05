'use client';

import React, { useEffect, useRef } from 'react';
import { X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from './Motion';

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  activeFilterCount?: number;
  onReset?: () => void;
  resultsCount?: number;
  countLabel?: string;
  children: React.ReactNode;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  title = 'Filter options',
  activeFilterCount = 0,
  onReset,
  resultsCount,
  countLabel = 'results',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-stage-950/60 backdrop-blur-sm"
          />

          {/* Dialog Panel: Bottom-sheet on mobile, centered modal on sm+ */}
          <motion.div
            ref={panelRef}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE_EDITORIAL }}
            className={cn(
              'relative w-full max-w-lg max-h-[85vh] flex flex-col',
              'bg-surface-raised dark:bg-surface-sunken border border-hairline',
              'rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-soft/60 dark:bg-brand/10 text-brand grid place-items-center">
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-title-sm text-ink">{title}</h3>
                  {activeFilterCount > 0 && (
                    <p className="text-micro font-medium text-brand dark:text-accent">
                      {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="text-micro font-semibold text-ink-muted hover:text-signal-danger transition-colors px-2 py-1 rounded-lg hover:bg-surface-sunken"
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {children}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-hairline bg-surface-sunken/40 flex items-center justify-between gap-3">
              <div className="text-caption text-ink-muted">
                {typeof resultsCount === 'number' && (
                  <span>
                    <strong className="font-semibold text-ink">{resultsCount}</strong> {countLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  rightIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Show results
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
