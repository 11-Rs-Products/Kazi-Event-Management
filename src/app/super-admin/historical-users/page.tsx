'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs } from 'firebase/firestore';
import { SuperAdminNavTabs } from '@/components/super-admin/SuperAdminNavTabs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  History,
  Search,
  UserX,
  Calendar,
  Ticket,
  Clock,
  Mail,
  User,
  ExternalLink,
  ShieldAlert,
  FolderArchive,
  Info,
} from 'lucide-react';

interface HistoricalUserEntry {
  user: UserProfile;
  category: 'FORMER' | 'PAST';
  registrationCount: number;
  registrations: Registration[];
}

export default function HistoricalUsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [historicalUsers, setHistoricalUsers] = useState<HistoricalUserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAST' | 'FORMER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected past user for event history modal
  const [selectedUserForEvents, setSelectedUserForEvents] = useState<HistoricalUserEntry | null>(null);

  const fetchHistoricalUsers = async () => {
    setLoading(true);

    if (isMockMode) {
      const { formerUsers, pastUsers } = mockStore.getHistoricalUsers();
      const combined: HistoricalUserEntry[] = [
        ...pastUsers.map((p) => ({
          user: p.user,
          category: 'PAST' as const,
          registrationCount: p.eventRegistrationsCount,
          registrations: p.registrations,
        })),
        ...formerUsers.map((f) => ({
          user: f.user,
          category: 'FORMER' as const,
          registrationCount: 0,
          registrations: [],
        })),
      ];
      setHistoricalUsers(combined);
      setLoading(false);
    } else {
      try {
        const [usersSnap, allowedSnap, regsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'allowedUsers')),
          getDocs(collection(db, 'registrations')),
        ]);

        const allowedEmailSet = new Set<string>();
        allowedSnap.forEach((d) => allowedEmailSet.add(d.id.toLowerCase()));

        const allRegs: Registration[] = [];
        regsSnap.forEach((d) => allRegs.push({ id: d.id, ...d.data() } as Registration));

        const entries: HistoricalUserEntry[] = [];

        usersSnap.forEach((doc) => {
          const u = { uid: doc.id, ...doc.data() } as UserProfile;
          if (!allowedEmailSet.has(u.email.toLowerCase())) {
            const userRegs = allRegs.filter(
              (r) => r.userId === u.uid || r.emailSnapshot?.toLowerCase() === u.email.toLowerCase()
            );

            entries.push({
              user: u,
              category: userRegs.length > 0 ? 'PAST' : 'FORMER',
              registrationCount: userRegs.length,
              registrations: userRegs,
            });
          }
        });

        setHistoricalUsers(entries);
      } catch (err) {
        console.error('Error fetching historical users:', err);
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
    fetchHistoricalUsers();

    if (isMockMode) {
      const unsubscribe = mockStore.subscribe(() => {
        fetchHistoricalUsers();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const pastUsersCount = historicalUsers.filter((h) => h.category === 'PAST').length;
  const formerUsersCount = historicalUsers.filter((h) => h.category === 'FORMER').length;

  const filteredUsers = historicalUsers.filter((item) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'PAST'
        ? item.category === 'PAST'
        : item.category === 'FORMER';

    const matchesSearch =
      searchQuery === '' ||
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
          <FolderArchive className="w-6 h-6 text-gold-500" />
          <span>Historical & Former Users Archive</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
          Historical records of students who previously logged in or registered for events but are no longer in the active allowed-user list. Historical participation remains fully preserved.
        </p>
      </div>

      {/* Policy Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Access Status Distinction:</span> Historical users have no active login authorization and do not appear in active Role Management. All historical event logs and registrations are permanently preserved.
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-kaziranga-800 text-cream-100 dark:bg-cream-200 dark:text-kaziranga-900 shadow-sm'
                : 'bg-cream-200/60 dark:bg-kaziranga-900/60 text-kaziranga-700 dark:text-cream-400 hover:bg-cream-300/60'
            }`}
          >
            All Historical ({historicalUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PAST'
                ? 'bg-kaziranga-800 text-cream-100 dark:bg-cream-200 dark:text-kaziranga-900 shadow-sm'
                : 'bg-cream-200/60 dark:bg-kaziranga-900/60 text-kaziranga-700 dark:text-cream-400 hover:bg-cream-300/60'
            }`}
          >
            Past Users ({pastUsersCount})
          </button>
          <button
            onClick={() => setActiveTab('FORMER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FORMER'
                ? 'bg-kaziranga-800 text-cream-100 dark:bg-cream-200 dark:text-kaziranga-900 shadow-sm'
                : 'bg-cream-200/60 dark:bg-kaziranga-900/60 text-kaziranga-700 dark:text-cream-400 hover:bg-cream-300/60'
            }`}
          >
            Former Users ({formerUsersCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or email..."
            className="arena-input pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Historical List Card */}
      <Card className="overflow-hidden shadow-arena">
        {loading ? (
          <div className="p-12 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
            Loading historical users archive...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-kaziranga-500 dark:text-cream-400/50 space-y-2">
            <FolderArchive className="w-8 h-8 mx-auto text-kaziranga-400/40" />
            <p>No historical users found matching current filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="arena-table">
                <thead>
                  <tr>
                    <th>Student Name & Email</th>
                    <th>Category</th>
                    <th>Event Participation</th>
                    <th>Last Active</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item, i) => (
                    <tr key={i} className="hover:bg-cream-200/40 dark:hover:bg-kaziranga-900/40 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-kaziranga-100 dark:bg-kaziranga-800 text-kaziranga-700 dark:text-cream-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {item.user.name.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-kaziranga-800 dark:text-cream-100 text-xs">
                              {item.user.name}
                            </div>
                            <div className="font-mono text-[11px] text-kaziranga-500 dark:text-cream-400/60">
                              {item.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {item.category === 'PAST' ? (
                          <Badge variant="amber" size="sm">
                            Past User
                          </Badge>
                        ) : (
                          <Badge variant="slate" size="sm">
                            Former User
                          </Badge>
                        )}
                      </td>

                      <td>
                        {item.registrationCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-800 dark:text-cream-200">
                            <Ticket className="w-3.5 h-3.5 text-gold-500" />
                            <span>{item.registrationCount} Registered Events</span>
                          </span>
                        ) : (
                          <span className="text-xs text-kaziranga-400 dark:text-cream-500/40">
                            No event registrations
                          </span>
                        )}
                      </td>

                      <td className="text-xs text-kaziranga-600 dark:text-cream-400/70 font-mono">
                        {item.user.lastLoginAt
                          ? new Date(item.user.lastLoginAt).toLocaleDateString()
                          : 'No login recorded'}
                      </td>

                      <td className="text-right">
                        {item.registrationCount > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserForEvents(item)}
                            className="text-xs"
                            leftIcon={<Ticket className="w-3.5 h-3.5" />}
                          >
                            View Registrations
                          </Button>
                        ) : (
                          <span className="text-[11px] text-kaziranga-400 dark:text-cream-500/40 italic">
                            No history
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800/60">
              {filteredUsers.map((item, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-kaziranga-800 dark:text-cream-100">
                        {item.user.name}
                      </div>
                      <div className="font-mono text-[11px] text-kaziranga-500 dark:text-cream-400/60 break-all">
                        {item.user.email}
                      </div>
                    </div>
                    {item.category === 'PAST' ? (
                      <Badge variant="amber" size="sm">
                        Past
                      </Badge>
                    ) : (
                      <Badge variant="slate" size="sm">
                        Former
                      </Badge>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-cream-200/40 dark:bg-kaziranga-900/60 text-xs flex items-center justify-between">
                    <span className="text-kaziranga-600 dark:text-cream-400/60">Participation:</span>
                    <span className="font-bold text-kaziranga-800 dark:text-cream-100">
                      {item.registrationCount > 0 ? `${item.registrationCount} Events` : 'None'}
                    </span>
                  </div>

                  {item.registrationCount > 0 && (
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUserForEvents(item)}
                        className="text-xs"
                        leftIcon={<Ticket className="w-3.5 h-3.5" />}
                      >
                        View Registrations
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Historical User Registrations Modal */}
      <Modal
        isOpen={!!selectedUserForEvents}
        onClose={() => setSelectedUserForEvents(null)}
        title="Historical Event Registrations"
        subtitle={`${selectedUserForEvents?.user.name} (${selectedUserForEvents?.user.email})`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60">
            Preserved historical event registration snapshots for this student.
          </p>

          <div className="max-h-72 overflow-y-auto space-y-2.5">
            {selectedUserForEvents?.registrations.map((reg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-cream-200/40 dark:bg-kaziranga-900/60 border border-cream-400/20 dark:border-kaziranga-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-kaziranga-800 dark:text-cream-100">
                    {reg.eventTitle || `Event #${reg.eventId}`}
                  </span>
                  <Badge
                    variant={reg.status === 'CONFIRMED' ? 'emerald' : 'slate'}
                    size="sm"
                  >
                    {reg.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-kaziranga-600 dark:text-cream-400/70">
                  <div>
                    <span className="text-kaziranga-400 dark:text-cream-500/50">Programme: </span>
                    {reg.programmeSnapshot || 'N/A'}
                  </div>
                  <div>
                    <span className="text-kaziranga-400 dark:text-cream-500/50">Region: </span>
                    {reg.regionSnapshot || 'N/A'}
                  </div>
                  <div>
                    <span className="text-kaziranga-400 dark:text-cream-500/50">Registered on: </span>
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-kaziranga-400 dark:text-cream-500/50">Type: </span>
                    {reg.registrationType}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
            <Button type="button" variant="ghost" onClick={() => setSelectedUserForEvents(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
