'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Registration, MainEvent, EventItem } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { query, where, getDocs, updateDoc, doc, collection, setDoc, collectionGroup, increment } from 'firebase/firestore';
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
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPill } from '@/components/ui/FilterPill';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { FilterToolbar } from '@/components/ui/FilterToolbar';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/formatDate';
import {
  CalendarX2,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  CalendarDays,
  Calendar,
  MapPin,
  Clock,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventItem>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'agenda'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const [festivalFilter, setFestivalFilter] = useState('ALL');
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

        // 1. Notify user: Registration Cancelled
        const notifDoc = doc(collection(db, 'notifications'));
        await setDoc(notifDoc, {
          id: notifDoc.id,
          userId: user.uid,
          title: 'Registration Cancelled',
          message: `Your registration for "${reg.eventTitle}" has been cancelled.`,
          type: 'WARNING',
          read: false,
          createdAt: new Date().toISOString(),
        });

        // 2. If part of a team: notify team leader or teammates
        if (reg.teamId) {
          try {
            const teamSnap = await getDocs(
              query(
                getAllRegistrationsGroupRef(),
                where('teamId', '==', reg.teamId),
                where('status', '==', 'CONFIRMED')
              )
            );
            if (reg.teamRole === 'MEMBER') {
              const leaderDoc = teamSnap.docs.find((d) => d.data().teamRole === 'INITIATOR');
              if (leaderDoc) {
                const leaderData = leaderDoc.data();
                const teamNotif = doc(collection(db, 'notifications'));
                await setDoc(teamNotif, {
                  id: teamNotif.id,
                  userId: leaderData.userId,
                  title: 'Teammate Withdrawn',
                  message: `${reg.nameSnapshot || user.name || 'A teammate'} has withdrawn from your team for "${reg.eventTitle}". You may invite a replacement.`,
                  type: 'WARNING',
                  linkUrl: `/events/${reg.eventId}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                });
              }
            } else if (reg.teamRole === 'INITIATOR') {
              const otherMembers = teamSnap.docs.filter((d) => d.id !== cancelRegId);
              await Promise.all(
                otherMembers.map((d) => {
                  const mData = d.data();
                  const disbandNotif = doc(collection(db, 'notifications'));
                  return setDoc(disbandNotif, {
                    id: disbandNotif.id,
                    userId: mData.userId,
                    title: 'Team Disbanded',
                    message: `The team leader has cancelled the team registration for "${reg.eventTitle}".`,
                    type: 'WARNING',
                    linkUrl: `/events/${reg.eventId}`,
                    read: false,
                    createdAt: new Date().toISOString(),
                  });
                })
              );
            }
          } catch (e) {
            console.error('Failed to notify team members on cancellation:', e);
          }
        }
        
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

  const filteredRegistrations = useMemo(() => {
    return activeRegistrations.filter((r) => {
      if (festivalFilter !== 'ALL' && r.mainEventId !== festivalFilter) return false;
      if (statusFilter === 'CONFIRMED' && r.status !== 'CONFIRMED') return false;
      if (statusFilter === 'PENDING' && r.status === 'CONFIRMED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inEvent = r.eventTitle?.toLowerCase().includes(q);
        const inTeam = r.teamName?.toLowerCase().includes(q);
        const evtCat = eventsMap[r.eventId]?.category;
        const inCategory = Array.isArray(evtCat)
          ? evtCat.some((c) => c.toLowerCase().includes(q))
          : typeof evtCat === 'string'
            ? evtCat.toLowerCase().includes(q)
            : false;
        if (!inEvent && !inTeam && !inCategory) return false;
      }
      return true;
    });
  }, [activeRegistrations, eventsMap, festivalFilter, statusFilter, searchQuery]);

  const hasActiveFilters =
    festivalFilter !== 'ALL' || statusFilter !== 'ALL' || Boolean(searchQuery.trim());

  const resetFilters = () => {
    setFestivalFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  /**
   * Registrations bucketed under their parent festival, newest festival first,
   * with anything orphaned collected into a trailing group.
   */
  const groups = mainEvents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((m) => festivalFilter === 'ALL' || m.id === festivalFilter)
    .map((main) => ({
      id: main.id,
      label: main.name,
      items: filteredRegistrations.filter((r) => r.mainEventId === main.id),
    }))
    .filter((g) => g.items.length > 0);

  const orphaned = filteredRegistrations.filter(
    (r) => !mainEvents.some((m) => m.id === r.mainEventId)
  );
  if (orphaned.length > 0 && festivalFilter === 'ALL') {
    groups.push({ id: '__other', label: 'Other Events', items: orphaned });
  }

  const chronologicalRegs = useMemo(() => {
    return [...filteredRegistrations].sort((a, b) => {
      const dateA = eventsMap[a.eventId]?.startDateTime || a.createdAt;
      const dateB = eventsMap[b.eventId]?.startDateTime || b.createdAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [filteredRegistrations, eventsMap]);

  const confirmedCount = activeRegistrations.filter((r) => r.status === 'CONFIRMED').length;
  const pendingCount = activeRegistrations.length - confirmedCount;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your seat at the arena"
        title="My registrations"
        description="Track confirmed entries, manage your team, and submit your work before the deadline."
        size="lg"
        as="h1"
        actions={
          <div className="flex items-center gap-3">
            <div
              className="inline-flex p-1 rounded-xl bg-surface-sunken border border-hairline"
              role="group"
              aria-label="View layout"
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-display font-semibold transition-all',
                  viewMode === 'cards'
                    ? 'bg-surface-raised text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-display font-semibold transition-all',
                  viewMode === 'agenda'
                    ? 'bg-surface-raised text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            <Link href="/events">
              <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Find events
              </Button>
            </Link>
          </div>
        }
      />

      {/* ─── Filter Toolbar ─── */}
      {activeRegistrations.length > 0 && (
        <FilterToolbar
          variant="bare"
          totalCount={activeRegistrations.length}
          filteredCount={filteredRegistrations.length}
          countLabel="registrations"
          filterTitle="Filter registrations"
          filterCount={
            (statusFilter !== 'ALL' ? 1 : 0) +
            (festivalFilter !== 'ALL' ? 1 : 0)
          }
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          search={
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by event title, team name or category…"
              aria-label="Search my registrations"
            />
          }
          filters={
            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                  Registration Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterPill
                    active={statusFilter === 'ALL'}
                    onClick={() => setStatusFilter('ALL')}
                    count={activeRegistrations.length}
                  >
                    All
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === 'CONFIRMED'}
                    onClick={() => setStatusFilter('CONFIRMED')}
                    count={confirmedCount}
                  >
                    Confirmed
                  </FilterPill>
                  {pendingCount > 0 && (
                    <FilterPill
                      active={statusFilter === 'PENDING'}
                      onClick={() => setStatusFilter('PENDING')}
                      count={pendingCount}
                    >
                      Pending Action
                    </FilterPill>
                  )}
                </div>
              </div>

              {mainEvents.length > 1 && (
                <div className="space-y-2 pt-3 border-t border-hairline">
                  <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                    Festival
                  </label>
                  <FilterSelect
                    value={festivalFilter}
                    onChange={setFestivalFilter}
                    options={[
                      { value: 'ALL', label: 'All Festivals' },
                      ...mainEvents.map((m) => ({ value: m.id, label: m.name })),
                    ]}
                    icon={<Calendar />}
                    ariaLabel="Filter by festival"
                    containerClassName="w-full"
                  />
                </div>
              )}
            </div>
          }
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 />}
          title={hasActiveFilters ? 'No matching registrations' : 'No registrations yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search query or filters to find what you need.'
              : "You haven't entered any Kaziranga House events. Browse what's open and claim your seat."
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="md" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/events">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore events
                </Button>
              </Link>
            )
          }
        />
      ) : viewMode === 'agenda' ? (
        <div className="relative space-y-6">
          {/* Continuous vertical spine line centered exactly on the timeline track */}
          <div
            className="absolute left-4 sm:left-5 top-6 bottom-6 w-0.5 -translate-x-1/2 bg-hairline dark:bg-white/10 pointer-events-none"
            aria-hidden
          />

          {chronologicalRegs.map((reg: Registration) => {
            const ev = eventsMap[reg.eventId];
            const isPast = ev ? new Date(ev.endDateTime || ev.startDateTime).getTime() < Date.now() : false;
            const hasSubmission = ev?.requireSubmission;
            const isSubmitted = !!reg.submittedAt || (reg.submissionAnswers && Object.keys(reg.submissionAnswers).length > 0);

            return (
              <div key={reg.id} className="relative pl-8 sm:pl-11 group">
                {/* Timeline node marker — mathematically centered on the exact spine axis */}
                <span
                  className={cn(
                    'absolute left-4 sm:left-5 top-6 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-surface dark:border-[rgb(var(--surface))] transition-all z-10',
                    isPast
                      ? 'bg-ink-faint'
                      : isSubmitted
                      ? 'bg-signal-live ring-4 ring-signal-live/20'
                      : 'bg-brand ring-4 ring-brand/20 dark:bg-accent dark:ring-accent/20'
                  )}
                  aria-hidden
                />

                <Card elevation={1} className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-micro font-display font-bold uppercase tracking-wider text-accent dark:text-[rgb(var(--accent-vivid))]">
                          {ev?.mainEventId ? 'Festival Event' : 'Standalone'}
                        </span>
                        <Badge tone={isPast ? 'neutral' : 'live'} size="sm">
                          {isPast ? 'Past Event' : 'Upcoming'}
                        </Badge>
                        {reg.teamName && (
                          <Badge tone="accent" size="sm">
                            Team {reg.teamName}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-title-sm text-ink">
                        {reg.eventTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasSubmission && (
                        <Button
                          size="sm"
                          variant={isSubmitted ? 'outline' : 'primary'}
                          onClick={() => openSubmissionModal(reg)}
                          leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                        >
                          {isSubmitted ? 'Deliverable' : 'Submit work'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelRegistration(reg.id)}
                        className="text-signal-danger hover:bg-signal-danger/10 hover:text-signal-danger"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-hairline text-caption text-ink-muted">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-ink-faint shrink-0" />
                      <span>{ev ? formatDate(ev.startDateTime) : 'Date TBA'}</span>
                    </div>
                    {ev?.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-ink-faint shrink-0" />
                        <span className="truncate">{ev.venue}</span>
                      </div>
                    )}
                    {hasSubmission && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-ink-faint shrink-0" />
                        <span className={isSubmitted ? 'text-signal-live font-semibold' : 'text-signal-warn font-semibold'}>
                          {isSubmitted ? 'Delivered' : 'Submission pending'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
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
