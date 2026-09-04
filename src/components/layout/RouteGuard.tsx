'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '../branding/KazirangaLogo';

const PUBLIC_ROUTES = ['/login', '/access-denied'];

/** Full-screen holding state shown while auth resolves or a redirect runs. */
const AuthSplash: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-surface/95 backdrop-blur-md dark:bg-[#050D0B] dark:ed-mesh dark:ed-grain">
    <div
      className="relative z-[2] flex flex-col items-center gap-5 px-8 py-10 sm:px-12
        rounded-3xl bg-surface-raised border border-hairline shadow-e-4
        dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/10"
      role="status"
      aria-live="polite"
    >
      <KazirangaLogo size="lg" variant="full" />
      <div className="flex items-center gap-2.5">
        <Loader2
          className="w-4 h-4 animate-spin text-brand dark:text-[rgb(var(--accent-vivid))]"
          aria-hidden
        />
        <span className="text-caption font-display font-semibold text-ink-muted dark:text-white/70">{message}</span>
      </div>
    </div>
  </div>
);

export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      const redirectUrl =
        pathname && pathname !== '/'
          ? `/login?redirect=${encodeURIComponent(pathname)}`
          : '/login';
      router.replace(redirectUrl);
    }
  }, [user, loading, isPublicRoute, pathname, router]);

  if (loading) {
    return isPublicRoute ? <>{children}</> : <AuthSplash message="Authenticating session…" />;
  }

  if (!user && !isPublicRoute) {
    return <AuthSplash message="Redirecting to sign in…" />;
  }

  return <>{children}</>;
};
