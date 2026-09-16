'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type AlertTone = 'success' | 'error' | 'warning' | 'info';

interface AlertBannerProps {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const TONE_CONFIG: Record<
  AlertTone,
  {
    bg: string;
    text: string;
    Icon: React.ElementType;
    badge: string;
    iconBg: string;
  }
> = {
  success: {
    bg: 'bg-[#86EFAC]',
    text: 'text-black',
    Icon: CheckCircle2,
    badge: 'Success',
    iconBg: 'bg-black text-[#86EFAC]',
  },
  error: {
    bg: 'bg-[#FFA0A0]',
    text: 'text-black',
    Icon: AlertCircle,
    badge: 'Error',
    iconBg: 'bg-black text-[#FFA0A0]',
  },
  warning: {
    bg: 'bg-[#FFE873]',
    text: 'text-black',
    Icon: AlertTriangle,
    badge: 'Warning',
    iconBg: 'bg-black text-[#FFE873]',
  },
  info: {
    bg: 'bg-[#5EEAD4]',
    text: 'text-black',
    Icon: Info,
    badge: 'Notice',
    iconBg: 'bg-black text-[#5EEAD4]',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  tone = 'info',
  title,
  children,
  onDismiss,
  className,
  icon,
}) => {
  const config = TONE_CONFIG[tone];
  const IconComponent = config.Icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'p-4 rounded-2xl border-2 border-black dark:border-white shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#FFFFFF] flex items-center justify-between gap-4 transition-all',
        config.bg,
        config.text,
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'w-8 h-8 rounded-xl grid place-items-center shrink-0 border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.2)]',
            config.iconBg
          )}
          aria-hidden
        >
          {icon || <IconComponent className="w-4 h-4 stroke-[2.5]" />}
        </span>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-block px-1.5 py-0.5 rounded bg-black text-white font-display font-black text-[9px] uppercase tracking-wider">
              {config.badge}
            </span>
            {title && (
              <span className="font-display font-black text-caption text-black truncate">
                {title}
              </span>
            )}
          </div>
          <div className="text-caption font-bold text-black leading-snug break-words">
            {children}
          </div>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 font-display font-black text-micro uppercase tracking-wider border-2 border-black shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
