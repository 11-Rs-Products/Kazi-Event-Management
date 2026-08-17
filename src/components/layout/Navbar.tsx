'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '../branding/KazirangaLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  LogOut,
  Crown,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Ticket,
  User,
  Bell,
  FileSpreadsheet,
  Users,
  History,
  PlusCircle,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === '/login' || pathname === '/access-denied' || !user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <Badge variant="gold" size="sm">
            <Crown className="w-3 h-3" />
            <span>Super Admin</span>
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge variant="blue" size="sm">
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="kaziranga" size="sm">
            <span>🦏 RHINO</span>
          </Badge>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-kaziranga-800 dark:bg-kaziranga-950 border-b border-kaziranga-700/50 dark:border-kaziranga-800 transition-colors">
        <div className="max-w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-cream-300 hover:bg-kaziranga-700/60 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand */}
            <Link href="/dashboard" className="flex items-center hover:opacity-95 transition-opacity">
              <KazirangaLogo size="md" />
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 border-r border-kaziranga-700/50 dark:border-kaziranga-700 pr-3">
              {getRoleBadge(user.role)}
            </div>

            <ThemeToggle />

            <NotificationBell />

            <div className="flex items-center gap-2 pl-1">
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-kaziranga-700/50 dark:hover:bg-kaziranga-800/60 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-gold-500/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cream-300 text-kaziranga-800 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="hidden md:inline font-semibold text-xs text-cream-200 max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-cream-400 hover:text-rhino-red-light hover:bg-rhino-red/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-sm h-full bg-kaziranga-900 border-r border-kaziranga-800 text-cream-100 flex flex-col shadow-2xl overflow-y-auto p-5"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-kaziranga-800">
                <KazirangaLogo size="sm" />
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-cream-400 hover:text-white hover:bg-kaziranga-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* User Profile Card in Drawer */}
              <div className="py-4 border-b border-kaziranga-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-9 h-9 rounded-full ring-2 ring-gold-500/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-cream-300 text-kaziranga-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-display font-bold text-cream-100 truncate">{user.name}</div>
                    <div className="text-[10px] text-cream-400/60 font-mono truncate">{user.email}</div>
                  </div>
                </div>
                <div>{getRoleBadge(user.role)}</div>
              </div>

              {/* Navigation Sections */}
              <div className="py-4 space-y-5 flex-1">
                {/* Student Section */}
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-cream-400/60 font-display">
                    Student Portal
                  </div>
                  {[
                    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                    { label: 'Events Arena', href: '/events', icon: Calendar },
                    { label: 'My Registrations', href: '/my-registrations', icon: Ticket },
                    { label: 'My Profile', href: '/profile', icon: User },
                    { label: 'Notifications', href: '/notifications', icon: Bell },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        pathname === item.href
                          ? 'bg-cream-300/20 text-cream-50 font-bold'
                          : 'text-cream-300/80 hover:bg-kaziranga-800 hover:text-cream-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4 text-gold-400" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Admin Section */}
                {isAdmin && (
                  <div className="space-y-1 pt-3 border-t border-kaziranga-800">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-cream-400/60 font-display">
                      Admin Suite
                    </div>
                    {[
                      { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
                      { label: 'Manage Events', href: '/admin/events', icon: Calendar },
                      { label: 'All Registrations', href: '/admin/registrations', icon: Ticket },
                      { label: 'Create New Event', href: '/admin/events/new', icon: PlusCircle },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          pathname === item.href
                            ? 'bg-cream-300/20 text-cream-50 font-bold'
                            : 'text-cream-300/80 hover:bg-kaziranga-800 hover:text-cream-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4 text-sky-400" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Super Admin Section */}
                {isSuperAdmin && (
                  <div className="space-y-1 pt-3 border-t border-gold-500/20">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-gold-400 font-display">
                      Super Admin Suite
                    </div>
                    {[
                      { label: 'Super Admin Overview', href: '/super-admin/dashboard', icon: Shield },
                      { label: 'Allowed Users Registry', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
                      { label: 'Role & Admin Manager', href: '/super-admin/roles', icon: Users },
                      { label: 'Security Audit Logs', href: '/super-admin/audit-logs', icon: History },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          pathname === item.href
                            ? 'bg-gold-500/20 text-gold-300 font-bold'
                            : 'text-cream-300/80 hover:bg-gold-500/10 hover:text-gold-300'
                        }`}
                      >
                        <item.icon className="w-4 h-4 text-gold-400" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-kaziranga-800 space-y-3">
                {/* Social Links */}
                <div className="flex items-center justify-center gap-3 text-cream-300">
                  <a
                    href="https://www.instagram.com/kaziranga_iitm/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-kaziranga-800/80 hover:text-pink-400 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/kaziranga-iitm/posts/?feedView=all"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-kaziranga-800/80 hover:text-blue-400 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/@KazirangaHouse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-kaziranga-800/80 hover:text-red-400 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rhino-red-light bg-rhino-red/10 hover:bg-rhino-red/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
