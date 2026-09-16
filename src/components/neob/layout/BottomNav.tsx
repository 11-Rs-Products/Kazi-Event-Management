'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, CalendarCheck, Shield, Crown } from 'lucide-react';
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
    { label: 'Home', href: '/neob/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/neob/events', icon: Calendar, match: ['/neob/events'] },
    { label: 'Registrations', href: '/neob/my-registrations', icon: CalendarCheck },
  ];

  if (isAdmin) items.push({ label: 'Admin', href: '/neob/admin/dashboard', icon: Shield, match: ['/neob/admin'] });
  if (isSuperAdmin)
    items.push({ label: 'Super', href: '/neob/super-admin/dashboard', icon: Crown, match: ['/neob/super-admin'] });

  const isTabActive = (item: TabItem) =>
    pathname === item.href || (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-raised
        border-t-2 border-black dark:border-white
        shadow-[0_-3px_0px_#121212] dark:shadow-[0_-3px_0px_#FFE873]
        pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around px-1 pt-2 pb-1.5">
        {items.map((item) => {
          const active = isTabActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 min-w-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-1 rounded-xl transition-all',
                  active
                    ? 'text-black'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center p-1 rounded-lg transition-all',
                    active && 'bg-[#FFE873] border-2 border-black shadow-[1.5px_1.5px_0px_#121212]'
                  )}
                >
                  <Icon className="w-5 h-5 stroke-[2.25]" />
                </div>
                <span
                  className={cn(
                    'text-[0.625rem] leading-none tracking-tight truncate max-w-full font-display',
                    active ? 'font-black' : 'font-bold'
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
