'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RhinoMascot } from '@/components/branding/RhinoMascot';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, Calendar, Crown, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'EVENT':
        return <Calendar className="w-5 h-5 text-sky-500 shrink-0" />;
      case 'ROLE_CHANGE':
        return <Crown className="w-5 h-5 text-gold-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-kaziranga-500 dark:text-cream-400/50 shrink-0" />;
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
            <span>Activity Center</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
            Event publications, registration confirmations, and announcements.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <Button variant="gold" size="sm" onClick={() => markAllAsRead()} leftIcon={<CheckCheck className="w-4 h-4" />}>
            Mark All Read
          </Button>
        )}
      </div>

      <Card className="divide-y divide-cream-400/15 dark:divide-kaziranga-800/40 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <RhinoMascot pose="sleeping" size="md" />
            <p className="text-sm text-kaziranga-500 dark:text-cream-400/50 mt-2">
              All quiet in the arena. No notifications.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 transition-colors cursor-pointer flex items-start gap-4 ${
                !item.read
                  ? 'bg-kaziranga-800/[0.03] dark:bg-kaziranga-800/20 border-l-3 border-l-kaziranga-600'
                  : 'hover:bg-cream-200/30 dark:hover:bg-kaziranga-800/10 opacity-80'
              }`}
            >
              <div className="mt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">
                    {item.title}
                  </h4>
                  <span className="text-xs text-kaziranga-400 dark:text-cream-400/40 shrink-0">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-kaziranga-700 dark:text-cream-400/70 mt-1 leading-relaxed">
                  {renderFormattedMessage(item.message)}
                </p>
                {item.linkUrl && (
                  <Link
                    href={item.linkUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-kaziranga-700 dark:text-cream-300 hover:underline mt-2"
                  >
                    <span>View details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
