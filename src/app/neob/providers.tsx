'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { TenureProvider } from '@/context/TenureContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RouteGuard } from '@/components/neob/layout/RouteGuard';
import { AppShell } from '@/components/neob/layout/AppShell';
import { ToastProvider } from '@/components/neob/ui/Toast';
import { InteractiveBackground } from '@/components/neob/layout/InteractiveBackground';
import { getStoredUiPreference, setStoredUiPreference } from '@/lib/utils/uiPreference';

function NeoBThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const pref = getStoredUiPreference();
    if (pref === 'classic') {
      const target = pathname.replace(/^\/neob/, '/classic');
      window.location.replace(target + (window.location.search || ''));
    } else if (!pref) {
      setStoredUiPreference('neob');
    }
  }, [pathname]);

  return null;
}

export function NeoBProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NeoBThemeSync />
      <InteractiveBackground />
      <ThemeProvider>
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
      </ThemeProvider>
    </>
  );
}
