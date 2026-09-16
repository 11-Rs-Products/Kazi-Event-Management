'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs } from 'firebase/firestore';
import { getAllRegistrationsGroupRef } from '@/lib/firebase/paths';
import { SuperAdminNavTabs } from '@/components/neob/super-admin/SuperAdminNavTabs';
import { Card } from '@/components/neob/ui/Card';
import { Badge } from '@/components/neob/ui/Badge';
import { Button } from '@/components/neob/ui/Button';
import { Modal } from '@/components/neob/ui/Modal';
import { CalendarCheck, Clock, FolderArchive, Info, UserX, FileSpreadsheet } from 'lucide-react';
import { DataTable } from '@/components/neob/ui/DataTable';
import { EmptyState } from '@/components/neob/ui/EmptyState';
import { RowSkeleton } from '@/components/neob/ui/Skeleton';
import { SearchInput } from '@/components/neob/ui/SearchInput';
import { FilterSelect } from '@/components/neob/ui/FilterSelect';
import { FilterToolbar } from '@/components/neob/ui/FilterToolbar';
import { AlertBanner } from '@/components/neob/ui/AlertBanner';

interface ArchivedUserEntry {
  user: UserProfile;
  hasEventHistory: boolean;
  registrationCount: number;
  registrations: Registration[];
}

type HistoryFilter = 'ALL' | 'WITH_EVENTS' | 'NO_EVENTS';

export default function ArchivedUsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [archivedUsers, setArchivedUsers] = useState<ArchivedUserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected user for registration history modal
  const [selectedUserForEvents, setSelectedUserForEvents] = useState<ArchivedUserEntry | null>(
    null,
  );

  const fetchArchivedUsers = async () => {
    setLoading(true);

    if (isMockMode) {
      const { formerUsers, pastUsers } = mockStore.getHistoricalUsers();
      const combined: ArchivedUserEntry[] = [
        ...pastUsers.map((p) => ({
          user: p.user,
          hasEventHistory: true,
          registrationCount: p.eventRegistrationsCount,
          registrations: p.registrations,
        })),
        ...formerUsers.map((f) => ({
          user: f.user,
          hasEventHistory: false,
          registrationCount: 0,
          registrations: [],
        })),
      ];
      setArchivedUsers(combined);
      setLoading(false);
    } else {
      try {
        const [usersSnap, allowedSnap, regsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'allowedUsers')),
          getDocs(getAllRegistrationsGroupRef()),
        ]);

        const allowedEmailSet = new Set<string>();
        allowedSnap.forEach((d) => allowedEmailSet.add(d.id.toLowerCase()));

        const allRegs: Registration[] = [];
        regsSnap.forEach((d) => allRegs.push({ id: d.id, ...d.data() } as Registration));

        const entries: ArchivedUserEntry[] = [];

        usersSnap.forEach((doc) => {
          const u = { uid: doc.id, ...doc.data() } as UserProfile;
          if (!allowedEmailSet.has(u.email.toLowerCase())) {
            const userRegs = allRegs.filter(
              (r) => r.userId === u.uid || r.emailSnapshot?.toLowerCase() === u.email.toLowerCase(),
            );

            entries.push({
              user: u,
              hasEventHistory: userRegs.length > 0,
              registrationCount: userRegs.length,
              registrations: userRegs,
            });
          }
        });

        setArchivedUsers(entries);
      } catch (err) {
        console.error('Error fetching archived users:', err);
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
    fetchArchivedUsers();

    if (isMockMode) {
      const unsubscribe = mockStore.subscribe(() => {
        fetchArchivedUsers();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const withEventsCount = archivedUsers.filter((h) => h.hasEventHistory).length;
  const noEventsCount = archivedUsers.filter((h) => !h.hasEventHistory).length;

  const filteredUsers = archivedUsers.filter((item) => {
    const matchesFilter =
      historyFilter === 'ALL'
        ? true
        : historyFilter === 'WITH_EVENTS'
          ? item.hasEventHistory
          : !item.hasEventHistory;

    const matchesSearch =
      searchQuery === '' ||
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-ink flex items-center gap-2">
          <FolderArchive className="w-6 h-6 text-accent" />
          <span>Archived Accounts & Registration History</span>
        </h1>
        <p className="text-caption text-ink-muted mt-1">
          Directory of student accounts no longer on the active whitelist. Login access is disabled,
          but student identities and tournament registration snapshots remain preserved.
        </p>
      </div>

      {/* Policy Banner */}
      <AlertBanner tone="warning" title="Access Status">
        Archived accounts cannot log in and are excluded from active Role Management. All historical
        registrations, team snapshots, and scores remain preserved.
      </AlertBanner>

      {/* Search & Filter Controls */}
      <FilterToolbar
        variant="bare"
        totalCount={archivedUsers.length}
        filteredCount={filteredUsers.length}
        countLabel="accounts"
        filterTitle="Filter archived accounts"
        filterCount={historyFilter !== 'ALL' ? 1 : 0}
        hasActiveFilters={historyFilter !== 'ALL' || Boolean(searchQuery.trim())}
        onReset={() => {
          setHistoryFilter('ALL');
          setSearchQuery('');
        }}
        search={
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by student name or email…"
            aria-label="Search archived accounts"
          />
        }
        filters={
          <div className="space-y-1.5">
            <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
              Account History Status
            </label>
            <FilterSelect
              value={historyFilter}
              onChange={(val) => setHistoryFilter(val as HistoryFilter)}
              options={[
                { value: 'ALL', label: `All Archived (${archivedUsers.length})` },
                { value: 'WITH_EVENTS', label: `With Event History (${withEventsCount})` },
                { value: 'NO_EVENTS', label: `No Event History (${noEventsCount})` },
              ]}
              icon={<FolderArchive className="w-4 h-4" />}
              ariaLabel="Filter archived accounts by history status"
              containerClassName="w-full"
            />
          </div>
        }
      />

      <DataTable
        columns={[
          {
            id: 'user',
            header: 'Student',
            primary: true,
            sortValue: (item) => item.user.name,
            cell: (item) => (
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="grid place-items-center w-8 h-8 rounded-full shrink-0
                    bg-brand-soft text-brand font-display font-bold text-micro uppercase"
                  aria-hidden
                >
                  {item.user.name.charAt(0) || 'U'}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink truncate">{item.user.name}</span>
                  <span className="block font-mono text-micro text-ink-faint truncate">
                    {item.user.email}
                  </span>
                </span>
              </div>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            sortValue: (item) => (item.hasEventHistory ? 1 : 0),
            cell: (item) =>
              item.hasEventHistory ? (
                <Badge tone="warn" size="sm">
                  Has history
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  No events
                </Badge>
              ),
          },
          {
            id: 'participation',
            header: 'Registrations',
            sortValue: (item) => item.registrationCount,
            cell: (item) =>
              item.registrationCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink nums">
                  <CalendarCheck className="w-3.5 h-3.5 text-accent" aria-hidden />
                  {item.registrationCount}
                </span>
              ) : (
                <span className="text-ink-faint">0</span>
              ),
          },
          {
            id: 'lastActive',
            header: 'Last active',
            sortValue: (item) =>
              item.user.lastLoginAt ? new Date(item.user.lastLoginAt).getTime() : 0,
            cell: (item) => (
              <span className="font-mono text-micro text-ink-muted">
                {item.user.lastLoginAt
                  ? new Date(item.user.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </span>
            ),
          },
        ]}
        rows={filteredUsers}
        rowKey={(item) => item.user.uid || item.user.email}
        caption="Archived accounts"
        actions={(item) =>
          item.registrationCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserForEvents(item)}
              leftIcon={<CalendarCheck className="w-3.5 h-3.5" />}
            >
              Registrations
            </Button>
          ) : (
            <span className="text-micro text-ink-faint">—</span>
          )
        }
        empty={
          loading ? (
            <div className="space-y-3">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : (
            <EmptyState
              icon={<FolderArchive />}
              title="No archived accounts"
              description="Accounts removed from the allowed registry appear here with their event history preserved."
            />
          )
        }
      />

      {/* Historical User Registrations Modal */}
      <Modal
        isOpen={!!selectedUserForEvents}
        onClose={() => setSelectedUserForEvents(null)}
        title="Preserved Event Registrations"
        subtitle={`${selectedUserForEvents?.user.name} (${selectedUserForEvents?.user.email})`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-caption sm:text-sm">
          <p className="text-caption text-ink-muted">
            Historical tournament & event registration records for this student.
          </p>

          <div className="max-h-72 overflow-y-auto space-y-2.5">
            {selectedUserForEvents?.registrations.map((reg, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-surface-sunken border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black font-display text-caption text-ink">
                    {reg.eventTitle || `Event #${reg.eventId}`}
                  </span>
                  <Badge
                    tone={
                      reg.status === 'CONFIRMED'
                        ? 'live'
                        : reg.status === 'CANCELLED'
                        ? 'danger'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {reg.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-caption text-ink-muted font-medium">
                  <div>
                    <span className="text-ink-faint font-bold">Programme: </span>
                    {reg.programmeSnapshot || 'N/A'}
                  </div>
                  <div>
                    <span className="text-ink-faint font-bold">Region: </span>
                    {reg.regionSnapshot || 'N/A'}
                  </div>
                  <div>
                    <span className="text-ink-faint font-bold">Registered: </span>
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-ink-faint font-bold">Type: </span>
                    {reg.registrationType}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-black dark:border-white">
            <Button type="button" variant="ghost" onClick={() => setSelectedUserForEvents(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
