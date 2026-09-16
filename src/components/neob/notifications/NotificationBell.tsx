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
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationItem } from '@/types';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from '../ui/Motion';

const getCategoryMeta = (type: NotificationItem['type'], title: string) => {
  const t = title.toLowerCase();
  if (t.includes('access request')) {
    return { label: 'Access Request', bg: 'bg-[#FFA0A0]', text: 'text-black' };
  }
  if (type === 'TEAM_INVITE' || t.includes('team') || t.includes('teammate')) {
    return { label: 'Team Invitation', bg: 'bg-[#5EEAD4]', text: 'text-black' };
  }
  if (type === 'EVENT' || t.includes('festival') || t.includes('competition')) {
    return { label: 'Event Update', bg: 'bg-[#FFE873]', text: 'text-black' };
  }
  if (type === 'ROLE_CHANGE') {
    return { label: 'Role Change', bg: 'bg-[#C4B5FD]', text: 'text-black' };
  }
  if (type === 'SUCCESS' || t.includes('confirmed') || t.includes('registered')) {
    return { label: 'Registration', bg: 'bg-[#86EFAC]', text: 'text-black' };
  }
  if (type === 'WARNING') {
    return { label: 'Alert', bg: 'bg-[#FFA0A0]', text: 'text-black' };
  }
  return { label: 'Announcement', bg: 'bg-white dark:bg-black', text: 'text-black dark:text-white' };
};

const getIconMeta = (type: NotificationItem['type'], title: string) => {
  const t = title.toLowerCase();
  if (t.includes('access request')) {
    return { Icon: KeyRound, bg: 'bg-[#FFA0A0]' };
  }
  switch (type) {
    case 'SUCCESS':
      return { Icon: CheckCircle2, bg: 'bg-[#86EFAC]' };
    case 'WARNING':
      return { Icon: AlertTriangle, bg: 'bg-[#FFA0A0]' };
    case 'EVENT':
      return { Icon: Calendar, bg: 'bg-[#FFE873]' };
    case 'ROLE_CHANGE':
      return { Icon: Crown, bg: 'bg-[#C4B5FD]' };
    case 'TEAM_INVITE':
      return { Icon: Users, bg: 'bg-[#5EEAD4]' };
    default:
      return { Icon: Sparkles, bg: 'bg-[#FFE873]' };
  }
};

/** Bolds role and keyword tokens so notifications read clearly at a glance. */
function renderFormattedMessage(msg: string) {
  return msg.split(/(Super Admin|Admin|Member|User)/g).map((part, i) =>
    ['Super Admin', 'Admin', 'Member', 'User'].includes(part) ? (
      <strong key={i} className="font-extrabold text-black dark:text-white">
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

  // Smart Filtering: Show unread notifications first, plus up to 4 latest read
  const displayNotifications = useMemo(() => {
    const unread = notifications.filter((n) => !n.read);
    const read = notifications.filter((n) => n.read).slice(0, 4);
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
      {/* Trigger Button - Matches ThemeToggle tactile styling */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        className={cn(
          'relative w-9 h-9 grid place-items-center rounded-xl overflow-visible cursor-pointer',
          'border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF]',
          'bg-white dark:bg-[#232328] text-ink transition-all duration-100',
          'hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
        )}
      >
        <Bell className="w-[18px] h-[18px] stroke-[2.5]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full
              bg-[#FF708F] text-black border-2 border-black font-display font-black text-[10px] grid place-items-center shadow-[1px_1px_0px_#121212] nums"
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
            className="fixed inset-x-3 top-[calc(var(--navbar-height,68px)+0.5rem)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[400px] origin-top sm:origin-top-right z-50
              rounded-2xl bg-white dark:bg-[#1e1e1e] border-2 border-black dark:border-white shadow-[8px_8px_0px_#121212] dark:shadow-[8px_8px_0px_#FFFFFF] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#FFE873] px-4 py-3 flex items-center justify-between gap-3 border-b-2 border-black dark:border-white text-black">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-caption text-black uppercase tracking-wider">
                  ✦ Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wider nums">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="inline-flex items-center gap-1 text-[11px] font-display font-black
                    text-black bg-white/80 hover:bg-white px-2 py-1 rounded-md border-2 border-black shadow-[1.5px_1.5px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <CheckCheck className="w-3 h-3 stroke-[2.5]" aria-hidden />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[calc(100vh-var(--navbar-height,68px)-7rem)] sm:max-h-[24rem] overflow-y-auto overscroll-contain divide-y-2 divide-black dark:divide-white">
              {displayNotifications.length === 0 ? (
                <div className="px-4 py-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFE873] border-2 border-black shadow-[3px_3px_0px_#121212] text-black grid place-items-center mx-auto">
                    <BellOff className="w-6 h-6 stroke-[2.5]" aria-hidden />
                  </div>
                  <p className="font-display font-bold text-title-sm text-ink">All quiet in the arena</p>
                  <p className="text-micro font-medium text-ink-muted max-w-xs mx-auto">
                    New alerts, team invites, and announcements will appear here.
                  </p>
                </div>
              ) : (
                displayNotifications.map((item) => {
                  const iconMeta = getIconMeta(item.type, item.title);
                  const catMeta = getCategoryMeta(item.type, item.title);
                  const { Icon } = iconMeta;
                  const isLong = item.message.length > 70;
                  const isExpanded = expandedIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'relative p-4 flex items-start gap-3 transition-colors',
                        !item.read
                          ? 'bg-[#FFFBEB] dark:bg-[#252216]'
                          : 'bg-white dark:bg-[#1e1e1e] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                      )}
                    >
                      {/* Left Icon Badge */}
                      <span
                        className={cn(
                          'grid place-items-center w-9 h-9 rounded-xl border-2 border-black shadow-[2px_2px_0px_#121212] shrink-0 text-black',
                          iconMeta.bg
                        )}
                        aria-hidden
                      >
                        <Icon className="w-4 h-4 stroke-[2.5]" />
                      </span>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Top Meta Line: Category pill + Time + Unread Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md border border-black font-display font-black text-[9px] uppercase tracking-wider',
                              catMeta.bg,
                              catMeta.text
                            )}
                          >
                            ✦ {catMeta.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <time className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 shrink-0">
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>
                            {!item.read && (
                              <span
                                className="w-2 h-2 rounded-full bg-[#FF708F] border border-black shrink-0"
                                aria-label="Unread"
                              />
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-micro font-display font-black text-black dark:text-white truncate">
                          {item.title}
                        </h3>

                        {/* Message Box */}
                        <div className="space-y-1">
                          <p
                            onClick={() => isLong && toggleExpand(item.id)}
                            className={cn(
                              'text-[12px] text-gray-700 dark:text-gray-300 font-medium leading-snug',
                              isLong && 'cursor-pointer',
                              !isExpanded && isLong && 'line-clamp-2'
                            )}
                          >
                            {renderFormattedMessage(item.message)}
                          </p>

                          {isLong && (
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(item.id, e)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-display font-bold text-black dark:text-white underline decoration-black underline-offset-2"
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

                        {/* Actions */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          {item.linkUrl ? (
                            <Link
                              href={item.linkUrl}
                              onClick={() => {
                                markAsRead(item.id);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-black bg-[#5EEAD4] hover:bg-[#4bd8c2] text-black font-display font-black text-[11px] shadow-[2px_2px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                            >
                              View details
                              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" aria-hidden />
                            </Link>
                          ) : (
                            <span />
                          )}

                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(item.id)}
                              className="text-[10px] font-display font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white underline uppercase transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t-2 border-black dark:border-white bg-[#FAF8F5] dark:bg-[#181818] text-center">
              <Link
                href="/neob/notifications"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-black dark:border-white bg-[#FFE873] hover:bg-[#FFF3A8] text-black font-display font-black text-caption shadow-[3px_3px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span>View all activity feed</span>
                <span className="font-mono">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
