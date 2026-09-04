'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Crown,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from '../ui/Motion';

const ICON_META: Record<string, { Icon: React.ElementType; tone: string }> = {
  SUCCESS: { Icon: CheckCircle2, tone: 'bg-signal-live/10 text-signal-live' },
  WARNING: { Icon: AlertTriangle, tone: 'bg-signal-warn/10 text-signal-warn' },
  EVENT: { Icon: Calendar, tone: 'bg-signal-info/10 text-signal-info' },
  ROLE_CHANGE: { Icon: Crown, tone: 'bg-accent-soft text-accent' },
  TEAM_INVITE: { Icon: Users, tone: 'bg-brand-soft text-brand' },
};

const DEFAULT_META = { Icon: Info, tone: 'bg-surface-sunken text-ink-faint' };

/** Bolds the role words so a role change reads at a glance. */
function renderFormattedMessage(msg: string) {
  return msg.split(/(Super Admin|Admin|Member|User)/g).map((part, i) =>
    ['Super Admin', 'Admin', 'Member', 'User'].includes(part) ? (
      <strong key={i} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
        aria-expanded={isOpen}
        className="relative w-9 h-9 grid place-items-center rounded-xl text-white/70
          hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 grid place-items-center min-w-[1.05rem] h-[1.05rem] px-1
              rounded-full bg-signal-danger text-white text-[0.625rem] font-display font-bold nums"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE_EDITORIAL }}
            className="absolute right-0 mt-2.5 w-[min(92vw,24rem)] origin-top-right z-50
              rounded-2xl bg-surface-raised border border-hairline shadow-e-4 overflow-hidden"
          >
            <div className="ed-stage px-4 py-3.5 flex items-center justify-between gap-3">
              <h2 className="font-display font-bold text-caption text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-[rgb(var(--accent-vivid))] nums">
                    {unreadCount} new
                  </span>
                )}
              </h2>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="inline-flex items-center gap-1.5 text-micro font-display font-semibold
                    text-white/60 hover:text-white transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" aria-hidden />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[22rem] overflow-y-auto divide-y divide-hairline">
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center space-y-2.5">
                  <BellOff className="w-6 h-6 mx-auto text-ink-faint" aria-hidden />
                  <p className="text-caption text-ink-muted">All quiet in the arena.</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const { Icon, tone } = ICON_META[item.type] ?? DEFAULT_META;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'relative px-4 py-3.5 flex items-start gap-3 transition-colors',
                        !item.read && 'bg-brand-soft/40'
                      )}
                    >
                      <span
                        className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0', tone)}
                        aria-hidden
                      >
                        <Icon className="w-4 h-4" />
                      </span>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-caption font-display font-bold text-ink truncate">
                            {item.title}
                          </h3>
                          <time className="text-[0.625rem] text-ink-faint shrink-0 nums">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>

                        <p className="text-micro text-ink-muted leading-relaxed clamp-2">
                          {renderFormattedMessage(item.message)}
                        </p>

                        {item.linkUrl ? (
                          <Link
                            href={item.linkUrl}
                            onClick={() => {
                              markAsRead(item.id);
                              setIsOpen(false);
                            }}
                            className="relative z-10 inline-flex items-center gap-1 text-micro font-display font-bold
                              text-brand hover:underline underline-offset-4"
                          >
                            View details
                            <ArrowUpRight className="w-3 h-3" aria-hidden />
                          </Link>
                        ) : (
                          !item.read && (
                            <button
                              onClick={() => markAsRead(item.id)}
                              className="text-micro font-display font-semibold text-ink-faint hover:text-ink transition-colors"
                            >
                              Mark as read
                            </button>
                          )
                        )}
                      </div>

                      {!item.read && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-2"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-hairline bg-surface-sunken text-center">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-caption font-display font-bold text-brand hover:underline underline-offset-4"
              >
                View all activity
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
