'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Calendar, Ticket, User, Shield, Crown } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const items: { label: string; href: string; icon: any; isGold?: boolean }[] = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'My Regs', href: '/my-registrations', icon: Ticket },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  if (isAdmin) {
    items.push({ label: 'Admin', href: '/admin/dashboard', icon: Shield });
  }

  if (isSuperAdmin) {
    items.push({ label: 'S.Admin', href: '/super-admin/dashboard', icon: Crown, isGold: true });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-kaziranga-800/95 dark:bg-kaziranga-950/95 backdrop-blur-lg border-t border-kaziranga-700/30 dark:border-kaziranga-800 px-1 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href.replace('/dashboard', '')));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all min-w-0 ${
                isActive
                  ? item.isGold
                    ? 'text-gold-400'
                    : 'text-gold-400'
                  : item.isGold
                    ? 'text-gold-500/50 hover:text-gold-400'
                    : 'text-cream-400/60 hover:text-cream-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full ${item.isGold ? 'bg-gold-400' : 'bg-gold-400'}`} />
                )}
              </div>
              <span className={`text-[9px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
