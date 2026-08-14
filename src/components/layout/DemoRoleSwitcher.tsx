'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { isMockMode } from '@/lib/firebase/config';
import { UserRole } from '@/types';
import { Shield, User, Crown } from 'lucide-react';

export const DemoRoleSwitcher: React.FC = () => {
  const { user, switchDemoRole } = useAuth();

  if (!isMockMode || !user) return null;

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'USER', label: 'Student User', icon: <User className="w-3.5 h-3.5" /> },
    { role: 'ADMIN', label: 'Admin', icon: <Shield className="w-3.5 h-3.5" /> },
    { role: 'SUPER_ADMIN', label: 'Super Admin', icon: <Crown className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-gradient-to-r from-kaziranga-950 via-kaziranga-900 to-kaziranga-950 text-white px-4 py-2 border-b border-kaziranga-800/60 shadow-inner flex flex-wrap items-center justify-between gap-3 text-xs z-50">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
        <span className="font-semibold text-kaziranga-200">Interactive Demo Mode Active</span>
        <span className="text-kaziranga-400 hidden md:inline">| Switch role to test role boundaries:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {roles.map((r) => {
          const isActive = user.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => switchDemoRole(r.role)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isActive
                  ? 'bg-gold-500 text-kaziranga-950 shadow-sm'
                  : 'bg-kaziranga-800/80 text-kaziranga-200 hover:bg-kaziranga-700 hover:text-white'
                }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
