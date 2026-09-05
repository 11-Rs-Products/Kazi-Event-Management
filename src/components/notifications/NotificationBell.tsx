'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
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
      <strong key={i} className="font-semibold text-ink dark:text-white">
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Smart Filtering (for all views):
  // Show ALL unread notifications + at most latest 3 read notifications
  const displayNotifications = useMemo(() => {
    const unread = notifications.filter((n) => !n.read);
    const read = notifications.filter((n) => n.read).slice(0, 3);
    return [...unread, ...read];
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
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
        className="relative w-9 h-9 grid place-items-center rounded-xl text-ink-muted
          hover:text-ink hover:bg-surface-sunken dark:text-white/70
          dark:hover:text-white dark:hover:bg-white/10 transition-colors"
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
            className="fixed inset-x-3 top-[calc(var(--navbar-height,68px)+0.5rem)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-96 origin-top sm:origin-top-right z-50
              rounded-2xl bg-surface-raised border border-hairline dark:border-white/10 shadow-e-4 overflow-hidden"
          >
            <div className="bg-surface-sunken dark:ed-stage px-3.5 py-2.5 flex items-center justify-between gap-3 border-b border-hairline dark:border-white/10">
              <h2 className="font-display font-bold text-micro text-ink dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-[rgb(var(--accent-vivid))] text-[0.6875rem] font-semibold nums">
                    {unreadCount} new
                  </span>
                )}
              </h2>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="inline-flex items-center gap-1 text-[0.6875rem] font-display font-medium
                    text-ink-muted hover:text-ink dark:text-white/60 dark:hover:text-white transition-colors"
                >
                  <CheckCheck className="w-3 h-3" aria-hidden />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[calc(100vh-var(--navbar-height,68px)-7rem)] sm:max-h-[22rem] overflow-y-auto overscroll-contain divide-y divide-hairline dark:divide-white/10">
              {displayNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center space-y-2">
                  <BellOff className="w-5 h-5 mx-auto text-ink-faint" aria-hidden />
                  <p className="text-micro text-ink-muted">All quiet in the arena.</p>
                </div>
              ) : (
                displayNotifications.map((item) => {
                  const { Icon, tone } = ICON_META[item.type] ?? DEFAULT_META;
                  const isLong = item.message.length > 60;
                  const isExpanded = expandedIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'relative px-3.5 py-2.5 flex items-start gap-2.5 transition-colors',
                        !item.read && 'bg-brand-soft/40'
                      )}
                    >
                      <span
                        className={cn('grid place-items-center w-7 h-7 rounded-lg shrink-0', tone)}
                        aria-hidden
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-micro font-display font-bold text-ink dark:text-white truncate">
                            {item.title}
                          </h3>
                          <time className="text-[0.625rem] text-ink-faint shrink-0 nums">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>

                        <div className="space-y-0.5">
                          <p
                            onClick={() => isLong && toggleExpand(item.id)}
                            className={cn(
                              'text-[0.71875rem] text-ink-muted leading-snug transition-colors',
                              isLong && 'cursor-pointer hover:text-ink dark:hover:text-white',
                              !isExpanded && isLong && 'clamp-1'
                            )}
                          >
                            {renderFormattedMessage(item.message)}
                          </p>

                          {isLong && (
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(item.id, e)}
                              className="inline-flex items-center gap-0.5 text-[0.625rem] font-semibold text-brand dark:text-[rgb(var(--accent-vivid))] hover:underline underline-offset-2"
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <>
                                  Show less <ChevronUp className="w-2.5 h-2.5" />
                                </>
                              ) : (
                                <>
                                  Read full message <ChevronDown className="w-2.5 h-2.5" />
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {item.linkUrl ? (
                          <div className="pt-0.5">
                            <Link
                              href={item.linkUrl}
                              onClick={() => {
                                markAsRead(item.id);
                                setIsOpen(false);
                              }}
                              className="relative z-10 inline-flex items-center gap-1 text-[0.6875rem] font-display font-bold
                                text-brand dark:text-[rgb(var(--accent-vivid))] hover:underline underline-offset-4"
                            >
                              View details
                              <ArrowUpRight className="w-3 h-3" aria-hidden />
                            </Link>
                          </div>
                        ) : (
                          !item.read && (
                            <div className="pt-0.5">
                              <button
                                onClick={() => markAsRead(item.id)}
                                className="text-[0.6875rem] font-display font-semibold text-ink-faint hover:text-ink dark:text-white/50 dark:hover:text-white transition-colors"
                              >
                                Mark as read
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      {!item.read && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-3.5 py-2.5 border-t border-hairline dark:border-white/10 bg-surface-sunken dark:ed-stage text-center">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-micro font-display font-bold text-brand dark:text-[rgb(var(--accent-vivid))] hover:underline underline-offset-4"
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
