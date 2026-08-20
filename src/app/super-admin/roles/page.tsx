'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, AllowedUser } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { RoleManager } from '@/components/super-admin/RoleManager';
import { SuperAdminNavTabs } from '@/components/super-admin/SuperAdminNavTabs';
import { Crown, Users } from 'lucide-react';

export default function SuperAdminRolesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    setLoading(true);

    const updateActiveUsers = () => {
      if (isMockMode) {
        const allUsers = mockStore.getUsers();
        const allowedEmails = new Set(
          mockStore.getAllowedUsers().map((u) => u.email.trim().toLowerCase())
        );
        // Only active allowed users are eligible for Role Management
        const filtered = allUsers.filter((u) =>
          allowedEmails.has(u.email.trim().toLowerCase())
        );
        setActiveUsers(filtered);
        setLoading(false);
      }
    };

    if (isMockMode) {
      updateActiveUsers();
      const unsubscribeMock = mockStore.subscribe(() => {
        updateActiveUsers();
      });
      return () => unsubscribeMock();
    } else {
      // Real-time Firestore Listener
      const unsubscribeUsers = onSnapshot(
        collection(db, 'users'),
        async (userSnap) => {
          try {
            const allowedSnap = await getDocs(collection(db, 'allowedUsers'));
            const allowedEmails = new Set<string>();
            allowedSnap.forEach((d) => allowedEmails.add(d.id.toLowerCase()));

            const list: UserProfile[] = [];
            userSnap.forEach((d) => {
              const u = { uid: d.id, ...d.data() } as UserProfile;
              if (allowedEmails.has(u.email.toLowerCase())) {
                list.push(u);
              }
            });
            setActiveUsers(list);
          } catch (err) {
            console.error('[SuperAdminRolesPage] Error filtering active users:', err);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('[SuperAdminRolesPage] Firestore users snapshot error:', err);
          setLoading(false);
        }
      );
      return () => unsubscribeUsers();
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2.5">
          <Users className="w-6 h-6 text-gold-500 shrink-0" />
          <span>Members Directory</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
          Browse currently active allowed members, search student records, and manage access roles.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
          Loading active members dataset...
        </div>
      ) : (
        <RoleManager users={activeUsers} />
      )}
    </div>
  );
}
