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
        return <Info className="w-4 h-4 text-kaziranga-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-kaziranga-700 dark:text-kaziranga-200 hover:bg-kaziranga-100 dark:hover:bg-kaziranga-900/60 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-kaziranga-950 border border-kaziranga-100 dark:border-kaziranga-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-kaziranga-100 dark:border-kaziranga-900 bg-kaziranga-50/60 dark:bg-kaziranga-900/40">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-kaziranga-950 dark:text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-kaziranga-800 text-white text-[11px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-kaziranga-700 dark:text-kaziranga-300 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-kaziranga-100 dark:divide-kaziranga-900">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-kaziranga-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-kaziranga-300 dark:text-kaziranga-700" />
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.read
                      ? 'bg-kaziranga-50/70 dark:bg-kaziranga-900/30'
                      : 'hover:bg-kaziranga-50/40 dark:hover:bg-kaziranga-900/20 opacity-80'
                  }`}
                >
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-kaziranga-950 dark:text-white truncate">
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-kaziranga-400 dark:text-kaziranga-500 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1 leading-snug">
                      {item.message}
                    </p>
                    {item.linkUrl && (
                      <Link
                        href={item.linkUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-kaziranga-700 dark:text-kaziranga-300 hover:underline mt-2"
                      >
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-kaziranga-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-kaziranga-100 dark:border-kaziranga-900 bg-kaziranga-50/50 dark:bg-kaziranga-900/40 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-kaziranga-800 dark:text-kaziranga-300 hover:underline"
            >
              View Notification History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
