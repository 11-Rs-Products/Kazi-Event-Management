'use client';

import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const { loginWithGoogle, loading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) {
      router.replace(redirectTarget);
    }
  }, [user, redirectTarget, router]);

  if (user) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full ed-stage ed-mesh ed-grain overflow-hidden flex flex-col">
      {/* ─── Editorial split: statement left, sign-in right ─── */}
      <div className="relative z-[2] flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Statement panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-white/10">
          <KazirangaLogo size="md" variant="full" />

          <div className="space-y-8 max-w-lg">
            <div className="ed-eyebrow-plain text-[rgb(var(--accent-vivid))]">
              Intra-house event portal
            </div>

            <h1 className="font-display font-black text-display-xl text-white leading-[0.95]">
              Every contest.
              <br />
              One house.
              <br />
              <span className="text-[rgb(var(--accent-vivid))]">One arena.</span>
            </h1>

            <p className="text-body-lg text-white/55 leading-relaxed">
              Discover competitions, register solo or with a team, track your submissions and
              carry the Rhinos into every house event.
            </p>
          </div>

          <dl className="flex items-end gap-10">
            {[
              { v: 'Sports', l: 'Tournaments' },
              { v: 'Tech', l: 'Hackathons' },
              { v: 'Culture', l: 'Showcases' },
            ].map((item) => (
              <div key={item.l}>
                <dt className="font-display font-black text-title text-white">{item.v}</dt>
                <dd className="text-eyebrow uppercase font-display text-white/35 mt-1">
                  {item.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Sign-in panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[420px] space-y-8">
            <div className="lg:hidden flex justify-center">
              <KazirangaLogo size="lg" variant="iconOnly" />
            </div>

            <div className="space-y-3 text-center lg:text-left">
              <h2 className="font-display font-black text-display-sm text-white">
                Sign in to continue
              </h2>
              <p className="text-caption text-white/50 leading-relaxed">
                Use your official IIT Madras student account. Access is limited to authorised
                Kaziranga House members.
              </p>
            </div>

            <button
              disabled={loading}
              onClick={loginWithGoogle}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl
                bg-white hover:bg-white/90 text-stage
                font-display font-bold text-body
                shadow-e-3 transition-all duration-200 ease-editorial
                active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
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
              {loading ? 'Authenticating…' : 'Continue with Google'}
            </button>

            <p className="text-micro text-white/35 text-center lg:text-left leading-relaxed">
              By signing in you agree to house event guidelines. Not on the roster? Contact your
              house coordinator.
            </p>
          </div>
        </div>
      </div>

      <footer className="relative z-[2] px-6 sm:px-10 lg:px-16 py-6 border-t border-white/[0.07]">
        <p className="text-micro text-white/25 text-center lg:text-left">
          Kaziranga House · IIT Madras BS Degree Programme
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full ed-stage" />
    }>
      <LoginContent />
    </Suspense>
  );
}
