'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';

const PUBLIC_ROUTES = ['/login', '/access-denied'];

/** Full-screen holding state shown while auth resolves or a redirect runs. */
const AuthSplash: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-4 bg-[#FFFDF8] dark:bg-[#121215] overflow-hidden select-none">
    {/* Neo-Brutalist Dot-Matrix Grid Background */}
    {/* Light Mode Dots */}
    <div
      className="absolute inset-0 opacity-[0.38] dark:hidden pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(#121212 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    />
    {/* Dark Mode Dots */}
    <div
      className="absolute inset-0 opacity-[0.35] hidden dark:block pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    />

    {/* Ambient Color Blooms */}
    <div
      className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#FFE873]/20 dark:bg-[#FFE873]/[0.10] blur-[80px] pointer-events-none"
    />
    <div
      className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#5EEAD4]/20 dark:bg-[#5EEAD4]/[0.10] blur-[80px] pointer-events-none"
    />

    {/* Floating Decorative Scrapbook Stamps */}
    <div className="absolute top-8 left-8 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black dark:border-white bg-[#FFE873] text-black font-display font-black text-[10px] uppercase shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] -rotate-6 pointer-events-none">
      ✦ KAZIRANGA RHINOS
    </div>
    <div className="absolute bottom-8 right-8 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black dark:border-white bg-[#5EEAD4] text-black font-display font-black text-[10px] uppercase shadow-[2px_2px_0px_#121212] dark:shadow-[2px_2px_0px_#FFFFFF] rotate-3 pointer-events-none">
      ⚡ EVENT ARENA
    </div>

    {/* Central Neo-Brutalism Card */}
    <div
      className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 sm:px-12 sm:py-12
        rounded-3xl bg-white dark:bg-[#1E1E24] border-2 border-black dark:border-white
        shadow-[8px_8px_0px_#121212] dark:shadow-[8px_8px_0px_#FFFFFF] max-w-sm w-full"
      role="status"
      aria-live="polite"
    >
      {/* Top Tape Sticker Accent */}
      <div className="absolute -top-3.5 px-3.5 py-0.5 rounded bg-[#FFE873] text-black border-2 border-black font-mono font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#121212] -rotate-1">
        ✦ ARENA GATEWAY ✦
      </div>

      {/* Logo */}
      <div className="p-3 rounded-2xl border-2 border-black dark:border-white bg-surface-sunken dark:bg-black/30 shadow-[3px_3px_0px_#121212] dark:shadow-[3px_3px_0px_#FFFFFF]">
        <KazirangaLogo size="lg" variant="full" />
      </div>

      {/* Status Pill with Neo-Brutalism Spinner */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#86EFAC] text-black border-2 border-black shadow-[3px_3px_0px_#121212]">
          <Loader2
            className="w-4 h-4 animate-spin text-black stroke-[3]"
            aria-hidden
          />
          <span className="text-caption font-display font-black uppercase tracking-wider text-black">
            {message}
          </span>
        </div>
        <p className="text-[11px] font-display font-bold text-gray-500 dark:text-gray-400 text-center tracking-wide">
          Connecting to Kaziranga House network…
        </p>
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

  if (loading && !user) {
    return isPublicRoute ? <>{children}</> : <AuthSplash message="Authenticating session…" />;
  }

  if (!user && !isPublicRoute) {
    return <AuthSplash message="Redirecting to sign in…" />;
  }

  return <>{children}</>;
};
