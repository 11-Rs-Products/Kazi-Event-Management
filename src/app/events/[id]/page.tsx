'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, MapPin, Users, Clock, ArrowLeft, FileText, ExternalLink, ShieldCheck } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    if (isMockMode) {
      const found = mockStore.getEventById(eventId);
      setEvent(found || null);
      if (user && found) {
        const regs = mockStore.getRegistrationsForUser(user.uid);
        setIsRegistered(regs.some((r) => r.eventId === found.id && r.status === 'CONFIRMED'));
      }
      setLoading(false);
    } else {
      try {
        const docRef = doc(db, 'events', eventId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const evData = { id: snap.id, ...snap.data() } as EventItem;
          setEvent(evData);

          if (user) {
            const regsQ = query(
              collection(db, 'registrations'),
              where('userId', '==', user.uid),
              where('eventId', '==', eventId),
              where('status', '==', 'CONFIRMED')
            );
            const regsSnap = await getDocs(regsQ);
            setIsRegistered(!regsSnap.empty);
          }
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [eventId, user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-kaziranga-500">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-kaziranga-950 dark:text-white">Event Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/events')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Events Catalog
        </Button>
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull =
    event.maximumParticipants !== null &&
    (event.currentRegistrationCount || 0) >= (event.maximumParticipants || 0);

  const canRegister = event.status === 'PUBLISHED' && !isDeadlinePassed && !isFull && !isRegistered;

  const defaultImage =
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/events')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-700 dark:text-kaziranga-300 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events Catalog</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-kaziranga-900 border border-kaziranga-100 dark:border-kaziranga-800 shadow-xl h-64 sm:h-80">
        <img
          src={event.coverImageUrl || defaultImage}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/60 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-kaziranga-950/80 backdrop-blur-md text-white text-xs font-bold border border-kaziranga-700/50">
              {event.category}
            </span>
            <EventStatusBadge status={event.status} registrationDeadline={event.registrationDeadline} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-kaziranga-950 dark:text-white uppercase tracking-wider text-kaziranga-400">
              About the Event
            </h2>
            <div className="text-sm text-kaziranga-800 dark:text-kaziranga-200 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>

            {event.rulebookUrl && (
              <div className="pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
                <a
                  href={event.rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 text-kaziranga-800 dark:text-kaziranga-200 text-xs font-bold hover:bg-kaziranga-100 dark:hover:bg-kaziranga-800 transition-colors border border-kaziranga-200 dark:border-kaziranga-800"
                >
                  <FileText className="w-4 h-4 text-kaziranga-600" />
                  <span>Download Official Rulebook PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Key Info Box */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-kaziranga-400">
              Event Metadata
            </h3>

            <div className="space-y-3 text-xs text-kaziranga-700 dark:text-kaziranga-300">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-950 dark:text-white">Start Date & Time</div>
                  <div>{new Date(event.startDateTime).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-950 dark:text-white">Registration Deadline</div>
                  <div>{new Date(event.registrationDeadline).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-950 dark:text-white">Venue</div>
                  <div>{event.venue}</div>
                </div>
              </div>

              {event.maximumParticipants && (
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-kaziranga-950 dark:text-white">Capacity Limit</div>
                    <div>{event.currentRegistrationCount || 0} / {event.maximumParticipants} Seats Filled</div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
              {canRegister ? (
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  Register Now
                </Button>
              ) : isRegistered ? (
                <Button size="lg" variant="secondary" className="w-full" disabled>
                  Registration Confirmed
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="w-full" disabled>
                  Registration Closed
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <RegistrationModal
        event={event}
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
