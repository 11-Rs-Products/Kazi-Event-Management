'use client';

import React from 'react';
import Link from 'next/link';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { Button } from '@/components/ui/Button';
import { ShieldX, Mail, ArrowLeft, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AccessDeniedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-lg space-y-6 text-center">
        <KazirangaLogo size="lg" className="mx-auto" />

        <div className="p-8 rounded-3xl bg-white dark:bg-kaziranga-950 border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldX className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-rose-950 dark:text-rose-200 tracking-tight">
              Access Denied
            </h2>
            <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 leading-relaxed max-w-md mx-auto">
              Your Google account email is not present in the active <span className="font-bold text-kaziranga-900 dark:text-white">Kaziranga House Allowed-Users Registry</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-300 space-y-2 text-left">
            <div className="font-bold flex items-center gap-1.5 text-rose-950 dark:text-rose-200">
              <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>How to resolve this issue?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
              <li>Ensure you are signing in with your official student Google account (e.g. <code>@ds.study.iitm.ac.in</code>).</li>
              <li>If you are a member of Kaziranga House, contact a Super Admin or House Representative to update the allowed-user spreadsheet.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => logout()}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Login
            </Button>
            <a
              href="mailto:24f2002110@ds.study.iitm.ac.in?subject=Kaziranga%20Portal%20Access%20Request"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Contact Super Admin
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
