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
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_CONFIG: Record<
  ToastTone,
  {
    Icon: React.ElementType;
    bg: string;
    badge: string;
    iconColor: string;
  }
> = {
  success: {
    Icon: CheckCircle2,
    bg: 'bg-[#86EFAC]',
    badge: 'Success',
    iconColor: 'text-[#86EFAC]',
  },
  error: {
    Icon: XCircle,
    bg: 'bg-[#FFA0A0]',
    badge: 'Error',
    iconColor: 'text-[#FFA0A0]',
  },
  warning: {
    Icon: AlertTriangle,
    bg: 'bg-[#FFE873]',
    badge: 'Warning',
    iconColor: 'text-[#FFE873]',
  },
  info: {
    Icon: Info,
    bg: 'bg-[#5EEAD4]',
    badge: 'Notice',
    iconColor: 'text-[#5EEAD4]',
  },
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
      warning: (title, description) => toast({ tone: 'warning', title, description }),
      info: (title, description) => toast({ tone: 'info', title, description }),
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
          sm:w-[23rem]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const config = TONE_CONFIG[t.tone];
            const Icon = config.Icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.94 }}
                transition={{ duration: 0.22, ease: EASE_EDITORIAL }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl',
                  'border-2 border-black dark:border-white shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#ffffff]',
                  config.bg,
                  'text-black'
                )}
              >
                <span
                  className="w-7 h-7 rounded-lg bg-black grid place-items-center shrink-0 border-2 border-black shadow-[1px_1px_0px_rgba(0,0,0,0.2)] mt-0.5"
                  aria-hidden
                >
                  <Icon className={cn('w-4 h-4 stroke-[2.5]', config.iconColor)} />
                </span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-black text-white font-display font-black text-[9px] uppercase tracking-wider">
                      {config.badge}
                    </span>
                    <p className="text-caption font-display font-black text-black leading-snug truncate">
                      {t.title}
                    </p>
                  </div>
                  {t.description && (
                    <p className="text-micro font-bold text-black/85 leading-snug break-words">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="w-6 h-6 rounded-md bg-black/10 hover:bg-black text-black hover:text-white border border-black/20 hover:border-black grid place-items-center transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const NO_OP_TOAST: ToastContextValue = {
  toast: () => '',
  success: () => '',
  error: () => '',
  warning: () => '',
  info: () => '',
  dismiss: () => {},
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // During SSR / static prerender the provider is not mounted — return a no-op
  // so the build doesn't throw. At runtime, the ToastProvider is always present.
  if (!ctx) return NO_OP_TOAST;
  return ctx;
}
