'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SOCIAL_LINKS, type NavSection } from './navConfig';

const SOCIAL_ICONS = { Instagram, LinkedIn: Linkedin, YouTube: Youtube } as const;

export const NavLink: React.FC<{
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  accent?: boolean;
  onNavigate?: () => void;
}> = ({ href, label, icon: Icon, isActive, accent = false, onNavigate }) => (
  <Link
    href={href}
    onClick={onNavigate}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'group relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl',
      'text-caption font-semibold transition-colors duration-200',
      'transition-[background-color,color,box-shadow] duration-200 ease-editorial',
      isActive
        ? accent
          ? 'bg-[rgb(var(--accent-vivid))]/[0.14] text-[rgb(var(--accent-vivid))] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]'
          : 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
        : 'text-white/55 hover:text-white hover:bg-white/[0.055]'
    )}
  >
    {/* Active marker — a gold rule against the left edge. */}
    <span
      className={cn(
        'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ease-editorial',
        isActive
          ? 'h-5 bg-[rgb(var(--accent-vivid))] opacity-100 shadow-[0_0_10px_rgb(var(--accent-vivid)/0.7)]'
          : 'h-0 bg-transparent opacity-0'
      )}
      aria-hidden
    />
    <Icon
      className={cn(
        'w-[18px] h-[18px] shrink-0 transition-colors',
        isActive
          ? accent
            ? 'text-[rgb(var(--accent-vivid))]'
            : 'text-[rgb(var(--accent-vivid))]'
          : 'text-white/40 group-hover:text-white/70'
      )}
    />
    <span className="truncate">{label}</span>
  </Link>
);

export const NavSectionBlock: React.FC<{
  section: NavSection;
  pathname: string;
  onNavigate?: () => void;
  isFirst?: boolean;
}> = ({ section, pathname, onNavigate, isFirst = false }) => (
  <div className={cn('space-y-1', !isFirst && 'pt-5 mt-5 border-t border-white/[0.07]')}>
    <div className="flex items-center justify-between gap-2 px-4 pb-2">
      <h4
        className={cn(
          'text-eyebrow uppercase font-display',
          section.accent ? 'text-[rgb(var(--accent-vivid))]/75' : 'text-white/35'
        )}
      >
        {section.label}
      </h4>
      {section.action && (
        <Link
          href={section.action.href}
          onClick={onNavigate}
          title={section.action.label}
          aria-label={section.action.label}
          className="p-1 rounded-lg text-white/40 hover:text-[rgb(var(--accent-vivid))] hover:bg-white/10 transition-colors"
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
        onNavigate={onNavigate}
      />
    ))}
  </div>
);

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
            'p-2 rounded-lg text-white/40 transition-colors hover:bg-white/10',
            social.hover
          )}
        >
          <Icon className="w-[17px] h-[17px]" />
        </a>
      );
    })}
  </div>
);
