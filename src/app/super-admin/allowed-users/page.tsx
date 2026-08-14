'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AllowedUser, SpreadsheetParseResult } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SpreadsheetUploader } from '@/components/super-admin/SpreadsheetUploader';
import { SyncPreviewModal } from '@/components/super-admin/SyncPreviewModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileSpreadsheet, CheckCircle2, ShieldCheck, Search } from 'lucide-react';

export default function SuperAdminAllowedUsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [parsedResult, setParsedResult] = useState<SpreadsheetParseResult | null>(null);
  const [parsedFilename, setParsedFilename] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchAllowedUsers = async () => {
    setLoading(true);
    if (isMockMode) {
      setAllowedUsers(mockStore.getAllowedUsers());
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(collection(db, 'allowedUsers'));
        const list: AllowedUser[] = [];
        snap.forEach((d) => list.push({ email: d.id, ...d.data() } as AllowedUser));
        setAllowedUsers(list);
      } catch (err) {
        console.error('Error fetching allowed users:', err);
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
    fetchAllowedUsers();
  }, [user, router]);

  const handleParsed = (result: SpreadsheetParseResult, filename: string) => {
    setParsedResult(result);
    setParsedFilename(filename);
    setIsPreviewOpen(true);
  };

  const handleConfirmSync = async () => {
    if (!parsedResult || !user) return;

    if (isMockMode) {
      const res = mockStore.replaceAllowedUsers(parsedResult.validRows, user, parsedFilename);
      setSuccessBanner(`Successfully replaced allowed-user registry with ${res.total} verified email accounts.`);
      fetchAllowedUsers();
    } else {
      try {
        // Fetch current allowedUsers docs to remove
        const snap = await getDocs(collection(db, 'allowedUsers'));
        const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        // Add new allowedUsers docs
        const batchId = 'batch_' + Date.now();
        const importedAt = new Date().toISOString();

        const createPromises = parsedResult.validRows.map((email) => {
          const docRef = doc(db, 'allowedUsers', email.trim().toLowerCase());
          return setDoc(docRef, {
            email: email.trim().toLowerCase(),
            importBatchId: batchId,
            importedAt,
          });
        });
        await Promise.all(createPromises);

        // Record audit log
        const auditRef = doc(db, 'auditLogs', 'log_' + Date.now());
        await setDoc(auditRef, {
          id: auditRef.id,
          actorUserId: user.uid,
          actorEmail: user.email,
          action: 'ALLOWED_USERS_REPLACED',
          target: 'allowedUsers Collection',
          timestamp: importedAt,
          metadata: {
            totalValidEmails: parsedResult.validRows.length,
            filename: parsedFilename,
            batchId,
          },
        });

        setSuccessBanner(`Successfully replaced allowed-user registry with ${parsedResult.validRows.length} email accounts.`);
        fetchAllowedUsers();
      } catch (err: any) {
        console.error('Spreadsheet replacement sync error:', err);
        alert('Failed to replace allowed users list: ' + err.message);
      }
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const filteredList = allowedUsers.filter((u) =>
    searchQuery === '' || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-gold-500" />
          <span>Allowed-User Registry Synchronization</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
          Upload and replace the official allowed-user spreadsheet. Newly uploaded lists replace previous active accounts without affecting student profiles or historical registration data.
        </p>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Spreadsheet Uploader Area */}
      <Card className="p-6">
        <SpreadsheetUploader onParsed={handleParsed} />
      </Card>

      {/* Current Allowed List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">
            Active Registry Accounts ({allowedUsers.length})
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-kaziranga-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registry by email..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-kaziranga-100 dark:divide-kaziranga-900 text-xs">
            {loading ? (
              <div className="p-8 text-center text-kaziranga-500">Loading allowed registry...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-kaziranga-500">No matching emails found in active registry.</div>
            ) : (
              filteredList.map((u, i) => (
                <div key={i} className="p-3 flex items-center justify-between font-mono">
                  <span className="text-kaziranga-950 dark:text-white">{u.email}</span>
                  <Badge variant="emerald" size="sm">
                    Access Granted
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Sync Preview Confirmation Modal */}
      <SyncPreviewModal
        isOpen={isPreviewOpen}
        result={parsedResult}
        filename={parsedFilename}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmSync}
      />
    </div>
  );
}
