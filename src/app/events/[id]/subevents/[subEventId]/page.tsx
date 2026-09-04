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
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Motion';
import { cn } from '@/lib/utils/cn';
import { Calendar, MapPin, Users, Clock, ArrowLeft, FileText, ExternalLink, UploadCloud, UserCheck, CalendarX2 } from 'lucide-react';
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
      <div className="space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-72 sm:h-96 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <EmptyState
          icon={<CalendarX2 />}
          title="Activity not found"
          description="This event may have been removed, or the link is out of date."
          action={
            <Button
              variant="primary"
              onClick={() => router.push(`/events/${groupId}`)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to festival
            </Button>
          }
        />
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull =
    event.maximumParticipants !== null &&
    (event.currentRegistrationCount || 0) >= (event.maximumParticipants || 0);

  const canRegister = event.status === 'PUBLISHED' && !isDeadlinePassed && !isFull && !isRegistered;

  const defaultImage =
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=80';

  const seatsPct = event.maximumParticipants
    ? Math.min(100, ((event.currentRegistrationCount || 0) / event.maximumParticipants) * 100)
    : null;

  const venueHref =
    event.venueType !== 'TEXT' && event.venue
      ? event.venue.startsWith('http')
        ? event.venue
        : `https://${event.venue}`
      : null;

  const submissionTimings = Array.isArray(event.submissionTiming)
    ? event.submissionTiming
    : event.submissionTiming
      ? [event.submissionTiming]
      : [];

  const afterRegRequirements = (event.submissionRequirements || []).filter(
    (r) => r.timing === 'AFTER_REGISTRATION'
  );

  /** One labelled row in the metadata rail. */
  const MetaRow: React.FC<{
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
  }> = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <dt className="text-eyebrow uppercase font-display text-ink-faint">{label}</dt>
        <dd className="text-caption text-ink font-medium break-words">{children}</dd>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <button
        onClick={() => router.push(`/events/${groupId}`)}
        className="inline-flex items-center gap-1.5 text-caption font-display font-semibold text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Back to festival
      </button>

      {/* ─── Masthead ─── */}
      <Reveal>
        <header className="relative rounded-3xl overflow-hidden ed-stage ed-grain border border-white/10 shadow-e-3 min-h-[18rem] sm:min-h-[24rem] flex items-end">
          <img
            src={getOptimizedImageUrl(event.coverImageUrl) || defaultImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = defaultImage;
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-stage via-stage/70 to-stage/20"
            aria-hidden
          />

          <div className="absolute top-5 right-5 z-[2]">
            <CountdownTimer targetDate={event.startDateTime} />
          </div>

          <div className="relative z-[2] p-6 sm:p-10 space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {event.category && (
                <Badge tone="inverse" size="sm">
                  {Array.isArray(event.category) ? event.category.join(' · ') : event.category}
                </Badge>
              )}
              <EventStatusBadge
                status={event.status}
                registrationDeadline={event.registrationDeadline}
                onImage
              />
            </div>
            <h1 className="font-display font-black text-display-lg text-white">{event.name}</h1>
          </div>
        </header>
      </Reveal>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* ─── Main column ─── */}
        <div className="xl:col-span-2 space-y-6 min-w-0">
          <Card elevation={1} className="p-6 sm:p-8 space-y-5">
            <h2 className="ed-eyebrow">About this activity</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none
                text-body text-ink-muted leading-relaxed break-words
                prose-headings:font-display prose-headings:text-ink
                prose-a:text-brand prose-strong:text-ink"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />

            {event.rulebookUrl && (
              <div className="pt-5 border-t border-hairline">
                <a
                  href={event.rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-xl
                    bg-surface-sunken border border-hairline text-caption font-display font-semibold text-ink
                    hover:border-hairline-strong hover:bg-surface-raised transition-colors"
                >
                  <FileText className="w-4 h-4 text-ink-faint" aria-hidden />
                  Official rulebook
                  <ExternalLink className="w-3.5 h-3.5 text-ink-faint" aria-hidden />
                </a>
              </div>
            )}
          </Card>

          {event.hasGuests && event.guests && event.guests.length > 0 && (
            <Card elevation={1} className="p-6 sm:p-8 space-y-5">
              <h2 className="ed-eyebrow">Guests &amp; speakers</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.guests.map((guest, gIdx) => (
                  <div
                    key={guest.id || gIdx}
                    className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-3
                      transition-colors hover:border-hairline-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {guest.photoUrl ? (
                          <img
                            src={getOptimizedImageUrl(guest.photoUrl) || guest.photoUrl}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-hairline-strong"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span
                            className="grid place-items-center w-11 h-11 rounded-full shrink-0
                              bg-brand-soft text-brand font-display font-bold"
                            aria-hidden
                          >
                            {guest.name ? guest.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-caption text-ink truncate">
                            {guest.name}
                          </h3>
                          {guest.designation && (
                            <p className="text-micro text-ink-muted truncate">
                              {guest.designation}
                            </p>
                          )}
                        </div>
                      </div>

                      {guest.socialLinks && (
                        <a
                          href={
                            guest.socialLinks.startsWith('http')
                              ? guest.socialLinks
                              : `https://${guest.socialLinks}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Profile for ${guest.name}`}
                          className="p-2 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-raised transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {guest.about && (
                      <p className="text-micro text-ink-muted leading-relaxed">{guest.about}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ─── Action rail ─── */}
        <div className="xl:col-span-1 xl:sticky xl:top-[calc(var(--navbar-height)+1.5rem)] space-y-4">
          <Card elevation={2}>
            <div className="px-5 pt-5 pb-4">
              <h3 className="ed-eyebrow">Key details</h3>
            </div>

            <dl className="px-5 pb-5 space-y-4">
              <MetaRow icon={Calendar} label="Starts">
                {formatDate(event.startDateTime)}
              </MetaRow>

              <MetaRow icon={Clock} label="Registration deadline">
                {formatDate(event.registrationDeadline)}
              </MetaRow>

              <MetaRow icon={MapPin} label="Venue">
                {venueHref ? (
                  <a
                    href={venueHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline break-words"
                  >
                    {event.venue}
                  </a>
                ) : (
                  event.venue
                )}
              </MetaRow>

              {event.maximumParticipants && (
                <MetaRow icon={Users} label="Capacity">
                  <span className="block nums">
                    {event.currentRegistrationCount || 0} of {event.maximumParticipants} seats
                    filled
                  </span>
                  <span
                    className="mt-2 block h-1.5 rounded-full bg-surface-sunken overflow-hidden"
                    aria-hidden
                  >
                    <span
                      className={cn(
                        'block h-full rounded-full transition-[width] duration-700 ease-editorial',
                        isFull ? 'bg-signal-danger' : 'bg-brand'
                      )}
                      style={{ width: `${seatsPct}%` }}
                    />
                  </span>
                </MetaRow>
              )}

              {event.requireSubmission && (
                <MetaRow icon={UploadCloud} label="Submissions">
                  <div className="space-y-2">
                    {submissionTimings.includes('DURING_REGISTRATION') && (
                      <p>Collected during registration</p>
                    )}

                    {submissionTimings.includes('AFTER_REGISTRATION') && (
                      <div className="space-y-1.5">
                        <p>Accepted after registration</p>
                        {afterRegRequirements.length > 0 ? (
                          <ul className="space-y-1">
                            {afterRegRequirements.map((req) => {
                              const dl = req.deadline || event.submissionDeadline;
                              return (
                                <li key={req.id} className="text-micro">
                                  <span className="font-semibold text-ink">{req.label}</span>
                                  {dl && (
                                    <span className="ml-1.5 text-signal-danger font-semibold">
                                      due {formatDate(dl)}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          event.submissionDeadline && (
                            <p className="text-micro text-signal-danger font-semibold">
                              Deadline {formatDate(event.submissionDeadline)}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </MetaRow>
              )}
            </dl>

            <div className="px-5 py-5 border-t border-hairline space-y-3">
              {canRegister ? (
                <Button
                  size="lg"
                  variant="accent"
                  fullWidth
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  Register now
                </Button>
              ) : isRegistered ? (
                <>
                  <div className="flex items-center justify-center gap-2 h-11 rounded-xl
                    bg-signal-live/10 border border-signal-live/25 text-signal-live
                    text-caption font-display font-bold">
                    <UserCheck className="w-4 h-4" aria-hidden />
                    Registration confirmed
                  </div>

                  {event.requireSubmission && (
                    <div className="space-y-2 pt-1">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={<UploadCloud className="w-4 h-4" />}
                        onClick={() => setIsSubmissionModalOpen(true)}
                      >
                        {myRegistration?.submittedAt ? 'Update submission' : 'Submit deliverable'}
                      </Button>
                      <p className="text-micro text-ink-faint text-center leading-relaxed">
                        {event.submissionInstructions ||
                          'Upload your deliverables before the deadline.'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-hairline">
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      onClick={() => setIsRegisterModalOpen(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      fullWidth
                      onClick={handleCancelRegistration}
                      className="text-signal-danger hover:bg-signal-danger/10 hover:text-signal-danger"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button size="lg" variant="outline" fullWidth disabled>
                    {isFull ? 'Seats full' : isDeadlinePassed ? 'Deadline passed' : 'Registration closed'}
                  </Button>
                  <p className="text-micro text-ink-faint text-center">
                    Keep an eye on the events page for the next opening.
                  </p>
                </>
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
