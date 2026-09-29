import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      id="main"
      className="min-h-screen flex items-center justify-center p-6 bg-[#050D0B] text-white"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0F231D] border border-[#2D5A46]/40 text-[#2DD4BF] text-3xl font-black">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-400">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#D4AF37] text-black hover:bg-[#E5C158] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/classic/events"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </main>
  );
}
