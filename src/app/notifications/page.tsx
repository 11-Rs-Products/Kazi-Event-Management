'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Motion';
import { cn } from '@/lib/utils/cn';
import { BellOff, CheckCheck, Info, CheckCircle2, AlertTriangle, Calendar, Crown, ArrowUpRight, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatDate';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  /** Icon plus the tinted disc it sits in, keyed by notification type. */
  const getIconMeta = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return { Icon: CheckCircle2, tone: 'bg-signal-live/10 text-signal-live' };
      case 'WARNING':
        return { Icon: AlertTriangle, tone: 'bg-signal-warn/10 text-signal-warn' };
      case 'EVENT':
        return { Icon: Calendar, tone: 'bg-signal-info/10 text-signal-info' };
      case 'ROLE_CHANGE':
        return { Icon: Crown, tone: 'bg-accent-soft text-accent' };
      case 'TEAM_INVITE':
        return { Icon: Users, tone: 'bg-brand-soft text-brand' };
      default:
        return { Icon: Info, tone: 'bg-surface-sunken text-ink-faint' };
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-7 max-w-3xl mx-auto">
      <SectionHeading
        eyebrow="Activity"
        title="Everything you've missed"
        description="Event publications, registration confirmations, team invitations and announcements."
        size="lg"
        as="h1"
        actions={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => markAllAsRead()}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Mark all read
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="All quiet in the arena"
          description="Notifications about your events and registrations will appear here."
        />
      ) : (
        <Card elevation={1} className="divide-y divide-hairline">
          {notifications.map((item, i) => {
            const { Icon, tone } = getIconMeta(item.type);
            return (
              <Reveal key={item.id} delay={Math.min(i * 0.04, 0.3)}>
                <div
                  className={cn(
                    'relative p-5 flex items-start gap-4 transition-colors',
                    !item.read && 'bg-brand-soft/40'
                  )}
                >
                  <span
                    className={cn(
                      'grid place-items-center w-10 h-10 rounded-xl shrink-0',
                      tone
                    )}
                    aria-hidden
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display font-bold text-title-sm text-ink flex items-center gap-2 min-w-0">
                        <span className="truncate">{item.title}</span>
                        {!item.read && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                            aria-label="Unread"
                          />
                        )}
                      </h3>
                      <time className="text-micro text-ink-faint shrink-0 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </time>
                    </div>

                    <p className="text-caption text-ink-muted leading-relaxed">
                      {renderFormattedMessage(item.message)}
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                      {item.linkUrl && (
                        <Link
                          href={item.linkUrl}
                          onClick={() => markAsRead(item.id)}
                          className="relative z-10 inline-flex items-center gap-1 text-caption font-display font-bold text-brand hover:underline underline-offset-4"
                        >
                          View details
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                        </Link>
                      )}
                      {!item.read && (
                        /* Stretched so a click anywhere on the row marks it read. */
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          className="text-caption font-display font-semibold text-ink-faint hover:text-ink transition-colors
                            before:absolute before:inset-0 before:content-[''] before:cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </Card>
      )}
    </div>
  );
}
