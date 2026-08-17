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
import { SuperAdminNavTabs } from '@/components/super-admin/SuperAdminNavTabs';
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
      setSuccessBanner(`Successfully synchronized ${res.total} active allowed users from ${parsedFilename}.`);
      setIsPreviewOpen(false);
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
            validCount: parsedResult.validRows.length,
            invalidCount: parsedResult.invalidRows.length,
            filename: parsedFilename,
          },
        });

        setSuccessBanner(`Successfully synchronized ${parsedResult.validRows.length} active allowed users.`);
        setIsPreviewOpen(false);
        fetchAllowedUsers();
      } catch (err) {
        console.error('Spreadsheet replacement error:', err);
        alert('Failed to replace allowed-users dataset.');
      }
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const filteredList = allowedUsers.filter((u) =>
    searchQuery === '' || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-gold-500" />
          <span>Allowed-User Registry Synchronization</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
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
          <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">
            Active Registry Accounts ({allowedUsers.length})
          </h3>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registry by email..."
              className="arena-input pl-10 text-xs py-2"
            />
          </div>
        </div>

        <Card className="overflow-hidden shadow-arena">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="arena-table">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr>
                  <th>Allowed Student Email</th>
                  <th className="text-right">Access Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                      Loading allowed registry...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                      No matching emails found in active registry.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((u, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs text-kaziranga-800 dark:text-cream-100">
                        {u.email}
                      </td>
                      <td className="text-right">
                        <Badge variant="emerald" size="sm">
                          Access Granted
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
