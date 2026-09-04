'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs } from 'firebase/firestore';
import {
  getAllRegistrationsGroupRef,
  getAllEventsGroupRef,
  getMainEventsCollectionRef,
  DEFAULT_TENURE_ID,
} from '@/lib/firebase/paths';
import { RegistrationTable } from '@/components/admin/RegistrationTable';
import { SectionHeading } from '@/components/ui/Section';
import { RowSkeleton } from '@/components/ui/Skeleton';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';

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
        const sortedMockRegs = [...mockStore.getRegistrations()].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRegistrations(sortedMockRegs);
        setEvents(mockStore.getEvents());
        // For mock mode we can just spoof a main event
        setMainEvents([
          {
            id: 'communityDayAug26',
            name: 'Community Day',
            tenureId: '2026-2027',
            description: '',
            status: 'PUBLISHED',
            createdAt: '',
            updatedAt: '',
          },
        ]);
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
                programmeSnapshot: data.programmeSnapshot || data.programme || '',
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

          regList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    <div>
      <AdminNavTabs />

      <div className="space-y-7">
        <SectionHeading
          eyebrow="Admin control"
          title="Registrations"
          description="Search and filter participants, inspect their submitted details, and export CSV reports."
          size="lg"
          as="h1"
        />

        {loading ? (
          <div className="space-y-3">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : (
          <RegistrationTable
            registrations={registrations}
            events={events}
            mainEvents={mainEvents}
          />
        )}
      </div>
    </div>
  );
}
