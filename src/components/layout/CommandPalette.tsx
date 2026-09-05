'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  ClipboardList,
  User,
  Bell,
  Shield,
  FileSpreadsheet,
  Users,
  History,
  PlusCircle,
  Sun,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { cn } from '@/lib/utils/cn';
import { EASE_EDITORIAL } from '../ui/Motion';

interface CommandItem {
  id: string;
  label: string;
  category: 'Navigation' | 'Admin Suite' | 'Super Admin' | 'Quick Actions' | 'Competitions';
  icon: React.ElementType;
  hint?: string;
  onSelect: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('kazi-theme', next ? 'dark' : 'light');
    onClose();
  };

  const commands: CommandItem[] = useMemo(() => {
    if (!user) return [];

    const items: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dash',
        label: 'Dashboard',
        category: 'Navigation',
        icon: LayoutDashboard,
        hint: 'Home & stats',
        onSelect: () => {
          router.push('/dashboard');
          onClose();
        },
        keywords: ['home', 'main', 'overview'],
      },
      {
        id: 'nav-events',
        label: 'Events & Festivals Arena',
        category: 'Navigation',
        icon: Calendar,
        hint: 'All house competitions',
        onSelect: () => {
          router.push('/events');
          onClose();
        },
        keywords: ['competitions', 'hackathons', 'tournaments', 'sports'],
      },
      {
        id: 'nav-regs',
        label: 'My Registrations',
        category: 'Navigation',
        icon: CalendarCheck,
        hint: 'View entries & deliverables',
        onSelect: () => {
          router.push('/my-registrations');
          onClose();
        },
        keywords: ['registrations', 'submissions', 'schedule', 'events'],
      },
      {
        id: 'nav-profile',
        label: 'Profile & Academic Details',
        category: 'Navigation',
        icon: User,
        hint: 'Account settings',
        onSelect: () => {
          router.push('/profile');
          onClose();
        },
        keywords: ['account', 'phone', 'whatsapp', 'region', 'level'],
      },
      {
        id: 'nav-notifs',
        label: 'Notifications',
        category: 'Navigation',
        icon: Bell,
        hint: 'Activity & team invites',
        onSelect: () => {
          router.push('/notifications');
          onClose();
        },
        keywords: ['alerts', 'messages', 'updates'],
      },
    ];

    // Admin commands
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      items.push(
        {
          id: 'admin-dash',
          label: 'Admin Operations Dashboard',
          category: 'Admin Suite',
          icon: LayoutDashboard,
          onSelect: () => {
            router.push('/admin/dashboard');
            onClose();
          },
          keywords: ['control', 'management'],
        },
        {
          id: 'admin-events',
          label: 'Manage House Events',
          category: 'Admin Suite',
          icon: Calendar,
          onSelect: () => {
            router.push('/admin/events');
            onClose();
          },
        },
        {
          id: 'admin-regs',
          label: 'All Participant Registrations',
          category: 'Admin Suite',
          icon: ClipboardList,
          onSelect: () => {
            router.push('/admin/registrations');
            onClose();
          },
          keywords: ['export', 'csv', 'roster'],
        },
        {
          id: 'admin-new-event',
          label: 'Create New Event',
          category: 'Quick Actions',
          icon: PlusCircle,
          hint: 'Draft a competition',
          onSelect: () => {
            router.push('/admin/events/new');
            onClose();
          },
        }
      );
    }

    // Super Admin commands
    if (user.role === 'SUPER_ADMIN') {
      items.push(
        {
          id: 'super-dash',
          label: 'Super Admin Command Centre',
          category: 'Super Admin',
          icon: Shield,
          onSelect: () => {
            router.push('/super-admin/dashboard');
            onClose();
          },
        },
        {
          id: 'super-allowed',
          label: 'Allowed Users Registry',
          category: 'Super Admin',
          icon: FileSpreadsheet,
          onSelect: () => {
            router.push('/super-admin/allowed-users');
            onClose();
          },
        },
        {
          id: 'super-members',
          label: 'House Members Directory & Roles',
          category: 'Super Admin',
          icon: Users,
          onSelect: () => {
            router.push('/super-admin/roles');
            onClose();
          },
        },
        {
          id: 'super-logs',
          label: 'Security Audit Logs',
          category: 'Super Admin',
          icon: History,
          onSelect: () => {
            router.push('/super-admin/audit-logs');
            onClose();
          },
        }
      );
    }

    // Quick Actions
    items.push(
      {
        id: 'action-theme',
        label: 'Switch Color Theme',
        category: 'Quick Actions',
        icon: Sun,
        hint: 'Toggle dark / light mode',
        onSelect: toggleTheme,
        keywords: ['dark', 'light', 'mode'],
      },
      {
        id: 'action-logout',
        label: 'Sign Out',
        category: 'Quick Actions',
        icon: LogOut,
        hint: 'Log out of arena',
        onSelect: () => {
          onClose();
          logout();
        },
        keywords: ['exit', 'leave'],
      }
    );

    // Dynamic Mock/Live Events for quick jump
    if (isMockMode) {
      const mockEvents = mockStore.getEvents();
      mockEvents.slice(0, 8).forEach((ev) => {
        items.push({
          id: `event-${ev.id}`,
          label: ev.name,
          category: 'Competitions',
          icon: Sparkles,
          hint: Array.isArray(ev.category) ? ev.category.join(' · ') : ev.category,
          onSelect: () => {
            router.push(`/events/${ev.mainEventId || 'communityDayAug26'}/subevents/${ev.slug || ev.id}`);
            onClose();
          },
          keywords: [ev.name, ...(Array.isArray(ev.category) ? ev.category : [ev.category || ''])],
        });
      });
    }

    return items;
  }, [user, router]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(q);
      const matchCat = cmd.category.toLowerCase().includes(q);
      const matchKeywords = (cmd.keywords || []).some((kw) => kw.toLowerCase().includes(q));
      return matchLabel || matchCat || matchKeywords;
    });
  }, [commands, query]);

  // Handle keyboard navigation inside command list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Ensure active element stays in view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-selected="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stage/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.25, ease: EASE_EDITORIAL }}
              role="dialog"
              aria-modal="true"
              aria-label="Command Palette"
              className="relative w-full max-w-xl rounded-2xl bg-surface-overlay border border-hairline shadow-e-4 overflow-hidden z-10 flex flex-col"
            >
              {/* Search input header */}
              <div className="relative flex items-center px-4 py-3.5 border-b border-hairline">
                <Search className="w-5 h-5 text-ink-faint shrink-0 mr-3" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type a command or search events..."
                  className="w-full bg-transparent text-ink placeholder:text-ink-faint text-body focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-mono bg-surface-sunken border border-hairline text-ink-muted shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Commands list */}
              <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-1">
                {filteredCommands.length === 0 ? (
                  <div className="py-8 text-center text-caption text-ink-faint">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        data-selected={isSelected}
                        onClick={cmd.onSelect}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors',
                          isSelected
                            ? 'bg-brand text-brand-contrast dark:bg-brand/20 dark:text-brand'
                            : 'text-ink hover:bg-surface-sunken'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0',
                              isSelected ? 'text-brand-contrast dark:text-brand' : 'text-ink-faint'
                            )}
                          />
                          <span className="text-caption font-semibold truncate">
                            {cmd.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {cmd.hint && (
                            <span
                              className={cn(
                                'text-micro truncate max-w-[140px]',
                                isSelected ? 'text-brand-contrast/80 dark:text-brand/80' : 'text-ink-faint'
                              )}
                            >
                              {cmd.hint}
                            </span>
                          )}
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[0.625rem] font-display font-bold uppercase tracking-wider',
                              isSelected
                                ? 'bg-black/20 text-brand-contrast dark:bg-brand/30 dark:text-brand'
                                : 'bg-surface-sunken text-ink-faint'
                            )}
                          >
                            {cmd.category}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer tip */}
              <div className="px-4 py-2.5 bg-surface-sunken border-t border-hairline flex items-center justify-between text-micro text-ink-faint">
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="font-mono font-bold">↑↓</kbd> navigate
                  </span>
                  <span>
                    <kbd className="font-mono font-bold">↵</kbd> select
                  </span>
                </div>
                <span>Kaziranga House Arena</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
