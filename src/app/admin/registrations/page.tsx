'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';
import { RegistrationTable } from '@/components/admin/RegistrationTable';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';
import { Ticket } from 'lucide-react';

export default function AdminRegistrationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
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
        setLoading(false);
      } else {
        try {
          const regSnap = await getDocs(collection(db, 'registrations'));
          const regList: Registration[] = [];
          regSnap.forEach((d) => regList.push({ id: d.id, ...d.data() } as Registration));

          const evSnap = await getDocs(collectionGroup(db, 'subEvents'));
          const evList: EventItem[] = [];
          evSnap.forEach((d) => evList.push({ id: d.id, ...d.data() } as EventItem));

          setRegistrations(regList);
          setEvents(evList);
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
        <RegistrationTable registrations={registrations} events={events} />
      )}
    </div>
  );
}
