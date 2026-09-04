'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, loading, router]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-3"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-7 h-7 animate-spin text-brand" aria-hidden />
      <p className="text-caption font-display font-semibold text-ink-muted">
        Loading the Kaziranga House portal…
      </p>
    </div>
  );
}
