'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Crown, Shield, Menu, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '../branding/KazirangaLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils/cn';
import { getNavSections } from './navConfig';
import { NavSectionBlock, SocialRow } from './NavList';
import { EASE_EDITORIAL } from '../ui/Motion';

const roleBadge = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <Badge tone="accent" size="sm">
          <Crown className="w-3 h-3" aria-hidden />
          Super Admin
        </Badge>
      );
    case 'ADMIN':
      return (
        <Badge tone="info" size="sm">
          <Shield className="w-3 h-3" aria-hidden />
          Admin
        </Badge>
      );
    default:
      return (
        <Badge tone="neutral" size="sm" className="bg-white/10 text-white/70 border-white/15">
          Member
        </Badge>
      );
  }
};

const Avatar: React.FC<{ src?: string; name: string; className?: string }> = ({
  src,
  name,
  className,
}) =>
  src ? (
    <img
      src={src}
      alt=""
      className={cn(
        'rounded-full object-cover ring-1 ring-[rgb(var(--accent-vivid))]/40',
        className
      )}
    />
  ) : (
    <span
      className={cn(
        'grid place-items-center rounded-full bg-[rgb(var(--accent-vivid))] text-accent-contrast font-display font-bold text-caption',
        className
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (pathname === '/login' || pathname === '/access-denied' || !user) return null;

  const sections = getNavSections(user.role);

  return (
    <>
      <header
        className="sticky top-0 z-40 ed-chrome border-b border-white/[0.07] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]
          h-[var(--navbar-height)] flex items-center"
      >
        <div className="w-full px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              href="/dashboard"
              className="flex items-center rounded-xl transition-opacity hover:opacity-90"
              aria-label="Kaziranga House — go to dashboard"
            >
              <KazirangaLogo size="sm" variant="full" className="hidden sm:inline-flex" />
              <KazirangaLogo size="sm" variant="iconOnly" className="sm:hidden" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden md:block mr-1">{roleBadge(user.role)}</span>

            <ThemeToggle />
            <NotificationBell />

            <span className="hidden sm:block w-px h-6 bg-white/10 mx-1" aria-hidden />

            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-1 pr-1 sm:pr-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Avatar src={user.avatarUrl} name={user.name} className="w-8 h-8" />
              <span className="hidden lg:block text-left min-w-0">
                <span className="block text-caption font-semibold text-white truncate max-w-[140px] leading-tight">
                  {user.name}
                </span>
                <span className="block text-[0.625rem] text-white/40 truncate max-w-[140px] leading-tight">
                  {user.email}
                </span>
              </span>
            </Link>

            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-xl text-white/50 hover:text-signal-danger hover:bg-signal-danger/10 transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-stage/75 backdrop-blur-md"
              aria-hidden
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.34, ease: EASE_EDITORIAL }}
              className="relative w-[86%] max-w-[320px] h-full ed-stage
                border-r border-white/10 flex flex-col shadow-e-4"
            >
              <div className="shrink-0 flex items-center justify-between px-4 h-[var(--navbar-height)] border-b border-white/[0.07]">
                <KazirangaLogo size="sm" variant="compact" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-white/[0.07]">
                <Avatar src={user.avatarUrl} name={user.name} className="w-10 h-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-caption font-semibold text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[0.625rem] text-white/40 truncate">{user.email}</div>
                </div>
                {roleBadge(user.role)}
              </div>

              <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4" aria-label="Main navigation">
                {sections.map((section, i) => (
                  <NavSectionBlock
                    key={section.id}
                    section={section}
                    pathname={pathname}
                    isFirst={i === 0}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                ))}
              </nav>

              <div className="shrink-0 px-4 py-4 border-t border-white/[0.07] space-y-3">
                <SocialRow className="justify-center" />
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl
                    text-caption font-semibold font-display
                    text-signal-danger bg-signal-danger/10 hover:bg-signal-danger/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
