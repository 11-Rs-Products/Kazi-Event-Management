'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { RoleManager } from '@/components/super-admin/RoleManager';
import { SuperAdminNavTabs } from '@/components/super-admin/SuperAdminNavTabs';
import { Crown, Users } from 'lucide-react';

export default function SuperAdminRolesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    setLoading(true);

    if (isMockMode) {
      setUsers(mockStore.getUsers());
      setLoading(false);

      const unsubscribeMock = mockStore.subscribe(() => {
        setUsers(mockStore.getUsers());
      });
      return () => unsubscribeMock();
    } else {
      // Real-time Firestore Listener for users collection
      const unsubscribeFirestore = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach((d) => list.push({ uid: d.id, ...d.data() } as UserProfile));
          setUsers(list);
          setLoading(false);
        },
        (err) => {
          console.error('[SuperAdminRolesPage] Firestore users snapshot error:', err);
          setLoading(false);
        }
      );
      return () => unsubscribeFirestore();
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
          <Crown className="w-6 h-6 text-gold-500" />
          <span>Role & Administrator Management</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
          Promote student users to Admins or Super Admins, demote privileges, and view current roles.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-kaziranga-500">
          Loading user accounts dataset...
        </div>
      ) : (
        <RoleManager users={users} />
      )}
    </div>
  );
}
