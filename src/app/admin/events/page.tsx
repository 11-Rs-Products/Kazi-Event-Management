'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EventItem } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collectionGroup, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { Calendar, PlusCircle, Edit, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    if (isMockMode) {
      setEvents(mockStore.getEvents());
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(collectionGroup(db, 'subEvents'));
        const items: EventItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as EventItem));
        setEvents(items);
      } catch (err) {
        console.error('Error fetching admin events:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }
    fetchEvents();
  }, [user, router]);

  const handleToggleStatus = async (eventId: string, currentStatus: string) => {
    if (!user) return;
    const nextStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : currentStatus === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';

    if (isMockMode) {
      mockStore.updateEvent(eventId, { status: nextStatus as any }, user);
      fetchEvents();
    } else {
      try {
        // Find the group ID. If it's not present we assume communityDayAug26
        const evt = events.find(e => e.id === eventId);
        const groupId = evt?.groupId || 'communityDayAug26';
        const docRef = doc(db, 'events', groupId, 'subEvents', eventId);
        await updateDoc(docRef, { status: nextStatus, updatedAt: new Date().toISOString() });
        fetchEvents();
      } catch (err) {
        console.error('Status update error:', err);
      }
    }
  };

  if (!user || user.role === 'USER') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-kaziranga-600" />
            <span>Event Management</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
            Create, edit, publish, or close registration for Kaziranga House events.
          </p>
        </div>

        <Link href="/admin/events/new">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create New Event
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-kaziranga-500">Loading events...</div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center text-xs text-kaziranga-500">
            No events created yet. Click &quot;Create New Event&quot; to add your first competition.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((evt) => (
              <Card key={evt.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-kaziranga-950 dark:text-white">{evt.name}</h3>
                    <EventStatusBadge status={evt.status} registrationDeadline={evt.registrationDeadline} />
                  </div>
                  <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 line-clamp-2">
                    {evt.description}
                  </p>
                  <div className="text-[11px] text-kaziranga-500 flex flex-wrap gap-3 pt-1">
                    <span>Category: {evt.category}</span>
                    <span>Venue: {evt.venue}</span>
                    <span>Deadline: {new Date(evt.registrationDeadline).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(evt.id, evt.status)}
                  >
                    Toggle {evt.status === 'DRAFT' ? 'Publish' : evt.status === 'PUBLISHED' ? 'Close' : 'Publish'}
                  </Button>

                  <Link href={`/admin/events/${evt.id}/edit`}>
                    <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                      Edit
                    </Button>
                  </Link>

                  <Link href={`/events/${evt.groupId || 'communityDayAug26'}/subevents/${evt.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
