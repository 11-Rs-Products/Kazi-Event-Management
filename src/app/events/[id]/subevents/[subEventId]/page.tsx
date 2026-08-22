'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { getDoc, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { getEventRef, getEventsCollectionRef, getRegistrationsCollectionRef, getRegistrationRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { mockStore } from '@/lib/firebase/mockStore';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { SubmissionModal } from '@/components/events/SubmissionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, MapPin, Users, Clock, ArrowLeft, FileText, ExternalLink, UploadCloud, UserCheck } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';
import { formatDate } from '@/lib/utils/formatDate';
import { CountdownTimer } from '@/components/events/CountdownTimer';

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
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Team join query params
  const searchParams = useSearchParams();
  const joinTeamId = searchParams.get('teamId') || undefined;
  const joinInvitationId = searchParams.get('invitationId') || undefined;
  const isTeamJoin = !!(joinTeamId && joinInvitationId);

  const fetchDetail = async () => {
    setLoading(true);
    if (isMockMode) {
      const allEvents = mockStore.getEvents();
      const evData = allEvents.find(e => e.id === subEventId || e.slug === subEventId) || null;
      setEvent(evData);
      
      if (user && evData) {
        const regs = mockStore.getRegistrationsForUser(user.uid);
        const myReg = regs.find(r => (r.eventId === evData.id || r.eventId === subEventId) && r.status === 'CONFIRMED');
        setIsRegistered(!!myReg);
        setMyRegistration(myReg || null);
      }
      
      setLoading(false);
    } else {
      try {
        let evData: EventItem | null = null;
        
        // 1. Try finding directly by Document ID
        const docRef = getEventRef(DEFAULT_TENURE_ID, groupId, subEventId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          evData = { id: snap.id, ...(snap.data() as any) } as EventItem;
        } else {
          // 2. If not found by doc ID, search by URL slug
          const slugQ = query(
            getEventsCollectionRef(DEFAULT_TENURE_ID, groupId),
            where('slug', '==', subEventId)
          );
          const slugSnap = await getDocs(slugQ);
          if (!slugSnap.empty) {
            evData = { id: slugSnap.docs[0].id, ...(slugSnap.docs[0].data() as any) } as EventItem;
          }
        }

        setEvent(evData);

        if (user && evData) {
          // Using getRegistrationsCollectionRef to query the specific registrations subcollection
          const regsQ = query(
            getRegistrationsCollectionRef(DEFAULT_TENURE_ID, groupId, evData.id),
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
      } catch (err) {
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelRegistration = () => {
    setIsCancelModalOpen(true);
  };

  const executeCancelRegistration = async () => {
    if (!user || !myRegistration) return;

    setIsCancelling(true);
    if (isMockMode) {
      mockStore.cancelRegistration(myRegistration.id, user.uid);
      setIsCancelling(false);
      setIsCancelModalOpen(false);
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
        
        setIsCancelling(false);
        setIsCancelModalOpen(false);
        fetchDetail();
      } catch (err) {
        console.error('Cancel registration error:', err);
        setIsCancelling(false);
        setIsCancelModalOpen(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchDetail();
  }, [subEventId, groupId, user, authLoading]);

  // Auto-open registration modal when team join params are present
  useEffect(() => {
    if (isTeamJoin && event && !loading && !isRegistered) {
      setIsRegisterModalOpen(true);
    }
  }, [isTeamJoin, event, loading, isRegistered]);

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

        <CountdownTimer targetDate={event.startDateTime} />

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-kaziranga-800/80 backdrop-blur-sm text-cream-200 text-xs font-bold border border-kaziranga-700/40 font-display">
              {Array.isArray(event.category) ? event.category.join(', ') : event.category}
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
            <h2 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider">
              About the Activity
            </h2>
            <div 
              className="text-sm text-kaziranga-800 dark:text-cream-200 leading-relaxed break-words overflow-x-auto prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />

            {event.rulebookUrl && (
              <div className="pt-4 border-t border-cream-400/20 dark:border-kaziranga-800">
                <a
                  href={event.rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream-200/50 dark:bg-kaziranga-900/60 text-kaziranga-800 dark:text-cream-100 text-xs font-bold hover:bg-cream-300/60 dark:hover:bg-kaziranga-800 transition-colors border border-cream-400/30 dark:border-kaziranga-800"
                >
                  <FileText className="w-4 h-4 text-kaziranga-600 dark:text-kaziranga-400" />
                  <span>Download Official Rulebook PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </Card>

          {/* Distinguished Guests & Speakers */}
          {event.hasGuests && event.guests && event.guests.length > 0 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-kaziranga-600 dark:text-gold-400" />
                <span>Distinguished Guests & Speakers</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.guests.map((guest, gIdx) => (
                  <div
                    key={guest.id || gIdx}
                    className="p-4 rounded-xl bg-cream-100/70 dark:bg-kaziranga-900/60 border border-cream-400/30 dark:border-kaziranga-800 space-y-2.5 transition-all hover:border-kaziranga-500/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {guest.photoUrl ? (
                          <img
                            src={getOptimizedImageUrl(guest.photoUrl) || guest.photoUrl}
                            alt={guest.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-kaziranga-500/30 dark:border-gold-400/40 shrink-0"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-kaziranga-200/70 dark:bg-kaziranga-800 flex items-center justify-center text-kaziranga-700 dark:text-gold-400 font-bold text-sm shrink-0 border border-cream-400/30 dark:border-kaziranga-700">
                            {guest.name ? guest.name.charAt(0).toUpperCase() : <UserCheck className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 truncate">
                            {guest.name}
                          </h3>
                          {guest.designation && (
                            <p className="text-xs font-semibold text-kaziranga-600 dark:text-gold-400 truncate">
                              {guest.designation}
                            </p>
                          )}
                        </div>
                      </div>
                      {guest.socialLinks && (
                        <a
                          href={(guest.socialLinks || '').startsWith('http') ? guest.socialLinks : `https://${guest.socialLinks}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-cream-200/80 dark:bg-kaziranga-800 text-kaziranga-700 hover:text-kaziranga-950 dark:text-cream-300 dark:hover:text-white transition-colors shrink-0"
                          title="View Profile / Social Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {guest.about && (
                      <p className="text-xs text-kaziranga-700 dark:text-cream-300/80 leading-relaxed">
                        {guest.about}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Key Info Box */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-kaziranga-700 dark:text-cream-300 font-display">
              Activity Metadata
            </h3>

            <div className="space-y-3 text-xs text-kaziranga-700 dark:text-cream-300/80">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-900 dark:text-cream-100">Start Date & Time</div>
                  <div>{formatDate(event.startDateTime)}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-900 dark:text-cream-100">Registration Deadline</div>
                  <div>{formatDate(event.registrationDeadline)}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-kaziranga-900 dark:text-cream-100">Venue</div>
                  <div>
                    {event.venueType !== 'TEXT' && event.venue ? (
                      <a href={(event.venue || '').startsWith('http') ? event.venue : `https://${event.venue}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-kaziranga-600 dark:text-cream-300">
                        {event.venue}
                      </a>
                    ) : (
                      event.venue
                    )}
                  </div>
                </div>
              </div>

              {event.maximumParticipants && (
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-kaziranga-900 dark:text-cream-100">Capacity Limit</div>
                    <div>{event.currentRegistrationCount || 0} / {event.maximumParticipants} Seats Filled</div>
                  </div>
                </div>
              )}

              {event.requireSubmission && (
                <div className="flex items-start gap-2.5">
                  <UploadCloud className="w-4 h-4 text-kaziranga-500 dark:text-kaziranga-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-kaziranga-900 dark:text-cream-100">Project Deliverables</div>
                    <div className="space-y-2 mt-1">
                      {(Array.isArray(event.submissionTiming) ? event.submissionTiming.includes('DURING_REGISTRATION') : event.submissionTiming === 'DURING_REGISTRATION') && (
                        <div>Submitted during registration</div>
                      )}
                      {(Array.isArray(event.submissionTiming) ? event.submissionTiming.includes('AFTER_REGISTRATION') : event.submissionTiming === 'AFTER_REGISTRATION') && (
                        <div>
                          <div>Submissions accepted after registration</div>
                          {event.submissionRequirements && event.submissionRequirements.filter((r) => r.timing === 'AFTER_REGISTRATION').length > 0 ? (
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                              {event.submissionRequirements.filter((r) => r.timing === 'AFTER_REGISTRATION').map(req => {
                                const dl = req.deadline || event.submissionDeadline;
                                return (
                                  <li key={req.id}>
                                    <span className="font-semibold text-kaziranga-800 dark:text-cream-200">{req.label}</span>
                                    {dl && <span className="text-[10px] ml-1 text-rose-500 font-bold">(Due: {formatDate(dl)})</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            event.submissionDeadline && <div className="text-[10px] text-rose-500 font-bold mt-0.5">Deadline: {formatDate(event.submissionDeadline)}</div>
                          )}
                        </div>
                      )}
                    </div>
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
                  <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                    <UserCheck className="w-4 h-4" />
                    Registration Confirmed
                  </div>
                  
                  {event.requireSubmission && (
                    <div className="pt-3">
                      <Button 
                        variant="primary" 
                        size="lg"
                        className="w-full shadow-lg shadow-kaziranga-900/10"
                        leftIcon={<UploadCloud className="w-5 h-5" />}
                        onClick={() => setIsSubmissionModalOpen(true)}
                      >
                        {myRegistration?.submittedAt ? 'Edit / Update Submission' : 'Submit Deliverable'}
                      </Button>
                      <p className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 text-center mt-2 px-2 leading-relaxed">
                        {event.submissionInstructions || 'Please upload your project deliverables before the deadline.'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 mt-2 border-t border-cream-400/20 dark:border-kaziranga-800">
                    <Button 
                      variant="outline" 
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-950/30" 
                      onClick={handleCancelRegistration}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setIsRegisterModalOpen(true)}
                    >
                      Edit Reg
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
        joinTeamId={joinTeamId}
        joinInvitationId={joinInvitationId}
      />

      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        event={event}
        registration={myRegistration}
        onSuccess={() => fetchDetail()}
      />

      {/* Confirmation Modal for Registration Cancellation */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={executeCancelRegistration}
        title="Cancel Registration?"
        message="Are you sure you want to cancel your registration for this event? Your spot will be released immediately, and you can re-register anytime while spots remain available."
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}
