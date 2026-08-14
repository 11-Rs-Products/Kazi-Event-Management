'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs } from 'firebase/firestore';
import { RoleManager } from '@/components/super-admin/RoleManager';
import { Crown, Users } from 'lucide-react';

export default function SuperAdminRolesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    if (isMockMode) {
      setUsers(mockStore.getUsers());
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as UserProfile));
        setUsers(list);
      } catch (err) {
        console.error('Error fetching users for role manager:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
          <Crown className="w-6 h-6 text-gold-500" />
          <span>Role & Administrator Management</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
          Promote student users to Admins or Super Admins, demote privileges, and view current roles.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-kaziranga-500">
          Loading user accounts dataset...
        </div>
      ) : (
        <RoleManager users={users} onRoleUpdated={() => fetchUsers()} />
      )}
    </div>
  );
}
