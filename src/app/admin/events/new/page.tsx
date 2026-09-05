'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventForm } from '@/components/admin/EventForm';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { setDoc, doc, collection } from 'firebase/firestore';
import { getEventRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.role === 'USER') {
    return null;
  }

  const handleCreate = async (eventData: any) => {
    setIsLoading(true);
    try {
      if (isMockMode) {
        mockStore.createEvent(
          {
            ...eventData,
            createdBy: user.uid,
          },
          user,
        );
      } else {
        const eventId = 'evt_' + Date.now();
        const mainEvtId = eventData.mainEventId || 'communityDayAug26'; // Mapping legacy groupId to mainEventId
        const docRef = getEventRef(DEFAULT_TENURE_ID, mainEvtId, eventId);
        const isPublished = eventData.status === 'PUBLISHED';
        const newEvent = {
          ...eventData,
          id: eventId,
          mainEventId: mainEvtId,
          tenureId: DEFAULT_TENURE_ID,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentRegistrationCount: 0,
          hasBeenPublished: isPublished,
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
        };
        await setDoc(docRef, newEvent);

        if (isPublished) {
          const notifDoc = doc(collection(db, 'notifications'));
          await setDoc(notifDoc, {
            id: notifDoc.id,
            userId: 'GLOBAL',
            title: 'New Event Published',
            message: `${newEvent.name} is now open for registration.`,
            type: 'EVENT',
            linkUrl: `/events/${eventId}`,
            read: false,
            isGlobal: true,
            createdAt: new Date().toISOString(),
          });
        }
      }

      router.push('/admin/events');
    } catch (err: any) {
      console.error('Failed to create event:', err);
      toast.error('Could not create event', err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
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
            <span>Create Event</span>
          </h1>
          <p className="text-caption text-ink-muted mt-0.5">
            Configure details, schedule, deliverables, and registration settings.
          </p>
        </div>
      </div>

      <Card className="p-5 sm:p-6 overflow-visible">
        <EventForm onSubmit={handleCreate} isLoading={isLoading} />
      </Card>
    </div>
  );
}
