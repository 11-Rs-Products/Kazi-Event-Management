'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventForm } from '@/components/admin/EventForm';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { setDoc, doc } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
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
          user
        );
      } else {
        const eventId = 'evt_' + Date.now();
        const groupId = eventData.groupId; // Get from form submission
        const docRef = doc(db, 'events', groupId, 'subEvents', eventId);
        const newEvent = {
          ...eventData,
          id: eventId,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentRegistrationCount: 0,
        };
        await setDoc(docRef, newEvent);
      }

      router.push('/admin/events');
    } catch (err: any) {
      console.error('Failed to create event:', err);
      alert('Error creating event: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
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
            <span>Create New Inter-House Event</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-0.5">
            Fill in the event title, deadlines, rules, and publishing options.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <EventForm onSubmit={handleCreate} isLoading={isLoading} />
      </Card>
    </div>
  );
}
