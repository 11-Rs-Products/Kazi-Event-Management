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
import {
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  UserX,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/ui/Toast';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowSkeleton } from '@/components/ui/Skeleton';

export default function SuperAdminAllowedUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

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
        `Successfully synchronized ${res.total} active allowed users from ${parsedFilename} (+${res.addedCount} added, -${res.deactivatedCount} deactivated).`,
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

        setSuccessBanner(
          `Successfully synchronized ${parsedResult.validRows.length} active allowed users.`,
        );
        setIsPreviewOpen(false);
        fetchAllowedUsers();
      } catch (err) {
        console.error('Spreadsheet replacement error:', err);
        toast.error('Import failed', 'The allowed-users list was not replaced.');
      }
    }
  };

  const handleRevokeAccess = async () => {
    if (!revokingUser || !user) return;
    setIsRevoking(true);

    try {
      if (isMockMode) {
        mockStore.removeAllowedUser(revokingUser.email, user);
        setSuccessBanner(
          `Revoked login access for ${revokingUser.email}. Historical records and registrations remain preserved.`,
        );
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
      toast.error('Could not revoke access', 'Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const filteredList = allowedUsers.filter(
    (u) => searchQuery === '' || u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <div>
        <h1 className="text-2xl font-display font-black text-ink flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-accent" />
          <span>Allowed-User Registry Synchronization</span>
        </h1>
        <p className="text-caption text-ink-muted mt-1">
          Upload and replace the official allowed-user spreadsheet. The latest uploaded file is the
          authoritative source for current login access. Historical user profiles and event
          participation are permanently preserved.
        </p>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-signal-live/10 border border-signal-live/25 text-signal-live text-caption flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-signal-live shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="font-bold text-caption hover:underline"
          >
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
            <h3 className="text-sm font-display font-bold text-ink">
              Active Whitelisted Accounts ({allowedUsers.length})
            </h3>
            <p className="text-caption text-ink-faint">
              Currently permitted to authenticate and access the student arena.
            </p>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search registry by email…"
            aria-label="Search registry by email"
            containerClassName="w-full sm:w-80"
          />
        </div>

        <DataTable
          columns={[
            {
              id: 'email',
              header: 'Allowed email',
              primary: true,
              sortValue: (u) => u.email,
              cell: (u) => (
                <span className="font-mono text-caption text-ink break-all">{u.email}</span>
              ),
            },
            {
              id: 'status',
              header: 'Access',
              cell: () => (
                <Badge tone="live" size="sm">
                  Granted
                </Badge>
              ),
            },
          ]}
          rows={filteredList}
          rowKey={(u) => u.email}
          caption="Allowed users registry"
          actions={(u) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevokingUser(u)}
              leftIcon={<UserX className="w-3.5 h-3.5" />}
              className="text-signal-danger hover:text-signal-danger hover:bg-signal-danger/10"
            >
              Revoke
            </Button>
          )}
          empty={
            loading ? (
              <div className="space-y-3">
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            ) : (
              <EmptyState
                icon={<ShieldAlert />}
                title="No emails in the registry"
                description={
                  searchQuery
                    ? 'No allowed emails match that search.'
                    : 'Upload a CSV or spreadsheet to populate the allowed-users list.'
                }
              />
            )
          }
        />
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
        <div className="space-y-4 text-caption sm:text-sm">
          <div className="p-3.5 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-signal-warn text-caption flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-signal-warn shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Historical Record Retention Policy:</span>
              <p className="leading-relaxed">
                Remove this user&apos;s current access? Their previous event participation,
                registration snapshots, and historical profile will be{' '}
                <strong>fully retained</strong> for record-keeping.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-sunken border border-hairline font-mono text-caption">
            <span className="text-ink-faint font-sans block text-caption mb-1">
              Target Student Email:
            </span>
            <span className="font-bold text-ink">{revokingUser?.email}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRevokingUser(null)}
              disabled={isRevoking}
            >
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
