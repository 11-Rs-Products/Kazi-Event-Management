'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { getDoc, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { getEventRef, getRegistrationsCollectionRef, getRegistrationRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { mockStore } from '@/lib/firebase/mockStore';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, MapPin, Users, Clock, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';

export default function SubEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params.id as string;
  const subEventId = params.subEventId as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    if (isMockMode) {
      const allEvents = mockStore.getEvents();
      const evData = allEvents.find(e => e.id === subEventId) || null;
      setEvent(evData);
      
      if (user && evData) {
        const regs = mockStore.getRegistrationsForUser(user.uid);
        const myReg = regs.find(r => r.eventId === subEventId && r.status === 'CONFIRMED');
        setIsRegistered(!!myReg);
        setMyRegistration(myReg || null);
      }
      
      setLoading(false);
    } else {
      try {
        const docRef = getEventRef(DEFAULT_TENURE_ID, groupId, subEventId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const evData = { id: snap.id, ...snap.data() } as EventItem;
          setEvent(evData);

          if (user) {
            // Using getRegistrationsCollectionRef to query the specific registrations subcollection
            const regsQ = query(
              getRegistrationsCollectionRef(DEFAULT_TENURE_ID, groupId, subEventId),
              where('userId', '==', user.uid),
              where('status', '==', 'CONFIRMED')
            );
            const regsSnap = await getDocs(regsQ);
            if (!regsSnap.empty) {
              setIsRegistered(true);
              setMyRegistration({ id: regsSnap.docs[0].id, ...regsSnap.docs[0].data() } as Registration);
            } else {
              setIsRegistered(false);
              setMyRegistration(null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelRegistration = async () => {
    if (!user || !myRegistration) return;
    if (!confirm('Are you sure you want to cancel your registration for this event?')) return;

    setLoading(true);
    if (isMockMode) {
      mockStore.cancelRegistration(myRegistration.id, user.uid);
      fetchDetail();
    } else {
      try {
        const docRef = getRegistrationRef(
          myRegistration.tenureId || DEFAULT_TENURE_ID, 
          myRegistration.mainEventId || DEFAULT_MAIN_EVENT_ID, 
          myRegistration.eventId, 
          myRegistration.subEventId, 
          myRegistration.id
        );
        await updateDoc(docRef, { status: 'CANCELLED', updatedAt: new Date().toISOString() });
        
        const eventRef = getEventRef(
          myRegistration.tenureId || DEFAULT_TENURE_ID, 
          myRegistration.mainEventId || DEFAULT_MAIN_EVENT_ID, 
          myRegistration.eventId
        );
        await updateDoc(eventRef, { currentRegistrationCount: increment(-1) });
        
        fetchDetail();
      } catch (err) {
        console.error('Cancel registration error:', err);
        alert('Failed to cancel registration');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchDetail();
  }, [subEventId, groupId, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="p-8 text-center text-xs text-kaziranga-500">
        Loading activity details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-kaziranga-800 dark:text-cream-100">Activity Not Found</h2>
        <Button variant="outline" onClick={() => router.push(`/events/${groupId}`)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Collection
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
        onClick={() => router.push(`/events/${groupId}`)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-700 dark:text-cream-400/60 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collection</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-kaziranga-900 border border-cream-400/20 dark:border-kaziranga-800 shadow-xl h-64 sm:h-80">
        <img
          src={getOptimizedImageUrl(event.coverImageUrl) || defaultImage}
          alt={event.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = defaultImage; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/60 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-kaziranga-800/80 backdrop-blur-sm text-cream-200 text-xs font-bold border border-kaziranga-700/40 font-display">
              {event.category}
            </span>
            <EventStatusBadge status={event.status} registrationDeadline={event.registrationDeadline} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-cream-50 leading-tight">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-kaziranga-800 dark:text-cream-100 uppercase tracking-wider text-kaziranga-400">
              About the Activity
            </h2>
            <div className="text-sm text-kaziranga-800 dark:text-kaziranga-200 leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
              {event.description}
            </div>

            {event.rulebookUrl && (
              <div className="pt-4 border-t border-cream-400/20 dark:border-kaziranga-900">
                <a
                  href={event.rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 text-kaziranga-800 dark:text-kaziranga-200 text-xs font-bold hover:bg-kaziranga-100 dark:hover:bg-kaziranga-800 transition-colors border border-cream-400/30 dark:border-kaziranga-800"
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
              Activity Metadata
            </h3>

            <div className="space-y-3 text-xs text-kaziranga-700 dark:text-cream-400/60">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-800 dark:text-cream-100">Start Date & Time</div>
                  <div>{new Date(event.startDateTime).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-800 dark:text-cream-100">Registration Deadline</div>
                  <div>{new Date(event.registrationDeadline).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-800 dark:text-cream-100">Venue</div>
                  <div>{event.venue}</div>
                </div>
              </div>

              {event.maximumParticipants && (
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-kaziranga-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-kaziranga-800 dark:text-cream-100">Capacity Limit</div>
                    <div>{event.currentRegistrationCount || 0} / {event.maximumParticipants} Seats Filled</div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-cream-400/20 dark:border-kaziranga-900">
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
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-kaziranga-100 dark:bg-kaziranga-900/60 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-800 dark:text-cream-100 text-sm font-bold">
                    Registration Confirmed
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200" 
                      onClick={handleCancelRegistration}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      onClick={() => setIsRegisterModalOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
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
        existingRegistration={myRegistration}
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
