'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from './Motion';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  /** Show a toast. Returns its id so it can be dismissed early. */
  toast: (t: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_META: Record<ToastTone, { Icon: React.ElementType; accent: string }> = {
  success: { Icon: CheckCircle2, accent: 'text-signal-live' },
  error: { Icon: XCircle, accent: 'text-signal-danger' },
  warning: { Icon: AlertTriangle, accent: 'text-signal-warn' },
  info: { Icon: Info, accent: 'text-signal-info' },
};

const DURATION_MS = 5000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ tone: 'success', title, description }),
      error: (title, description) => toast({ tone: 'error', title, description }),
    }),
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Bottom on phones so it clears the tab bar; top-right from tablet up. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed z-[100] flex flex-col gap-2.5
          inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]
          sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-[calc(var(--navbar-height)+1rem)]
          sm:w-[22rem]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { Icon, accent } = TONE_META[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.28, ease: EASE_EDITORIAL }}
                className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl
                  bg-surface-overlay border border-hairline shadow-e-4"
              >
                <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', accent)} aria-hidden />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-caption font-display font-bold text-ink">{t.title}</p>
                  {t.description && (
                    <p className="text-micro text-ink-muted leading-relaxed">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="p-1 -m-1 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a <ToastProvider>');
  return ctx;
}
