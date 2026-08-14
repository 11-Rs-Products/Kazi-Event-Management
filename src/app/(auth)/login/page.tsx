'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Trophy, Sparkles, UserCheck, Crown, Shield } from 'lucide-react';
import { isMockMode } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { loginWithGoogle, loading, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.replace('/dashboard');
    return null;
  }

  const handleDemoUserSelect = (email: string) => {
    const matched = mockStore.getUserByEmail(email);
    if (matched) {
      mockStore.setActiveUser(matched);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Card Header */}
        <div className="text-center space-y-3">
          <KazirangaLogo size="lg" className="mx-auto" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-kaziranga-950 dark:text-white tracking-tight">
              Inter-House Event Portal
            </h2>
            <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300">
              Sign in with your approved Google account to register for events & represent Kaziranga House.
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-kaziranga-950 border border-kaziranga-100 dark:border-kaziranga-900 shadow-xl space-y-6">
          <div className="p-4 rounded-2xl bg-kaziranga-50/70 dark:bg-kaziranga-900/40 border border-kaziranga-100 dark:border-kaziranga-800 text-xs text-kaziranga-700 dark:text-kaziranga-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-kaziranga-950 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Allowed-Users Restricted Access</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Access is strictly restricted to authenticated emails present in the official Kaziranga House allowed-user registry.
            </p>
          </div>

          <Button
            size="lg"
            variant="primary"
            className="w-full shadow-lg"
            isLoading={loading}
            onClick={loginWithGoogle}
            leftIcon={
              <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>


        </div>

        <p className="text-[11px] text-center text-kaziranga-500 dark:text-kaziranga-400">
          Protected by Kaziranga House Firestore Security & Allowed-Users Registry Policy.
        </p>
      </div>
    </div>
  );
}
