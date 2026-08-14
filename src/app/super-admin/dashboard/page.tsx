'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AllowedUser, AuditLog, UserProfile } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, Crown, FileSpreadsheet, Users, History, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (isMockMode) {
        setAllowedUsers(mockStore.getAllowedUsers());
        setAllUsers(mockStore.getUsers());
        setAuditLogs(mockStore.getAuditLogs());
        setLoading(false);
      } else {
        try {
          const allowedSnap = await getDocs(collection(db, 'allowedUsers'));
          const allowedList: AllowedUser[] = [];
          allowedSnap.forEach((d) => allowedList.push({ email: d.id, ...d.data() } as AllowedUser));

          const usersSnap = await getDocs(collection(db, 'users'));
          const usersList: UserProfile[] = [];
          usersSnap.forEach((d) => usersList.push({ uid: d.id, ...d.data() } as UserProfile));

          const logsSnap = await getDocs(collection(db, 'auditLogs'));
          const logsList: AuditLog[] = [];
          logsSnap.forEach((d) => logsList.push({ id: d.id, ...d.data() } as AuditLog));

          setAllowedUsers(allowedList);
          setAllUsers(usersList);
          setAuditLogs(logsList);
        } catch (err) {
          console.error('Error fetching super admin data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const adminUsers = allUsers.filter((u) => u.role === 'ADMIN');
  const superAdminUsers = allUsers.filter((u) => u.role === 'SUPER_ADMIN');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-gold-500" />
            <span>Super Admin Control Center</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
            Allowed-user registry synchronization, administrator role management, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/super-admin/allowed-users">
            <Button variant="gold" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
              Import Spreadsheet
            </Button>
          </Link>
          <Link href="/super-admin/roles">
            <Button variant="outline" leftIcon={<Users className="w-4 h-4" />}>
              Role Manager
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-kaziranga-500 font-bold uppercase tracking-wider">Allowed Email Registry</div>
          <div className="text-2xl font-black text-kaziranga-950 dark:text-white">{allowedUsers.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">Active Access List</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-sky-600 font-bold uppercase tracking-wider">Admins</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{adminUsers.length}</div>
          <div className="text-[10px] text-kaziranga-500">ADMIN Role Accounts</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-gold-600 font-bold uppercase tracking-wider">Super Admins</div>
          <div className="text-2xl font-black text-gold-600 dark:text-gold-400">{superAdminUsers.length}</div>
          <div className="text-[10px] text-kaziranga-500">SUPER_ADMIN Accounts</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-purple-600 font-bold uppercase tracking-wider">Audit Logs</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{auditLogs.length}</div>
          <div className="text-[10px] text-kaziranga-500">Recorded Actions</div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Allowed Users Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">Active Allowed-User List ({allowedUsers.length})</h3>
            <Link href="/super-admin/allowed-users" className="text-xs font-bold text-kaziranga-700 dark:text-kaziranga-300 hover:underline">
              Spreadsheet Replacement Manager
            </Link>
          </div>

          <Card className="p-4">
            <div className="max-h-64 overflow-y-auto divide-y divide-kaziranga-100 dark:divide-kaziranga-900 text-xs">
              {allowedUsers.slice(0, 10).map((u, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <span className="font-mono text-kaziranga-950 dark:text-white">{u.email}</span>
                  <Badge variant="emerald" size="sm">Allowed</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Audit Log Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-500" />
              <span>Recent Audit Logs</span>
            </h3>
            <Link href="/super-admin/audit-logs" className="text-xs font-bold text-kaziranga-700 dark:text-kaziranga-300 hover:underline">
              View All
            </Link>
          </div>

          <Card className="p-4 divide-y divide-kaziranga-100 dark:divide-kaziranga-900 text-xs">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="py-2.5 space-y-1">
                <div className="font-bold text-kaziranga-950 dark:text-white">{log.action}</div>
                <div className="text-[11px] text-kaziranga-500">{log.actorEmail}</div>
                <div className="text-[10px] text-kaziranga-400 font-mono">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
