'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-kaziranga-950/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Centering Wrapper */}
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`relative w-full ${maxWidthClasses[maxWidth]} text-left rounded-2xl bg-arena-surface dark:bg-kaziranga-900 border border-cream-400/30 dark:border-kaziranga-800 shadow-arena-lg overflow-hidden z-10 my-auto`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-cream-400/30 dark:border-kaziranga-800 bg-kaziranga-800 dark:bg-kaziranga-950">
                <div>
                  <h3 className="text-lg font-display font-bold text-cream-100 leading-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-cream-400 dark:text-kaziranga-400 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-cream-400 hover:text-white hover:bg-kaziranga-700 dark:hover:bg-kaziranga-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
