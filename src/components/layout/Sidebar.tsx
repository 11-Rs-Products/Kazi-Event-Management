'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  User,
  Bell,
  Users,
  Shield,
  FileSpreadsheet,
  History,
  PlusCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isUser = user.role === 'USER';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const userItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'My Registrations', href: '/my-registrations', icon: Ticket },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const adminItems = [
    { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Events', href: '/admin/events', icon: Calendar },
    { label: 'All Registrations', href: '/admin/registrations', icon: Ticket },
  ];

  const superAdminItems = [
    { label: 'Super Admin', href: '/super-admin/dashboard', icon: Shield },
    { label: 'Allowed Users', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
    { label: 'User Roles', href: '/super-admin/roles', icon: Users },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: History },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-kaziranga-950 border-r border-kaziranga-100 dark:border-kaziranga-900/60 p-4 space-y-6 min-h-[calc(100vh-4rem)]">
      {/* Student Nav Section */}
      <div className="space-y-1">
        <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-kaziranga-400 dark:text-kaziranga-500 mb-2">
          Student Portal
        </h4>
        {userItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                isActive
                  ? 'bg-kaziranga-800 text-white shadow-md shadow-kaziranga-900/20 dark:bg-kaziranga-700'
                  : 'text-kaziranga-700 dark:text-kaziranga-300 hover:bg-kaziranga-100/70 dark:hover:bg-kaziranga-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Nav Section */}
      {isAdmin && (
        <div className="space-y-1 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
          <div className="flex items-center justify-between px-3 mb-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-kaziranga-400 dark:text-kaziranga-500">
              Admin Suite
            </h4>
            <Link
              href="/admin/events/new"
              className="p-1 rounded-md text-kaziranga-700 hover:bg-kaziranga-100 dark:text-kaziranga-300 dark:hover:bg-kaziranga-900"
              title="Create New Event"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </Link>
          </div>
          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-kaziranga-700 text-white shadow-md shadow-kaziranga-900/20'
                    : 'text-kaziranga-700 dark:text-kaziranga-300 hover:bg-kaziranga-100/70 dark:hover:bg-kaziranga-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Super Admin Nav Section */}
      {isSuperAdmin && (
        <div className="space-y-1 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
          <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 mb-2">
            Super Admin Controls
          </h4>
          {superAdminItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-kaziranga-950 font-bold shadow-md shadow-gold-500/20'
                    : 'text-kaziranga-700 dark:text-kaziranga-300 hover:bg-kaziranga-100/70 dark:hover:bg-kaziranga-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
};
