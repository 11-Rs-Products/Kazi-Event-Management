'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '../branding/KazirangaLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import { LogOut, User as UserIcon, Shield, Crown } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === '/login' || pathname === '/access-denied' || !user) {
    return null;
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <Badge variant="gold" size="sm">
            <Crown className="w-3 h-3 text-gold-500" />
            <span>Super Admin</span>
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge variant="blue" size="sm">
            <Shield className="w-3 h-3 text-sky-500" />
            <span>Admin</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="emerald" size="sm">
            <span>Kaziranga Student</span>
          </Badge>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-kaziranga-950/90 backdrop-blur-md border-b border-kaziranga-100 dark:border-kaziranga-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center hover:opacity-95 transition-opacity">
          <KazirangaLogo size="md" />
        </Link>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 border-r border-kaziranga-200 dark:border-kaziranga-800 pr-3">
            {getRoleBadge(user.role)}
          </div>

          <NotificationBell />

          <div className="flex items-center gap-2.5 pl-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-kaziranga-100 dark:hover:bg-kaziranga-900/60 transition-colors"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full ring-2 ring-kaziranga-600/30 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-kaziranga-800 text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="hidden md:inline font-semibold text-xs text-kaziranga-900 dark:text-kaziranga-100 max-w-[120px] truncate">
                {user.name}
              </span>
            </Link>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-kaziranga-600 dark:text-kaziranga-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
