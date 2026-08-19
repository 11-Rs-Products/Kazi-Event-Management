'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs } from 'firebase/firestore';
import { getAllEventsGroupRef, getAllRegistrationsGroupRef, getMainEventsCollectionRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CSVExportButton } from '@/components/admin/CSVExportButton';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';
import { Shield, Calendar, Ticket, PlusCircle, ArrowRight, FileSpreadsheet, Users, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (isMockMode) {
        setEvents(mockStore.getEvents());
        const sortedMockRegs = [...mockStore.getRegistrations()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRegistrations(sortedMockRegs);
        setMainEvents([{ id: 'communityDayAug26', name: 'Community Day', tenureId: '2026-2027', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }]);
        setLoading(false);
      } else {
        try {
          const evSnap = await getDocs(getAllEventsGroupRef());
          const evs: EventItem[] = [];
          evSnap.forEach((d) => {
            if (d.ref.path.includes('tenures/')) {
              evs.push({ id: d.id, ...d.data() } as EventItem);
            }
          });

          const regSnap = await getDocs(getAllRegistrationsGroupRef());
          const regs: Registration[] = [];
          regSnap.forEach((d) => {
            if (d.ref.path.includes('tenures/')) {
              const data = d.data();
              regs.push({ 
                id: d.id, 
                ...data,
                nameSnapshot: data.nameSnapshot || data.name || '',
                emailSnapshot: data.emailSnapshot || data.email || '',
                phoneSnapshot: data.phoneSnapshot || data.phone || '',
                regionSnapshot: data.regionSnapshot || data.region || '',
                levelSnapshot: data.levelSnapshot || data.level || '',
                programmeSnapshot: data.programmeSnapshot || data.programme || ''
              } as Registration);
            }
          });

          const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
          const mains: MainEvent[] = [];
          mainSnap.forEach((d) => mains.push({ id: d.id, ...d.data() } as MainEvent));

          setEvents(evs);
          regs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRegistrations(regs);
          setMainEvents(mains);
        } catch (err) {
          console.error('Admin dashboard fetch error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, router]);

  if (!user || user.role === 'USER') return null;

  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED');
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      <AdminNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-500" />
            <span>Admin Control Center</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
            Manage event lifecycles, view participant data, and generate export reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CSVExportButton registrations={confirmedRegistrations} filename="all_kaziranga_registrations.csv" />
          <Link href="/admin/events/new">
            <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-kaziranga-500 font-bold uppercase tracking-wider">Total Events</div>
          <div className="text-2xl font-black text-kaziranga-950 dark:text-white">{events.length}</div>
          <div className="text-[10px] text-kaziranga-500">Drafts & Published</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Active Published</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{publishedEvents.length}</div>
          <div className="text-[10px] text-kaziranga-500">Open for Registration</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-sky-600 font-bold uppercase tracking-wider">Total Registrations</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{confirmedRegistrations.length}</div>
          <div className="text-[10px] text-kaziranga-500">Confirmed Students</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[11px] text-gold-600 font-bold uppercase tracking-wider">Admin Status</div>
          <div className="text-sm font-bold text-gold-600 dark:text-gold-400 truncate">{user.role}</div>
          <div className="text-[10px] text-kaziranga-500">Authenticated</div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">Event List & Management</h3>
            <Link href="/admin/events" className="text-xs font-bold text-kaziranga-700 dark:text-kaziranga-300 hover:underline">
              Manage All Events
            </Link>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-kaziranga-50/80 dark:bg-kaziranga-900/50 text-[11px] font-bold uppercase tracking-wider text-kaziranga-600 dark:text-kaziranga-400 border-b border-kaziranga-100 dark:border-kaziranga-900">
                    <th className="p-3.5">Event Name</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Deadline</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kaziranga-100 dark:divide-kaziranga-900">
                  {mainEvents.map((mainEvent) => {
                    const subEvents = events.filter(e => e.mainEventId === mainEvent.id);
                    if (subEvents.length === 0) return null;
                    return (
                      <React.Fragment key={mainEvent.id}>
                        {/* Group Header */}
                        <tr className="bg-kaziranga-50/40 dark:bg-kaziranga-900/20">
                          <td colSpan={4} className="p-3 text-[11px] font-black uppercase tracking-wider text-kaziranga-500 dark:text-kaziranga-400">
                            {mainEvent.name}
                          </td>
                        </tr>
                        {/* Sub Events */}
                        {subEvents.slice(0, 5).map((evt) => (
                          <tr key={evt.id} className="hover:bg-kaziranga-50/50 dark:hover:bg-kaziranga-900/30">
                            <td className="p-3.5 font-bold text-kaziranga-950 dark:text-white pl-6 relative">
                              <div className="absolute left-3 top-0 bottom-0 w-px bg-kaziranga-200 dark:bg-kaziranga-800"></div>
                              <div className="absolute left-3 top-1/2 w-2 h-px bg-kaziranga-200 dark:bg-kaziranga-800"></div>
                              {evt.name}
                            </td>
                            <td className="p-3.5">
                              <Badge variant={evt.status === 'PUBLISHED' ? 'emerald' : 'amber'} size="sm">
                                {evt.status}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-kaziranga-600 dark:text-kaziranga-300">
                              {new Date(evt.registrationDeadline).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 text-right">
                              <Link href={`/admin/events/${evt.id}/edit`}>
                                <Button size="sm" variant="ghost">
                                  Edit
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Registrations (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">Recent Registrations</h3>
            <Link href="/admin/registrations" className="text-xs font-bold text-kaziranga-700 dark:text-kaziranga-300 hover:underline">
              View Table
            </Link>
          </div>

          <Card className="p-4 divide-y divide-kaziranga-100 dark:divide-kaziranga-900">
            {confirmedRegistrations.slice(0, 5).map((reg) => {
              const mainEvent = mainEvents.find(m => m.id === reg.mainEventId);
              return (
                <div key={reg.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-kaziranga-950 dark:text-white">{reg.nameSnapshot}</span>
                    <span className="text-[10px] text-kaziranga-500">{new Date(reg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] text-kaziranga-600 dark:text-kaziranga-300 truncate">
                    {mainEvent ? `${mainEvent.name} • ` : ''}{reg.eventTitle}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
