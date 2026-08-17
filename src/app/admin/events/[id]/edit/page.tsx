'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem } from '@/types';
import { EventForm } from '@/components/admin/EventForm';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { updateDoc, query, where, getDocs } from 'firebase/firestore';
import { getAllEventsGroupRef, getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      if (isMockMode) {
        setEvent(mockStore.getEventById(eventId) || null);
        setLoading(false);
      } else {
        try {
          const q = query(getAllEventsGroupRef(), where('id', '==', eventId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setEvent({ id: snap.docs[0].id, ...snap.docs[0].data() } as EventItem);
          }
        } catch (err) {
          console.error('Error fetching event:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEvent();
  }, [eventId, user, router]);

  if (!user || user.role === 'USER') return null;

  if (loading) {
    return <div className="p-8 text-center text-xs text-kaziranga-500">Loading event data...</div>;
  }

  if (!event) {
    return <div className="p-12 text-center text-xs text-kaziranga-500">Event not found.</div>;
  }

  const handleUpdate = async (eventData: any) => {
    setIsSubmitting(true);
    try {
      if (isMockMode) {
        mockStore.updateEvent(eventId, eventData, user);
      } else {
        const docRef = getEventRef(event?.tenureId || DEFAULT_TENURE_ID, event?.mainEventId || DEFAULT_MAIN_EVENT_ID, eventId);
        await updateDoc(docRef, {
          ...eventData,
          updatedAt: new Date().toISOString(),
        });
      }
      router.push('/admin/events');
    } catch (err: any) {
      console.error('Failed to update event:', err);
      alert('Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="p-2 rounded-xl hover:bg-kaziranga-100 dark:hover:bg-kaziranga-900">
          <ArrowLeft className="w-5 h-5 text-kaziranga-700 dark:text-cream-400/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-kaziranga-600" />
            <span>Edit Event</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-0.5">
            Modify event rules, venue, registration deadlines, and cover images.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <EventForm initialData={event} onSubmit={handleUpdate} isLoading={isSubmitting} />
      </Card>
    </div>
  );
}
