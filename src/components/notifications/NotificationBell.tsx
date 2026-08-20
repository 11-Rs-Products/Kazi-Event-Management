'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, Calendar, Crown, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import Link from 'next/link';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'ROLE_CHANGE':
        return <Crown className="w-4 h-4 text-gold-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cream-400/60 shrink-0" />;
    }
  };

  const renderFormattedMessage = (msg: string) => {
    const parts = msg.split(/(Super Admin|Admin|Member|User)/g);
    return parts.map((part, index) => {
      if (['Super Admin', 'Admin', 'Member', 'User'].includes(part)) {
        return (
          <span key={index} className="font-extrabold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-cream-300 hover:bg-kaziranga-700/50 dark:hover:bg-kaziranga-800/60 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rhino-red px-1 text-[10px] font-bold text-white shadow-sm animate-pulse-glow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-arena-surface dark:bg-kaziranga-900 border border-cream-400/20 dark:border-kaziranga-800 shadow-arena-lg z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-400/15 dark:border-kaziranga-800 bg-kaziranga-800 dark:bg-kaziranga-950">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-display font-bold text-cream-100">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rhino-red text-white text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cream-300 hover:text-gold-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-cream-400/10 dark:divide-kaziranga-800/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/40">
                <Bell className="w-8 h-8 mx-auto mb-2 text-cream-400/30 dark:text-kaziranga-700" />
                All quiet in the arena.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.read
                      ? 'bg-kaziranga-800/[0.03] dark:bg-kaziranga-800/20'
                      : 'hover:bg-cream-200/30 dark:hover:bg-kaziranga-800/10 opacity-75'
                  }`}
                >
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-display font-bold text-kaziranga-800 dark:text-cream-100 truncate">
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-kaziranga-400 dark:text-cream-400/40 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1 leading-snug">
                      {renderFormattedMessage(item.message)}
                    </p>
                    {item.linkUrl && (
                      <Link
                        href={item.linkUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-kaziranga-700 dark:text-cream-300 hover:underline mt-2"
                      >
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-rhino-red shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-cream-400/15 dark:border-kaziranga-800 bg-cream-200/30 dark:bg-kaziranga-900/40 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-kaziranga-700 dark:text-cream-300 hover:underline"
            >
              View Activity Center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
