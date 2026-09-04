'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Registration, MainEvent, EventItem } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { query, where, getDocs, updateDoc, doc, collectionGroup, increment } from 'firebase/firestore';
import { getAllRegistrationsGroupRef, getAllEventsGroupRef, getRegistrationRef, getMainEventsCollectionRef, getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/ui/Section';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { RegistrationCard } from '@/components/events/RegistrationCard';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { SubmissionModal } from '@/components/events/SubmissionModal';
import { cn } from '@/lib/utils/cn';
import { TicketX, ArrowRight, ChevronDown } from 'lucide-react';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventItem>>({});
  const [loading, setLoading] = useState(true);
  /** Groups start expanded; ids land here only once explicitly collapsed. */
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Submission Modal state
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [activeRegForSubmission, setActiveRegForSubmission] = useState<Registration | null>(null);
  const [submissionAnswers, setSubmissionAnswers] = useState<Record<string, string>>({});
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Cancellation Modal state
  const [cancelRegId, setCancelRegId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit Registration state
  const [activeRegForEdit, setActiveRegForEdit] = useState<Registration | null>(null);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const fetchMyRegs = async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      const userRegs = mockStore.getRegistrationsForUser(user.uid);
      const mockEvents = mockStore.getEvents();
      const map: Record<string, EventItem> = {};
      mockEvents.forEach(e => { map[e.id] = e; });
      setEventsMap(map);
      setRegistrations(userRegs);
      setMainEvents([{ id: 'communityDayAug26', name: 'Community Day', tenureId: '2026-2027', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }]);
      setLoading(false);
    } else {
      try {
        const q = query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const items: Registration[] = [];
        snap.forEach((doc) => {
          if (doc.ref.path.includes('tenures/')) {
            const data = doc.data();
            items.push({ 
              id: doc.id, 
              ...data,
              nameSnapshot: data.nameSnapshot || data.name || '',
              emailSnapshot: data.emailSnapshot || data.email || '',
              phoneSnapshot: data.phoneSnapshot || data.phone || '',
              regionSnapshot: data.regionSnapshot || data.region || '',
              levelSnapshot: data.levelSnapshot || data.level || '',
              programmeSnapshot: data.programmeSnapshot || data.programme || ''
            } as Registration);
          }
        });

        // Fetch events to get submission metadata
        const eventsSnap = await getDocs(getAllEventsGroupRef());
        const eMap: Record<string, EventItem> = {};
        eventsSnap.forEach((doc) => {
          eMap[doc.id] = { id: doc.id, ...doc.data() } as EventItem;
        });
        setEventsMap(eMap);

        const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
        const mainList: MainEvent[] = [];
        mainSnap.forEach((d) => mainList.push({ id: d.id, ...d.data() } as MainEvent));

        setRegistrations(items);
        setMainEvents(mainList);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMyRegs();
  }, [user]);

  const openSubmissionModal = (reg: Registration) => {
    setActiveRegForSubmission(reg);
    if (reg.submissionAnswers) {
      setSubmissionAnswers(reg.submissionAnswers);
    } else if (reg.submissionContent) {
      setSubmissionAnswers({ legacy: reg.submissionContent });
    } else {
      setSubmissionAnswers({});
    }
    setSubmissionError(null);
    setIsSubmissionModalOpen(true);
  };

  const handleCancelRegistration = (registrationId: string) => {
    setCancelRegId(registrationId);
  };

  const executeCancelRegistration = async () => {
    if (!user || !cancelRegId) return;

    setIsCancelling(true);
    if (isMockMode) {
      mockStore.cancelRegistration(cancelRegId, user.uid);
      setIsCancelling(false);
      setCancelRegId(null);
      fetchMyRegs();
    } else {
      try {
        const reg = registrations.find(r => r.id === cancelRegId);
        if (!reg) throw new Error("Registration not found in state");
        const tenure = reg.tenureId || DEFAULT_TENURE_ID;
        const mainEvent = reg.mainEventId || 'communityDayAug26';

        const docRef = getRegistrationRef(tenure, mainEvent, reg.eventId, reg.subEventId, cancelRegId);
        await updateDoc(docRef, { status: 'CANCELLED', updatedAt: new Date().toISOString() });
        
        // Decrement the event's registration count
        const eventRef = getEventRef(tenure, mainEvent, reg.eventId);
        await updateDoc(eventRef, { currentRegistrationCount: increment(-1) });
        
        setIsCancelling(false);
        setCancelRegId(null);
        fetchMyRegs();
      } catch (err) {
        console.error('Cancel registration error:', err);
        setIsCancelling(false);
        setCancelRegId(null);
      }
    }
  };

  if (!user) return null;

  const activeRegistrations = registrations.filter((r) => r.status !== 'CANCELLED');

  /**
   * Registrations bucketed under their parent festival, newest festival first,
   * with anything orphaned collected into a trailing group.
   */
  const groups = mainEvents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((main) => ({
      id: main.id,
      label: main.name,
      items: activeRegistrations.filter((r) => r.mainEventId === main.id),
    }))
    .filter((g) => g.items.length > 0);

  const orphaned = activeRegistrations.filter(
    (r) => !mainEvents.some((m) => m.id === r.mainEventId)
  );
  if (orphaned.length > 0) {
    groups.push({ id: '__other', label: 'Other Events', items: orphaned });
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your seat at the arena"
        title="My registrations"
        description="Track confirmed entries, manage your team, and submit your work before the deadline."
        size="lg"
        as="h1"
        actions={
          <Link href="/events">
            <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Find events
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<TicketX />}
          title="No registrations yet"
          description="You haven't entered any Kaziranga House events. Browse what's open and claim your seat."
          action={
            <Link href="/events">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore events
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-10">
          {groups.map((group) => {
            const isOpen = !collapsedGroups.has(group.id);

            return (
              <section key={group.id} className="space-y-5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="w-full group flex items-center justify-between gap-4 pb-3 border-b border-hairline text-left"
                >
                  <span className="flex items-baseline gap-3 min-w-0">
                    <span className="font-display font-extrabold text-title-lg text-ink truncate">
                      {group.label}
                    </span>
                    <span className="text-caption text-ink-faint nums shrink-0">
                      {group.items.length}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 shrink-0 text-ink-faint transition-transform duration-300 ease-editorial',
                      'group-hover:text-ink',
                      isOpen ? 'rotate-0' : '-rotate-90'
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {group.items.map((reg) => (
                      <StaggerItem key={reg.id} className="h-full">
                        <RegistrationCard
                          registration={reg}
                          event={eventsMap[reg.eventId]}
                          onEdit={setActiveRegForEdit}
                          onCancel={handleCancelRegistration}
                          onOpenSubmission={openSubmissionModal}
                        />
                      </StaggerItem>
                    ))}
                  </Stagger>
                )}
              </section>
            );
          })}
        </div>
      )}

      {isSubmissionModalOpen && activeRegForSubmission && (
        <SubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          event={eventsMap[activeRegForSubmission.eventId]}
          registration={activeRegForSubmission}
          onSuccess={fetchMyRegs}
        />
      )}

      <ConfirmModal
        isOpen={!!cancelRegId}
        onClose={() => setCancelRegId(null)}
        onConfirm={executeCancelRegistration}
        title="Cancel this registration?"
        message="Your reserved spot is released immediately. You can register again later while open seats remain."
        confirmText="Yes, cancel it"
        cancelText="Keep my spot"
        variant="danger"
        isLoading={isCancelling}
      />

      {activeRegForEdit && eventsMap[activeRegForEdit.eventId] && (
        <RegistrationModal
          event={eventsMap[activeRegForEdit.eventId]}
          existingRegistration={activeRegForEdit}
          isOpen={!!activeRegForEdit}
          onClose={() => setActiveRegForEdit(null)}
          onSuccess={() => {
            setActiveRegForEdit(null);
            fetchMyRegs();
          }}
        />
      )}
    </div>
  );
}
