'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Ticket, PlusCircle } from 'lucide-react';

export const AdminNavTabs: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/admin/events', icon: Calendar },
    { label: 'Registrations', href: '/admin/registrations', icon: Ticket },
  ];

  return (
    <div className="sticky top-16 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-arena-bg dark:bg-kaziranga-950 rhinos-pattern mb-6 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-display ${
                isActive
                  ? 'bg-kaziranga-800 text-cream-100 dark:bg-kaziranga-700 dark:text-cream-100 shadow-sm border border-kaziranga-700 dark:border-kaziranga-600'
                  : 'bg-cream-200/60 dark:bg-kaziranga-900/60 text-kaziranga-700 dark:text-cream-300/70 hover:bg-cream-300/60 dark:hover:bg-kaziranga-800/80 border border-cream-400/20 dark:border-kaziranga-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
