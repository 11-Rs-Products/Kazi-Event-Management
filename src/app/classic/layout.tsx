import '../globals-classic.css';
import { AuthProvider } from '@/context/AuthContext';
import { TenureProvider } from '@/context/TenureContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { InteractiveBackground } from '@/components/layout/InteractiveBackground';

export default function ClassicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
