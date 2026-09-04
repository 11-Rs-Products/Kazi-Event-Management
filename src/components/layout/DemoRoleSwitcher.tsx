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
    <div className="ed-stage border-b border-white/10 px-[var(--gutter)] py-2 z-50">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="flex items-center gap-2 text-micro text-white/60">
          <span className="relative flex w-1.5 h-1.5 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-[rgb(var(--accent-vivid))] animate-live-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-vivid))]" />
          </span>
          <span className="font-display font-semibold text-white/80">Demo mode</span>
          <span className="hidden sm:inline">— switch role to test access boundaries</span>
        </p>

        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
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
                  'shrink-0 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg',
                  'text-micro font-display font-bold transition-colors',
                  isActive
                    ? 'bg-[rgb(var(--accent-vivid))] text-accent-contrast'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                )}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
