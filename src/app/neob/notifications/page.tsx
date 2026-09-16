'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/neob/ui/Button';
import { EmptyState } from '@/components/neob/ui/EmptyState';
import { Reveal } from '@/components/neob/ui/Motion';
import { cn } from '@/lib/utils/cn';
import {
  BellOff,
  CheckCheck,
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
  KeyRound,
} from 'lucide-react';
import { SearchInput } from '@/components/neob/ui/SearchInput';
import { FilterSelect } from '@/components/neob/ui/FilterSelect';
import { FilterToolbar } from '@/components/neob/ui/FilterToolbar';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatDate';
import { NotificationItem } from '@/types';

type ReadStatusFilter = 'ALL' | 'UNREAD' | 'READ';
type CategoryFilter = 'ALL' | 'EVENT' | 'TEAM' | 'REGISTRATION' | 'SYSTEM';

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

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const renderFormattedMessage = (msg: string) => {
    const parts = msg.split(/(Super Admin|Admin|Member|User)/g);
    return parts.map((part, index) => {
      if (['Super Admin', 'Admin', 'Member', 'User'].includes(part)) {
        return (
          <span key={index} className="font-extrabold text-black dark:text-white">
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
          (n.type === 'WARNING' && !n.title.toLowerCase().includes('team')) ||
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
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_#121212] bg-[#FFE873] text-black font-display font-black text-eyebrow uppercase">
            ✦ Activity feed
          </div>
          <h1 className="font-display font-black text-display-md sm:text-display-lg text-black dark:text-white leading-tight">
            Everything you&apos;ve missed
          </h1>
          <p className="text-body font-medium text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            Event publications, registration confirmations, team invitations, access requests and announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#121212]
              bg-[#5EEAD4] hover:bg-[#4bd8c2] text-black font-display font-black text-caption
              hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Unified Search & Filter Toolbar */}
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

              <div className="space-y-1.5 pt-2 border-t-2 border-black dark:border-white">
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

      {/* Feed Content */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="All quiet in the arena"
          description="Notifications about your events, team invitations, access requests, and registrations will appear here."
        />
      ) : filteredNotifications.length === 0 ? (
        <div className="py-12 px-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border-2 border-black dark:border-white shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#FFFFFF] text-center space-y-4">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-[#FFE873] border-2 border-black shadow-[3px_3px_0px_#121212] text-black mx-auto">
            <SlidersHorizontal className="w-6 h-6 stroke-[2.5]" aria-hidden />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-black text-title text-black dark:text-white">
              No matching notifications
            </h3>
            <p className="text-caption font-medium text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              No notifications match your current search query or filter selection.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={resetFilters} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Reset search & filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((item, i) => {
            const iconMeta = getIconMeta(item.type, item.title);
            const catMeta = getCategoryMeta(item.type, item.title);
            const { Icon } = iconMeta;

            return (
              <Reveal key={item.id} delay={Math.min(i * 0.03, 0.25)}>
                <article
                  className={cn(
                    'relative rounded-2xl border-2 border-black dark:border-white shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#FFFFFF] p-5 sm:p-6 transition-all duration-150',
                    !item.read
                      ? 'bg-[#FFFBEB] dark:bg-[#222015] ring-2 ring-black dark:ring-white'
                      : 'bg-white dark:bg-[#1C1C20] hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left Icon Badge */}
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_#121212] grid place-items-center shrink-0 text-black',
                        iconMeta.bg
                      )}
                      aria-hidden
                    >
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                    </div>

                    {/* Middle Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Top Meta Line: Badge + Timestamp + Unread Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-md border-2 border-black font-display font-black text-[10px] uppercase tracking-wider shadow-[1.5px_1.5px_0px_#121212]',
                              catMeta.bg,
                              catMeta.text
                            )}
                          >
                            ✦ {catMeta.label}
                          </span>
                          {!item.read && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF708F] border-2 border-black text-black font-display font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#121212] animate-pulse">
                              ✦ New
                            </span>
                          )}
                        </div>

                        <time className="px-2.5 py-1 rounded-lg border border-black/30 dark:border-white/30 bg-black/5 dark:bg-white/10 font-mono text-[11px] font-bold text-gray-700 dark:text-gray-200 nums">
                          {formatDate(item.createdAt)}
                        </time>
                      </div>

                      {/* Title */}
                      <h2 className="font-display font-black text-title-sm sm:text-title text-black dark:text-white leading-snug break-words">
                        {item.title}
                      </h2>

                      {/* Message Box */}
                      <div className="p-3.5 rounded-xl border-2 border-black/15 dark:border-white/20 bg-white/70 dark:bg-black/40 font-medium text-body text-gray-800 dark:text-gray-100 leading-relaxed break-words">
                        {renderFormattedMessage(item.message)}
                      </div>

                      {/* Actions Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                          {item.linkUrl && (
                            <Link
                              href={item.linkUrl}
                              onClick={() => markAsRead(item.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_#121212]
                                bg-[#FFE873] hover:bg-[#FFF3A8] text-black font-display font-black text-caption
                                hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                            >
                              <span>View details</span>
                              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" aria-hidden />
                            </Link>
                          )}
                        </div>

                        {!item.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black/40 hover:border-black dark:border-white/40 dark:hover:border-white
                              bg-white dark:bg-[#2a2a2a] text-black dark:text-white font-display font-bold text-micro
                              hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
