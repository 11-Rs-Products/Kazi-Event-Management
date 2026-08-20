'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, FileSpreadsheet, Users, History, FolderArchive } from 'lucide-react';

export const SuperAdminNavTabs: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: '/super-admin/dashboard', icon: Shield },
    { label: 'Allowed Users', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
    { label: 'Members Directory', href: '/super-admin/roles', icon: Users },
    { label: 'Archived Users', href: '/super-admin/archived-users', icon: FolderArchive },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: History },
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
                  ? 'bg-gold-500/20 text-gold-500 dark:text-gold-400 border border-gold-500/40 shadow-sm'
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
