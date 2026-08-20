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
  FolderArchive,
  PlusCircle,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

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
    { label: 'Members Directory', href: '/super-admin/roles', icon: Users },
    { label: 'Archived Users', href: '/super-admin/archived-users', icon: FolderArchive },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: History },
  ];

  const NavItem = ({ item }: { item: typeof userItems[0] }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 group ${
          isActive
            ? 'bg-cream-300/20 text-cream-100 shadow-sm'
            : 'text-cream-400/80 hover:text-cream-100 hover:bg-cream-300/10'
        }`}
      >
        <div className={`relative flex items-center justify-center w-5 h-5 ${isActive ? 'text-gold-400' : ''}`}>
          {isActive && (
            <span className="absolute -left-[18px] w-[3px] h-5 bg-gold-500 rounded-r-full" />
          )}
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col justify-between w-[260px] shrink-0 bg-kaziranga-800 dark:bg-kaziranga-950 border-r border-kaziranga-700/30 dark:border-kaziranga-800 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-30">
      <div className="space-y-6">
        {/* Student Nav Section */}
        <div className="space-y-1">
          <h4 className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-cream-500/60 mb-3 font-display">
            Student Portal
          </h4>
          {userItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* Admin Nav Section */}
        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-cream-300/10">
            <div className="flex items-center justify-between px-3 mb-3">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-cream-500/60 font-display">
                Admin Suite
              </h4>
              <Link
                href="/admin/events/new"
                className="p-1.5 rounded-lg text-cream-400/70 hover:text-gold-400 hover:bg-cream-300/10 transition-colors"
                title="Create New Event"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </Link>
            </div>
            {adminItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Super Admin Nav Section */}
        {isSuperAdmin && (
          <div className="space-y-1 pt-4 border-t border-gold-500/20">
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gold-500/70 mb-3 font-display">
              Super Admin
            </h4>
            {superAdminItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 ${
                    isActive
                      ? 'bg-gold-500/20 text-gold-400 shadow-sm'
                      : 'text-cream-400/80 hover:text-gold-400 hover:bg-gold-500/10'
                  }`}
                >
                  <div className="relative flex items-center justify-center w-5 h-5">
                    {isActive && (
                      <span className="absolute -left-[18px] w-[3px] h-5 bg-gold-500 rounded-r-full" />
                    )}
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Social Links & Bottom RHINOS Branding */}
      <div className="pt-4 mt-6 border-t border-cream-300/10 px-3 space-y-3 flex flex-col items-center justify-center text-center">
        {/* Social Media Links */}
        <div className="flex items-center justify-center gap-2 text-cream-400/70">
          <a
            href="https://www.instagram.com/kaziranga_iitm/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-cream-300/5 hover:bg-cream-300/15 hover:text-pink-400 transition-all duration-200"
            title="Kaziranga House on Instagram"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://www.linkedin.com/company/kaziranga-iitm/posts/?feedView=all"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-cream-300/5 hover:bg-cream-300/15 hover:text-blue-400 transition-all duration-200"
            title="Kaziranga House on LinkedIn"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href="https://www.youtube.com/@KazirangaHouse"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-cream-300/5 hover:bg-cream-300/15 hover:text-red-400 transition-all duration-200"
            title="Kaziranga House on YouTube"
            aria-label="YouTube"
          >
            <Youtube className="w-4 h-4" />
          </a>
        </div>

        {/* Bottom RHINOS Branding */}
        <div className="flex items-center justify-center gap-2 text-cream-500/40 pt-0.5">
          <Shield className="w-4 h-4 text-gold-400/70 shrink-0" />
          <div className="text-left">
            <div className="text-[10px] font-display font-bold tracking-widest uppercase text-cream-500/50">
              RHINOS Arena
            </div>
            <div className="text-[9px] text-cream-500/30">Kaziranga House</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
