'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Calendar, Ticket, User, Shield } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const items = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'My Regs', href: '/my-registrations', icon: Ticket },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    items.push({ label: 'Admin', href: '/admin/dashboard', icon: Shield });
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-kaziranga-950/95 backdrop-blur-lg border-t border-kaziranga-100 dark:border-kaziranga-900 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-kaziranga-800 dark:text-kaziranga-300 font-bold scale-105'
                  : 'text-kaziranga-500 dark:text-kaziranga-400 hover:text-kaziranga-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
