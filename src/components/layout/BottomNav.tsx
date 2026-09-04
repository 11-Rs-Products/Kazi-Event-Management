'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Ticket, User, Shield, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils/cn';

interface TabItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Extra path prefixes that should also light this tab. */
  match?: string[];
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const items: TabItem[] = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/events', icon: Calendar, match: ['/events'] },
    { label: 'Tickets', href: '/my-registrations', icon: Ticket },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  if (isAdmin) items.push({ label: 'Admin', href: '/admin/dashboard', icon: Shield, match: ['/admin'] });
  if (isSuperAdmin)
    items.push({ label: 'Super', href: '/super-admin/dashboard', icon: Crown, match: ['/super-admin'] });

  const isTabActive = (item: TabItem) =>
    pathname === item.href || (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 ed-stage-blur backdrop-blur-xl
        border-t border-white/[0.07]
        pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {items.map((item) => {
          const active = isTabActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 min-w-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors',
                  active
                    ? 'text-[rgb(var(--accent-vivid))]'
                    : 'text-white/45 hover:text-white/80'
                )}
              >
                <span
                  className={cn(
                    'absolute -top-1.5 h-[2px] rounded-full bg-[rgb(var(--accent-vivid))] transition-all duration-300 ease-editorial',
                    active ? 'w-7 opacity-100' : 'w-0 opacity-0'
                  )}
                  aria-hidden
                />
                <Icon className={cn('w-5 h-5', active ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
                <span
                  className={cn(
                    'text-[0.625rem] leading-none tracking-tight truncate max-w-full',
                    active ? 'font-bold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
