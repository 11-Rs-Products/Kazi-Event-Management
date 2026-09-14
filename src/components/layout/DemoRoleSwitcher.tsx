'use client';

import React from 'react';
import { Shield, User, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isMockMode } from '@/lib/firebase/config';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils/cn';

const ROLES: { role: UserRole; label: string; icon: React.ElementType }[] = [
  { role: 'USER', label: 'Student', icon: User },
  { role: 'ADMIN', label: 'Admin', icon: Shield },
  { role: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown },
];

/** Only rendered in mock mode, so real deployments never show this bar. */
export const DemoRoleSwitcher: React.FC = () => {
  const { user, switchDemoRole } = useAuth();

  if (!isMockMode || !user) return null;

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#0c0c0c] border-b-2 border-black dark:border-white px-[var(--gutter)] py-2 z-50">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="flex items-center gap-2 text-micro text-ink-muted dark:text-white/70 font-semibold">
          <span className="relative flex w-2 h-2 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-signal-live animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-signal-live border border-black" />
          </span>
          <span className="font-display font-black text-ink dark:text-white uppercase tracking-wider">Demo mode</span>
          <span className="hidden sm:inline font-medium">— switch role to test access boundaries</span>
        </p>

        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar"
          role="group"
          aria-label="Demo role"
        >
          {ROLES.map(({ role, label, icon: Icon }) => {
            const isActive = user.role === role;
            return (
              <button
                key={role}
                onClick={() => switchDemoRole(role)}
                aria-pressed={isActive}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 px-3 h-7 rounded-xl',
                  'text-micro font-display font-black uppercase tracking-wider transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
                  'border-2 border-black dark:border-white shadow-[1.5px_1.5px_0px_#121212] dark:shadow-[1.5px_1.5px_0px_#FFFFFF]',
                  isActive
                    ? 'bg-[#FFE873] text-black'
                    : 'bg-surface-raised text-ink hover:bg-[#FFE873]/30'
                )}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
