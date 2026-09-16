'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SOCIAL_LINKS, type NavSection } from './navConfig';
import { useNotifications } from '@/context/NotificationContext';

const SOCIAL_ICONS = { Instagram, LinkedIn: Linkedin, YouTube: Youtube } as const;

export const NavLink: React.FC<{
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  accent?: boolean;
  badge?: number;
  onNavigate?: () => void;
}> = ({ href, label, icon: Icon, isActive, accent = false, badge, onNavigate }) => (
  <Link
    href={href}
    onClick={onNavigate}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-display select-none',
      'text-caption transition-all duration-100',
      isActive
        ? 'bg-[#FFE873] text-black font-black border-2 border-black shadow-[2px_2px_0px_#121212] dark:border-white dark:shadow-[2px_2px_0px_#FFFFFF]'
        : 'text-ink font-bold hover:bg-black/5 dark:hover:bg-white/10 hover:translate-x-0.5'
    )}
  >
    <Icon
      className={cn(
        'w-[18px] h-[18px] shrink-0 transition-colors stroke-[2.25]',
        isActive
          ? 'text-black'
          : 'text-ink-muted group-hover:text-ink'
      )}
    />
    <span className="truncate flex-1">{label}</span>
    {typeof badge === 'number' && badge > 0 && (
      <span
        aria-label={`${badge} unread notifications`}
        className={cn(
          'ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black rounded-full border border-black shadow-[1px_1px_0px_#121212] tabular-nums',
          isActive
            ? 'bg-black text-white'
            : 'bg-[#5EEAD4] text-black'
        )}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </Link>
);

export const NavSectionBlock: React.FC<{
  section: NavSection;
  pathname: string;
  onNavigate?: () => void;
  isFirst?: boolean;
}> = ({ section, pathname, onNavigate, isFirst = false }) => {
  const { unreadCount } = useNotifications();

  return (
    <div className={cn('space-y-1', !isFirst && 'pt-3 mt-3 border-t-2 border-black dark:border-white')}>
      <div className="flex items-center justify-between gap-2 px-3.5 pb-1">
        <h4
          className="text-eyebrow uppercase font-display font-black text-ink-muted tracking-wider"
        >
          {section.label}
        </h4>
        {section.action && (
          <Link
            href={section.action.href}
            onClick={onNavigate}
            title={section.action.label}
            aria-label={section.action.label}
            className="p-1 rounded-lg text-ink-faint hover:text-brand hover:bg-surface-sunken dark:text-white/40 dark:hover:text-[rgb(var(--accent-vivid))] dark:hover:bg-white/10 transition-colors"
          >
            <section.action.icon className="w-4 h-4" />
          </Link>
        )}
      </div>
      {section.items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={pathname === item.href}
          accent={section.accent}
          badge={item.href === '/notifications' && unreadCount > 0 ? unreadCount : undefined}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
};

export const SocialRow: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-1.5', className)}>
    {SOCIAL_LINKS.map((social) => {
      const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
      return (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Kaziranga House on ${social.label}`}
          className={cn(
            'p-2 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10 transition-colors',
            social.hover
          )}
        >
          <Icon className="w-[17px] h-[17px]" />
        </a>
      );
    })}
  </div>
);
