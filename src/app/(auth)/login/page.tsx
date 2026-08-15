'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { loginWithGoogle, loading, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-gradient-to-br from-kaziranga-950 via-kaziranga-900 to-kaziranga-950 text-white selection:bg-gold-500 selection:text-kaziranga-950">
      {/* Background Soft Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-kaziranga-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gold-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Centered Glassmorphic Sign-In Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-kaziranga-950/80 backdrop-blur-2xl border border-kaziranga-800/80 shadow-2xl text-center space-y-6">
        
        {/* Kaziranga Logo Seal */}
        <div className="space-y-3">
          <KazirangaLogo variant="iconOnly" size="xl" className="mx-auto" />
          
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              KAZIRANGA <span className="text-gold-400 font-light">HOUSE</span>
            </h1>
            <div className="text-[10px] font-bold uppercase tracking-widest text-kaziranga-300">
              INTRA-HOUSE EVENT PORTAL
            </div>
          </div>
        </div>

        {/* Subtitle Description */}
        <p className="text-xs text-kaziranga-200/80 leading-relaxed max-w-xs mx-auto font-medium">
          Sign in with your official IITM student account to discover competitions & register for events.
        </p>

        {/* Official Crisp White Google Button */}
        <button
          disabled={loading}
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-white hover:bg-slate-100 text-kaziranga-950 font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed select-none"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
        </button>

        {/* Footer Policy Note */}
        <p className="text-[11px] text-kaziranga-300/70 font-medium">
          Access is restricted to authorized Kaziranga House members.
        </p>
      </div>
    </div>
  );
}
