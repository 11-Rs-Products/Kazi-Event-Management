'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';

const AUTH_PAGES = ['/login', '/access-denied'];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAuthPage = AUTH_PAGES.includes(pathname) || !user;

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <DemoRoleSwitcher />
      <Navbar />
      <div className="flex-1 flex w-full max-w-full">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 rhinos-pattern">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
};
