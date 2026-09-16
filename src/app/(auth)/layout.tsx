/**
 * Auth route group layout.
 * Loads the Classic CSS (login page uses Classic design tokens — dark stage theme).
 * Both /classic and /new share the same login/access-denied pages.
 */
import '../globals-classic.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  );
}
