'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuditLog } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { AuditLogTable } from '@/components/neob/super-admin/AuditLogTable';
import { SuperAdminNavTabs } from '@/components/neob/super-admin/SuperAdminNavTabs';
import { History } from 'lucide-react';

export default function NeoBSuperAdminAuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    if (isMockMode) {
      setLogs(mockStore.getAuditLogs());
      setLoading(false);
    } else {
      try {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list: AuditLog[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
        setLogs(list);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/neob/dashboard');
      return;
    }
    fetchLogs();
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <div>
        <h1 className="text-2xl font-display font-black text-ink flex items-center gap-2">
          <History className="w-6 h-6 text-[#7C3AED] stroke-[2.5]" />
          <span>Security Audit Trail Logs</span>
        </h1>
        <p className="text-caption text-ink-muted mt-1 font-medium">
          View immutable audit records of privileged administrative actions, role changes, and
          spreadsheet synchronization events.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-caption text-ink-faint">Loading audit trail...</div>
      ) : (
        <AuditLogTable logs={logs} />
      )}
    </div>
  );
}
