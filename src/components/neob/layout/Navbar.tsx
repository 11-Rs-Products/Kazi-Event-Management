'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Crown, Shield, Menu, X, User as UserIcon, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
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
        <Badge tone="neutral" size="sm" className="dark:bg-white/10 dark:text-white/70 dark:border-white/15">
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
        className="sticky top-0 z-40 ed-chrome border-b-2 border-black dark:border-white
          shadow-[0_2px_0px_#121212] dark:shadow-[0_2px_0px_#FFFFFF]
          h-[var(--navbar-height)] flex items-center bg-surface-raised"
      >
        <div className="w-full px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] bg-white dark:bg-[#1C1C20] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              href="/new/dashboard"
              className="flex items-center rounded-xl transition-opacity hover:opacity-90"
              aria-label="Kaziranga House — go to dashboard"
            >
              <KazirangaLogo size="sm" variant="full" className="hidden sm:inline-flex" />
              <KazirangaLogo size="sm" variant="iconOnly" className="sm:hidden" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden md:block mr-1">{roleBadge(user.role)}</span>

            {/* Global Command Palette search trigger */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-command-palette'));
                }
              }}
              title="Search or jump to (⌘K)"
              aria-label="Search or jump to (⌘K)"
              className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-xl bg-white dark:bg-[#1C1C20] hover:bg-[#FFE873] dark:hover:bg-[#FFE873] hover:text-black dark:hover:text-black text-ink border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] text-caption font-display font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Search className="w-3.5 h-3.5 text-black dark:text-white" />
              <span className="text-micro font-bold">Search…</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.625rem] font-mono font-bold bg-[#FFE873] text-black border border-black shadow-[1px_1px_0px_#121212]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-command-palette'));
                }
              }}
              title="Search"
              aria-label="Search"
              className="sm:hidden p-2 rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] bg-white dark:bg-[#1C1C20] text-black dark:text-white hover:bg-[#FFE873] dark:hover:bg-[#FFE873] dark:hover:text-black transition-all"
            >
              <Search className="w-4 h-4" />
            </button>

            <ThemeToggle />
            <NotificationBell />

            <span className="hidden sm:block w-[2px] h-6 bg-black dark:bg-white mx-1" aria-hidden />

            {/* ── UI Switcher ── */}
            <Link
              href="/classic/dashboard"
              title="Switch to Classic UI"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-lg
                bg-[#FFE873] text-black font-display font-black text-caption
                border-2 border-black shadow-[2px_2px_0px_#121212]
                hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212]
                dark:border-white dark:shadow-[2px_2px_0px_#FFFFFF] dark:hover:shadow-[3px_3px_0px_#FFFFFF]
                active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
                transition-all duration-100 whitespace-nowrap"
            >
              ← Classic
            </Link>

            <Link
              href="/new/profile"
              className="flex items-center gap-2.5 p-1 pr-1 sm:pr-2.5 rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] bg-white dark:bg-[#1C1C20] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Avatar src={user.avatarUrl} name={user.name} className="w-7 h-7 border border-black" />
              <span className="hidden lg:block text-left min-w-0">
                <span className="block text-caption font-bold text-ink truncate max-w-[130px] leading-tight">
                  {user.name}
                </span>
                <span className="block text-[0.625rem] font-medium text-ink-faint truncate max-w-[130px] leading-tight">
                  {user.email}
                </span>
              </span>
            </Link>

            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] bg-white dark:bg-[#1C1C20] hover:bg-[#FF708F] hover:text-black transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-ink"
            >
              <LogOut className="w-4 h-4" />
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
              className="absolute inset-0 bg-ink/40 dark:bg-stage/75 backdrop-blur-md"
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
              className="relative w-[86%] max-w-[320px] h-full bg-surface-raised dark:ed-stage
                border-r border-hairline dark:border-white/10 flex flex-col shadow-e-4"
            >
              <div className="shrink-0 flex items-center justify-between px-4 h-[var(--navbar-height)] border-b border-hairline dark:border-white/[0.07]">
                <KazirangaLogo size="sm" variant="compact" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-sunken dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-hairline dark:border-white/[0.07]">
                <Avatar src={user.avatarUrl} name={user.name} className="w-10 h-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-caption font-semibold text-ink dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[0.625rem] text-ink-faint dark:text-white/40 truncate">{user.email}</div>
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

              <div className="shrink-0 px-4 py-4 border-t border-hairline dark:border-white/[0.07] space-y-3">
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
