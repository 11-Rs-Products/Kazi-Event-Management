'use client';

import { useEffect } from 'react';
import { getStoredUiPreference } from '@/lib/utils/uiPreference';

export default function Home() {
  useEffect(() => {
    const pref = getStoredUiPreference() || 'classic';
    window.location.replace(`/${pref}/dashboard`);
  }, []);

  return null;
}
