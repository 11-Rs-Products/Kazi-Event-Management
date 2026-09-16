import '../globals-neob.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { TenureProvider } from '@/context/TenureContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RouteGuard } from '@/components/neob/layout/RouteGuard';
import { AppShell } from '@/components/neob/layout/AppShell';
import { ToastProvider } from '@/components/neob/ui/Toast';
import { InteractiveBackground } from '@/components/neob/layout/InteractiveBackground';

export default function NeoBLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
