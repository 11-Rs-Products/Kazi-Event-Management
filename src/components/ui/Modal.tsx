'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from './Motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Keep focus inside the dialog while it is open.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stage/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={reduce ? {} : { opacity: 0, scale: 0.97, y: 24 }}
              animate={reduce ? {} : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? {} : { opacity: 0, scale: 0.97, y: 24 }}
              transition={{ duration: 0.28, ease: EASE_EDITORIAL }}
              className={cn(
                'relative w-full text-left z-10',
                'bg-surface-raised border border-hairline shadow-e-4',
                'rounded-t-3xl sm:rounded-3xl overflow-hidden',
                'max-h-[92vh] sm:max-h-[88vh] flex flex-col',
                widths[maxWidth]
              )}
            >
              {/* Header sits on the dark stage — anchors the dialog. */}
              <div className="relative ed-stage ed-mesh shrink-0 px-6 py-5 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  {eyebrow && (
                    <div className="text-eyebrow uppercase font-display text-[rgb(var(--accent-vivid))]">
                      {eyebrow}
                    </div>
                  )}
                  <h3 className="font-display font-extrabold text-title text-white leading-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-caption text-white/60 leading-snug">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="shrink-0 p-2 -mr-1 -mt-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 overflow-y-auto grow">{children}</div>

              {footer && (
                <div className="shrink-0 px-6 py-4 border-t border-hairline bg-surface-sunken flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
