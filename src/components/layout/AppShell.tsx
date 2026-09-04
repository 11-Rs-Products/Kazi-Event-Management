'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';
import { CommandPalette } from './CommandPalette';
import { PageTransition } from '../ui/Motion';

const AUTH_PAGES = ['/login', '/access-denied'];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    const handleOpenEvent = () => setIsCommandPaletteOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, []);

  if (AUTH_PAGES.includes(pathname) || !user) {
    return <div className="relative z-[1] min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="relative z-[1] min-h-screen flex flex-col">
      <DemoRoleSwitcher />
      <Navbar />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <div className="flex-1 flex w-full min-h-0">
        <Sidebar />

        {/*
          `--gutter` lets `.ed-bleed` children break out to the full content
          width for edge-to-edge imagery.
        */}
        <main
          id="main"
          className="flex-1 min-w-0
            [--gutter:1rem] sm:[--gutter:1.5rem] lg:[--gutter:2.5rem]
            px-[var(--gutter)] py-6 sm:py-8 lg:py-10
            pb-28 lg:pb-16"
        >
          {/* Keyed on pathname so each route entrance replays. */}
          <PageTransition key={pathname} className="mx-auto w-full max-w-[1400px]">
            {children}
          </PageTransition>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};
