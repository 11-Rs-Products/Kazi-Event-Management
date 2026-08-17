'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '../branding/KazirangaLogo';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/access-denied'];

export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      const redirectUrl = pathname && pathname !== '/' 
        ? `/login?redirect=${encodeURIComponent(pathname)}` 
        : '/login';
      router.replace(redirectUrl);
    }
  }, [user, loading, isPublicRoute, pathname, router]);

  // 1. Initial Auth Loading State
  if (loading) {
    if (isPublicRoute) {
      return <>{children}</>;
    }
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-kaziranga-950 text-cream-100 p-4">
        <div className="relative flex flex-col items-center gap-4 p-8 sm:p-10 rounded-3xl bg-kaziranga-900/90 backdrop-blur-2xl border border-kaziranga-800 shadow-2xl">
          <KazirangaLogo size="lg" textVariant="light" />
          <div className="flex items-center gap-3 mt-2">
            <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
            <span className="text-xs font-bold tracking-wide text-cream-200">
              Authenticating session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Redirecting to Login)
  if (!user && !isPublicRoute) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-kaziranga-950 text-cream-100 p-4">
        <div className="relative flex flex-col items-center gap-4 p-8 sm:p-10 rounded-3xl bg-kaziranga-900/90 backdrop-blur-2xl border border-kaziranga-800 shadow-2xl">
          <KazirangaLogo size="lg" textVariant="light" />
          <div className="flex items-center gap-3 mt-2">
            <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
            <span className="text-xs font-bold tracking-wide text-cream-200">
              Redirecting to login...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated or Public Route Render
  return <>{children}</>;
};
