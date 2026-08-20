'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Dialog Box */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 dark:bg-kaziranga-950 border border-cream-400 dark:border-kaziranga-800 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${
                variant === 'danger'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                  : variant === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                  : 'bg-kaziranga-100 dark:bg-kaziranga-900 text-kaziranga-700 dark:text-gold-400 border border-kaziranga-200 dark:border-kaziranga-800'
              }`}>
                {variant === 'danger' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-kaziranga-900 dark:text-cream-100 leading-tight">
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => !isLoading && onClose()}
              className="p-1.5 text-kaziranga-500 hover:text-kaziranga-900 dark:text-cream-400 hover:dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-kaziranga-800 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-kaziranga-700 dark:text-cream-300 leading-relaxed pl-1">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-cream-400/30 dark:border-kaziranga-800 flex items-center justify-end gap-3 bg-cream-100/60 dark:bg-kaziranga-900/60">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>

      </div>
    </div>
  );
};
