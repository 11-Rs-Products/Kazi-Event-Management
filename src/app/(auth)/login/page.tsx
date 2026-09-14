'use client';

import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KazirangaLogo } from '@/components/branding/KazirangaLogo';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

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
    <div className="relative min-h-screen w-full bg-surface text-ink overflow-hidden flex flex-col">
      {/* ─── Dot grid background ─── */}
      <div
        className="absolute inset-0 opacity-[0.38] pointer-events-none dark:hidden"
        style={{
          backgroundImage: 'radial-gradient(#121212 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none hidden dark:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.5) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ─── Neo-Brutalist split: statement left, sign-in right ─── */}
      <div className="relative z-[2] flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-4 sm:px-8 py-10">
        {/* Statement panel */}
        <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12 space-y-8">
          <KazirangaLogo size="md" variant="full" />

          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_#121212] bg-[#FFE873] text-black font-display font-black text-eyebrow uppercase">
              ✦ Intra-house event portal
            </div>

            <h1 className="font-display font-black text-display-lg sm:text-display-xl text-ink leading-[0.98]">
              Every contest.
              <br />
              One house.
              <br />
              <span className="inline-block px-3 py-1 bg-[#5EEAD4] border-2 border-black shadow-[3px_3px_0px_#121212] text-black rotate-[-1deg] mt-1">
                One arena.
              </span>
            </h1>

            <p className="text-body font-medium text-ink-muted leading-relaxed">
              Discover competitions, register solo or with a team, track your submissions and
              carry the Rhinos into every house event.
            </p>
          </div>

          <dl className="flex flex-wrap items-center gap-4 pt-4">
            {[
              { v: 'Sports', l: 'Tournaments', color: 'bg-[#FFA0A0]' },
              { v: 'Tech', l: 'Hackathons', color: 'bg-[#5EEAD4]' },
              { v: 'Culture', l: 'Showcases', color: 'bg-[#C4B5FD]' },
            ].map((item) => (
              <div
                key={item.l}
                className={cn(
                  'px-4 py-2.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_#121212]',
                  item.color
                )}
              >
                <dt className="font-display font-black text-title-sm text-black">{item.v}</dt>
                <dd className="text-eyebrow uppercase font-display font-bold text-black/70 mt-0.5">
                  {item.l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Sign-in card */}
        <div className="flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[440px] p-8 sm:p-10 rounded-3xl bg-white border-2 border-black shadow-[8px_8px_0px_#121212] space-y-7">
            <div className="lg:hidden flex justify-center">
              <KazirangaLogo size="lg" variant="iconOnly" />
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <h2 className="font-display font-black text-display-sm text-black">
                Sign in to continue
              </h2>
              <p className="text-caption font-medium text-gray-600 leading-relaxed">
                Use your official IIT Madras student account. Access is limited to authorised
                Kaziranga House members.
              </p>
            </div>

            <button
              disabled={loading}
              onClick={loginWithGoogle}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl
                bg-[#FFE873] hover:bg-[#FFF3A8] text-black
                border-2 border-black shadow-[4px_4px_0px_#121212]
                font-display font-black text-body
                transition-all duration-150 cursor-pointer
                hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#121212]
                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                disabled:opacity-60 disabled:pointer-events-none"
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

            <p className="text-micro font-medium text-gray-500 text-center lg:text-left leading-relaxed">
              By signing in you agree to house event guidelines. Not on the roster? Contact your
              house coordinator.
            </p>
          </div>
        </div>
      </div>

      <footer className="relative z-[2] px-6 sm:px-10 lg:px-16 py-5 border-t-2 border-black bg-white/50 text-center lg:text-left">
        <p className="text-micro font-bold text-ink-muted">
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
