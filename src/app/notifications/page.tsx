'use client';

import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Motion';
import { cn } from '@/lib/utils/cn';
import {
  BellOff,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Crown,
  ArrowUpRight,
  Users,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Bell,
  Layers,
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { FilterToolbar } from '@/components/ui/FilterToolbar';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatDate';

type ReadStatusFilter = 'ALL' | 'UNREAD' | 'READ';
type CategoryFilter = 'ALL' | 'EVENT' | 'TEAM' | 'REGISTRATION' | 'SYSTEM';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  /** Icon plus tinted disc it sits in, keyed by notification type. */
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

  // Counts
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const readCount = notifications.length - unreadCount;

  const eventCount = useMemo(() => notifications.filter((n) => n.type === 'EVENT').length, [notifications]);
  const teamCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.type === 'TEAM_INVITE' ||
          n.title.toLowerCase().includes('team') ||
          n.title.toLowerCase().includes('teammate')
      ).length,
    [notifications]
  );
  const regCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.title.toLowerCase().includes('registration') ||
          n.title.toLowerCase().includes('deliverable')
      ).length,
    [notifications]
  );
  const systemCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.type === 'ROLE_CHANGE' ||
          n.title.toLowerCase().includes('access request') ||
          n.type === 'WARNING' ||
          n.type === 'INFO'
      ).length,
    [notifications]
  );

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inMessage = item.message.toLowerCase().includes(q);
        if (!inTitle && !inMessage) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'UNREAD' && item.read) return false;
      if (statusFilter === 'READ' && !item.read) return false;

      // 3. Category Filter
      if (categoryFilter === 'EVENT' && item.type !== 'EVENT') return false;
      if (categoryFilter === 'TEAM') {
        const isTeam =
          item.type === 'TEAM_INVITE' ||
          item.title.toLowerCase().includes('team') ||
          item.title.toLowerCase().includes('teammate');
        if (!isTeam) return false;
      }
      if (categoryFilter === 'REGISTRATION') {
        const isReg =
          item.title.toLowerCase().includes('registration') ||
          item.title.toLowerCase().includes('deliverable');
        if (!isReg) return false;
      }
      if (categoryFilter === 'SYSTEM') {
        const isSystem =
          item.type === 'ROLE_CHANGE' ||
          item.title.toLowerCase().includes('access request') ||
          (item.type === 'WARNING' && !item.title.toLowerCase().includes('team')) ||
          item.type === 'INFO';
        if (!isSystem) return false;
      }

      return true;
    });
  }, [notifications, searchQuery, statusFilter, categoryFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  return (
    <div className="space-y-7 max-w-3xl mx-auto pb-12">
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

      {/* Search & Filter Controls */}
      {notifications.length > 0 && (
        <FilterToolbar
          variant="bare"
          totalCount={notifications.length}
          filteredCount={filteredNotifications.length}
          countLabel="notifications"
          filterTitle="Filter notifications"
          filterCount={
            (statusFilter !== 'ALL' ? 1 : 0) +
            (categoryFilter !== 'ALL' ? 1 : 0)
          }
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          search={
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search notifications by title, event, teammate or keyword…"
              aria-label="Search notifications"
            />
          }
          filters={
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                  Read Status
                </label>
                <FilterSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val as ReadStatusFilter)}
                  options={[
                    { value: 'ALL', label: `All Notifications (${notifications.length})` },
                    { value: 'UNREAD', label: `Unread (${unreadCount})` },
                    { value: 'READ', label: `Read (${readCount})` },
                  ]}
                  icon={<Bell className="w-4 h-4" />}
                  ariaLabel="Filter notifications by read status"
                  containerClassName="w-full"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-hairline">
                <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                  Notification Category
                </label>
                <FilterSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val as CategoryFilter)}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    { value: 'EVENT', label: `Events (${eventCount})` },
                    { value: 'TEAM', label: `Teams (${teamCount})` },
                    { value: 'REGISTRATION', label: `Registrations (${regCount})` },
                    ...(systemCount > 0
                      ? [{ value: 'SYSTEM', label: `Alerts & Roles (${systemCount})` }]
                      : []),
                  ]}
                  icon={<Layers className="w-4 h-4" />}
                  ariaLabel="Filter notifications by category"
                  containerClassName="w-full"
                />
              </div>
            </div>
          }
        />
      )}

      {/* Notifications List / Empty States */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="All quiet in the arena"
          description="Notifications about your events, team invitations, and registrations will appear here."
        />
      ) : filteredNotifications.length === 0 ? (
        <div className="py-12 px-6 rounded-2xl bg-surface-raised border border-hairline dark:border-white/10 text-center space-y-3">
          <div className="grid place-items-center w-12 h-12 rounded-2xl bg-surface-sunken dark:bg-white/5 mx-auto text-ink-muted dark:text-white/60">
            <SlidersHorizontal className="w-5 h-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-title-sm text-ink dark:text-white">
              No matching notifications
            </h3>
            <p className="text-caption text-ink-muted dark:text-white/60 max-w-sm mx-auto">
              No notifications match your current search query or filter selection.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            Clear search & filters
          </Button>
        </div>
      ) : (
        <Card elevation={1} className="divide-y divide-hairline dark:divide-white/10 overflow-hidden">
          {filteredNotifications.map((item, i) => {
            const { Icon, tone } = getIconMeta(item.type);
            return (
              <Reveal key={item.id} delay={Math.min(i * 0.03, 0.25)}>
                <div
                  className={cn(
                    'relative p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors',
                    !item.read && 'bg-brand-soft/30 dark:bg-brand-soft/10'
                  )}
                >
                  <span className={cn('grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0', tone)} aria-hidden>
                    <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </span>

                  <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display font-bold text-caption sm:text-title-sm text-ink dark:text-white flex items-center gap-2 min-w-0">
                        <span className="truncate">{item.title}</span>
                        {!item.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-brand dark:bg-[rgb(var(--accent-vivid))] shrink-0"
                            aria-label="Unread"
                          />
                        )}
                      </h3>
                      <time className="text-micro text-ink-faint dark:text-white/40 shrink-0 whitespace-nowrap nums">
                        {formatDate(item.createdAt)}
                      </time>
                    </div>

                    <p className="text-caption text-ink-muted dark:text-white/70 leading-relaxed">
                      {renderFormattedMessage(item.message)}
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                      {item.linkUrl && (
                        <Link
                          href={item.linkUrl}
                          onClick={() => markAsRead(item.id)}
                          className="relative z-10 inline-flex items-center gap-1 text-caption font-display font-bold text-brand dark:text-[rgb(var(--accent-vivid))] hover:underline underline-offset-4"
                        >
                          View details
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                        </Link>
                      )}
                      {!item.read && (
                        /* Stretched button to easily click to mark read */
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          className="text-caption font-display font-semibold text-ink-faint hover:text-ink dark:text-white/40 dark:hover:text-white transition-colors
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

