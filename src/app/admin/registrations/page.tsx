'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs } from 'firebase/firestore';
import { getAllRegistrationsGroupRef, getAllEventsGroupRef, getMainEventsCollectionRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { RegistrationTable } from '@/components/admin/RegistrationTable';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';
import { Ticket } from 'lucide-react';

export default function AdminRegistrationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (isMockMode) {
        setRegistrations(mockStore.getRegistrations());
        setEvents(mockStore.getEvents());
        // For mock mode we can just spoof a main event
        setMainEvents([{ id: 'communityDayAug26', name: 'Community Day', tenureId: '2026-2027', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }]);
        setLoading(false);
      } else {
        try {
          const regSnap = await getDocs(getAllRegistrationsGroupRef());
          const regList: Registration[] = [];
          regSnap.forEach((d) => {
            if (d.ref.path.includes('tenures/')) {
              const data = d.data();
              regList.push({ 
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

          const evSnap = await getDocs(getAllEventsGroupRef());
          const evList: EventItem[] = [];
          evSnap.forEach((d) => {
            if (d.ref.path.includes('tenures/')) {
              evList.push({ id: d.id, ...d.data() } as EventItem);
            }
          });

          const mainEvSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
          const mainEvList: MainEvent[] = [];
          mainEvSnap.forEach((d) => {
            mainEvList.push({ id: d.id, ...d.data() } as MainEvent);
          });

          setRegistrations(regList);
          setEvents(evList);
          setMainEvents(mainEvList);
        } catch (err) {
          console.error('Error fetching registrations:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, router]);

  if (!user || user.role === 'USER') return null;

  return (
    <div className="space-y-6">
      <AdminNavTabs />
      <div>
        <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
          <span>Registration Management</span>
        </h1>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
          Search, filter by region, level, or programme, view participant snapshots, and export CSV reports.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
          Loading registration dataset...
        </div>
      ) : (
        <RegistrationTable registrations={registrations} events={events} mainEvents={mainEvents} />
      )}
    </div>
  );
}
