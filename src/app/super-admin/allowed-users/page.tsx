'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AllowedUser, SpreadsheetParseResult } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { SpreadsheetUploader } from '@/components/super-admin/SpreadsheetUploader';
import { SyncPreviewModal } from '@/components/super-admin/SyncPreviewModal';
import { SuperAdminNavTabs } from '@/components/super-admin/SuperAdminNavTabs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FileSpreadsheet, CheckCircle2, ShieldCheck, Search, UserX, AlertTriangle, ShieldAlert } from 'lucide-react';

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

  // Revoke Access Modal State
  const [revokingUser, setRevokingUser] = useState<AllowedUser | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

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

    if (isMockMode) {
      const unsubscribe = mockStore.subscribe(() => {
        fetchAllowedUsers();
      });
      return () => {
        unsubscribe();
      };
    }
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
      setSuccessBanner(
        `Successfully synchronized ${res.total} active allowed users from ${parsedFilename} (+${res.addedCount} added, -${res.deactivatedCount} deactivated).`
      );
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
          action: 'ALLOWED_USERS_SYNCHRONIZED',
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

  const handleRevokeAccess = async () => {
    if (!revokingUser || !user) return;
    setIsRevoking(true);

    try {
      if (isMockMode) {
        mockStore.removeAllowedUser(revokingUser.email, user);
        setSuccessBanner(`Revoked login access for ${revokingUser.email}. Historical records and registrations remain preserved.`);
      } else {
        await deleteDoc(doc(db, 'allowedUsers', revokingUser.email.trim().toLowerCase()));
        
        // Log audit event
        const auditRef = doc(db, 'auditLogs', 'log_' + Date.now());
        await setDoc(auditRef, {
          id: auditRef.id,
          actorUserId: user.uid,
          actorEmail: user.email,
          action: 'USER_ACCESS_REVOKED',
          target: revokingUser.email,
          timestamp: new Date().toISOString(),
          metadata: { revokedEmail: revokingUser.email },
        });

        setSuccessBanner(`Revoked login access for ${revokingUser.email}.`);
      }

      setRevokingUser(null);
      fetchAllowedUsers();
    } catch (err) {
      console.error('Revoke access error:', err);
      alert('Failed to revoke access.');
    } finally {
      setIsRevoking(false);
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
          Upload and replace the official allowed-user spreadsheet. The latest uploaded file is the authoritative source for current login access. Historical user profiles and event participation are permanently preserved.
        </p>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="font-bold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Spreadsheet Uploader Area with Drag & Drop */}
      <Card className="p-6">
        <SpreadsheetUploader onParsed={handleParsed} />
      </Card>

      {/* Current Allowed List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">
              Active Whitelisted Accounts ({allowedUsers.length})
            </h3>
            <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">
              Currently permitted to authenticate and access the student arena.
            </p>
          </div>

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
          {/* Desktop Table View */}
          <div className="hidden sm:block max-h-[500px] overflow-y-auto">
            <table className="arena-table">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr>
                  <th>Allowed Student Email</th>
                  <th>Access Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                      Loading allowed registry...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                      No matching emails found in active registry.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((u, i) => (
                    <tr key={i} className="hover:bg-cream-200/40 dark:hover:bg-kaziranga-900/40 transition-colors">
                      <td className="font-mono text-xs text-kaziranga-800 dark:text-cream-100 font-medium">
                        {u.email}
                      </td>
                      <td>
                        <Badge variant="emerald" size="sm">
                          Access Granted
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokingUser(u)}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                          leftIcon={<UserX className="w-3.5 h-3.5" />}
                        >
                          Revoke Access
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800/60 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
                Loading allowed registry...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
                No matching emails found.
              </div>
            ) : (
              filteredList.map((u, i) => (
                <div key={i} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-kaziranga-800 dark:text-cream-100 break-all">
                      {u.email}
                    </span>
                    <Badge variant="emerald" size="sm" className="shrink-0">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokingUser(u)}
                      className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 text-xs"
                      leftIcon={<UserX className="w-3.5 h-3.5" />}
                    >
                      Revoke Access
                    </Button>
                  </div>
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

      {/* Revoke Access Confirmation Modal */}
      <Modal
        isOpen={!!revokingUser}
        onClose={() => setRevokingUser(null)}
        title="Revoke Current Login Access"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Historical Record Retention Policy:</span>
              <p className="leading-relaxed">
                Remove this user&apos;s current access? Their previous event participation, registration snapshots, and historical profile will be <strong>fully retained</strong> for record-keeping.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cream-200/40 dark:bg-kaziranga-900/60 border border-cream-400/20 dark:border-kaziranga-800 font-mono text-xs">
            <span className="text-kaziranga-500 dark:text-cream-400/60 font-sans block text-[11px] mb-1">
              Target Student Email:
            </span>
            <span className="font-bold text-kaziranga-800 dark:text-cream-100">
              {revokingUser?.email}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
            <Button type="button" variant="ghost" onClick={() => setRevokingUser(null)} disabled={isRevoking}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isRevoking}
              onClick={handleRevokeAccess}
              leftIcon={<UserX className="w-4 h-4" />}
            >
              Confirm & Revoke Access
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
