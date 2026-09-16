'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { TenureProvider } from '@/context/TenureContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { InteractiveBackground } from '@/components/layout/InteractiveBackground';
import { getStoredUiPreference, setStoredUiPreference } from '@/lib/utils/uiPreference';

function ClassicThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const pref = getStoredUiPreference();
    if (pref === 'neob') {
      const target = pathname.replace(/^\/classic/, '/neob');
      window.location.replace(target + (window.location.search || ''));
    } else if (!pref) {
      setStoredUiPreference('classic');
    }
  }, [pathname]);

  return null;
}

export function ClassicProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClassicThemeSync />
      <InteractiveBackground />
      <ToastProvider>
        <AuthProvider>
          <TenureProvider>
            <NotificationProvider>
              <RouteGuard>
                <AppShell>
                  {children}
                </AppShell>
              </RouteGuard>
            </NotificationProvider>
          </TenureProvider>
        </AuthProvider>
      </ToastProvider>
    </>
  );
}
