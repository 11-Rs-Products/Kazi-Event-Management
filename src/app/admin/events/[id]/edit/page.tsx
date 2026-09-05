'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem } from '@/types';
import { EventForm } from '@/components/admin/EventForm';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { updateDoc, query, where, getDocs, doc, collection, setDoc } from 'firebase/firestore';
import {
  getAllEventsGroupRef,
  getEventRef,
  DEFAULT_TENURE_ID,
  DEFAULT_MAIN_EVENT_ID,
} from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
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
    return <div className="p-8 text-center text-caption text-ink-faint">Loading event data...</div>;
  }

  if (!event) {
    return <div className="p-12 text-center text-caption text-ink-faint">Event not found.</div>;
  }

  const handleUpdate = async (eventData: any) => {
    setIsSubmitting(true);
    try {
      if (isMockMode) {
        mockStore.updateEvent(eventId, eventData, user);
      } else {
        const docRef = getEventRef(
          event?.tenureId || DEFAULT_TENURE_ID,
          event?.mainEventId || DEFAULT_MAIN_EVENT_ID,
          eventId,
        );
        const wasPublished = event.status === 'PUBLISHED';
        const willBePublished = (eventData.status ?? event.status) === 'PUBLISHED';
        const hasBeenPublished = Boolean(event.hasBeenPublished || wasPublished || willBePublished);

        await updateDoc(docRef, {
          ...eventData,
          hasBeenPublished,
          customQuestions: eventData.customQuestions || [],
          maximumParticipants: eventData.maximumParticipants ?? null,
          maximumTeamSize: eventData.maximumTeamSize ?? null,
          rulebookUrl: eventData.rulebookUrl ?? null,
          coverImageUrl: eventData.coverImageUrl ?? null,
          requireSubmission: eventData.requireSubmission ?? false,
          submissionTiming: eventData.submissionTiming ?? 'DURING_REGISTRATION',
          submissionType: eventData.submissionType ?? 'LINK',
          submissionInstructions: eventData.submissionInstructions ?? null,
          submissionDeadline: eventData.submissionDeadline ?? null,
          updatedAt: new Date().toISOString(),
        });

        if (!wasPublished && willBePublished) {
          const notifDoc = doc(collection(db, 'notifications'));
          await setDoc(notifDoc, {
            id: notifDoc.id,
            userId: 'GLOBAL',
            title: event.hasBeenPublished ? 'Event Re-Published' : 'New Event Published',
            message: event.hasBeenPublished
              ? `${eventData.name || event.name} has been re-published and is open for registration.`
              : `${eventData.name || event.name} is now open for registration.`,
            type: 'EVENT',
            linkUrl: `/events/${eventId}`,
            read: false,
            isGlobal: true,
            createdAt: new Date().toISOString(),
          });
        } else if (wasPublished && !willBePublished) {
          const notifDoc = doc(collection(db, 'notifications'));
          await setDoc(notifDoc, {
            id: notifDoc.id,
            userId: 'GLOBAL',
            title: 'Event Removed',
            message: `${eventData.name || event.name} has been removed from published events.`,
            type: 'WARNING',
            read: false,
            isGlobal: true,
            createdAt: new Date().toISOString(),
          });
        }

        const scheduleOrVenueChanged =
          (eventData.startDateTime && eventData.startDateTime !== event.startDateTime) ||
          (eventData.endDateTime && eventData.endDateTime !== event.endDateTime) ||
          (eventData.venue && eventData.venue !== event.venue);

        if (wasPublished && willBePublished && scheduleOrVenueChanged) {
          try {
            const regsSnap = await getDocs(
              query(
                collection(db, 'registrations'),
                where('eventId', '==', eventId),
                where('status', '==', 'CONFIRMED')
              )
            );
            const userIds = Array.from(new Set(regsSnap.docs.map((d) => d.data().userId)));
            await Promise.all(
              userIds.map((uid) => {
                const notifDoc = doc(collection(db, 'notifications'));
                return setDoc(notifDoc, {
                  id: notifDoc.id,
                  userId: uid,
                  title: 'Event Details Updated',
                  message: `The venue/schedule for "${eventData.name || event.name}" has been updated. Check the event page for details.`,
                  type: 'INFO',
                  linkUrl: `/events/${eventId}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
              })
            );
          } catch (e) {
            console.error('Failed to dispatch schedule update notifications:', e);
          }
        }
      }
      router.push('/admin/events');
    } catch (err: any) {
      console.error('Failed to update event:', err);
      toast.error('Could not save changes', 'The event was not updated. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="p-2 rounded-xl hover:bg-brand-soft">
          <ArrowLeft className="w-5 h-5 text-ink-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2">
            <Calendar className="w-6 h-6 text-ink-muted" />
            <span>Edit Event</span>
          </h1>
          <p className="text-caption text-ink-muted mt-0.5">
            Modify event rules, venue, registration deadlines, and cover images.
          </p>
        </div>
      </div>

      <Card className="p-5 sm:p-6 overflow-visible">
        <EventForm initialData={event} onSubmit={handleUpdate} isLoading={isSubmitting} />
      </Card>
    </div>
  );
}
