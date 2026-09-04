'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventGroup, EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { getDoc, getDocs, query, where } from 'firebase/firestore';
import { getMainEventRef, getEventsCollectionRef, getRegistrationsCollectionRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { mockStore } from '@/lib/firebase/mockStore';
import { INITIAL_EVENT_GROUPS } from '@/lib/firebase/mockData';
import { EventCard } from '@/components/events/EventCard';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/ui/Section';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { Stagger, StaggerItem, Reveal } from '@/components/ui/Motion';
import { cn } from '@/lib/utils/cn';
import { ArrowLeft, CalendarX2, AlertTriangle } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';

export default function EventGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params.id as string;

  const [group, setGroup] = useState<EventGroup | null>(null);
  const [subEvents, setSubEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventToRegister, setSelectedEventToRegister] = useState<EventItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTiming, setActiveTiming] = useState<string>('All');

  const [error, setError] = useState<string | null>(null);
  
  const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Other'];

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    if (isMockMode) {
      const mockGroups = INITIAL_EVENT_GROUPS;
      const groupData = mockGroups.find(g => g.id === groupId) || {
        id: groupId,
        name: groupId === 'communityDayAug26' ? 'Community Days' : 'Event Collection',
        description: 'Browse activities in this collection.',
        coverImageUrl: null,
        status: 'PUBLISHED',
        createdAt: '',
        updatedAt: '',
        createdBy: 'system'
      } as any;
      setGroup(groupData);

      const sortEventsByOrder = (evts: EventItem[]) => {
        return [...evts].sort((a, b) => {
          const orderA = a.displayOrder && Number(a.displayOrder) > 0 ? Number(a.displayOrder) : 9999;
          const orderB = b.displayOrder && Number(b.displayOrder) > 0 ? Number(b.displayOrder) : 9999;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
        });
      };

      const allEvents = mockStore.getEvents();
      setSubEvents(sortEventsByOrder(allEvents.filter(e => e.mainEventId === groupId)));

      if (user) {
        setMyRegistrations(mockStore.getRegistrationsForUser(user.uid));
      }

      setLoading(false);
    } else {
      try {
        const docRef = getMainEventRef(DEFAULT_TENURE_ID, groupId);
        const snap = await getDoc(docRef);

        let groupData: EventGroup | null = null;

        if (snap.exists()) {
          groupData = { id: snap.id, ...snap.data() } as any;
        } else {
          groupData = {
            id: groupId,
            name: groupId === 'communityDayAug26' ? 'Community Days' : 'Event Collection',
            description: 'Browse activities in this collection.',
            coverImageUrl: null,
            status: 'PUBLISHED',
            createdAt: '',
            updatedAt: '',
            createdBy: 'system'
          };
        }

        setGroup(groupData);

        let subEventsSnap;
        if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
          subEventsSnap = await getDocs(getEventsCollectionRef(DEFAULT_TENURE_ID, groupId));
        } else {
          const eventsQ = query(
            getEventsCollectionRef(DEFAULT_TENURE_ID, groupId),
            where('status', 'in', ['PUBLISHED', 'CLOSED', 'COMPLETED'])
          );
          subEventsSnap = await getDocs(eventsQ);
        }

        const subEvList: EventItem[] = [];
        subEventsSnap.forEach((doc) => subEvList.push({ id: doc.id, ...doc.data() } as EventItem));

        const sortEventsByOrder = (evts: EventItem[]) => {
          return [...evts].sort((a, b) => {
            const orderA = a.displayOrder && Number(a.displayOrder) > 0 ? Number(a.displayOrder) : 9999;
            const orderB = b.displayOrder && Number(b.displayOrder) > 0 ? Number(b.displayOrder) : 9999;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
          });
        };

        setSubEvents(sortEventsByOrder(subEvList));

        // DEBUG TELEMETRY
        try {
          // const allEventsSnap = await getDocs(collection(db, 'events'));
          await fetch('/api/debug', {
            method: 'POST',
            body: JSON.stringify({
              groupId,
              subEventsCount: subEventsSnap.size,
              groupDataExists: snap.exists(),
              allEventGroups: [], // Disabled for now
            })
          });
        } catch (e) {
          console.error("Debug telemetry failed:", e);
        }

        if (user) {
          // Note: The previous logic loaded all registrations for a user globally.
          // We will use a collection group query or just continue with a wide query if needed.
          // Since we might need all registrations for the 'isRegistered' check across events,
          // we should ideally use collectionGroup('registrations').
          const { collectionGroup } = await import('firebase/firestore');
          const regsQ = query(collectionGroup(db, 'registrations'), where('userId', '==', user.uid));
          const regsSnap = await getDocs(regsQ);
          const regList: Registration[] = [];
          regsSnap.forEach((doc) => regList.push({ id: doc.id, ...doc.data() } as Registration));
          setMyRegistrations(regList);
        }
      } catch (err: any) {
        console.error('Error fetching event group details:', err);
        setError(err?.message || 'An unknown error occurred while fetching events.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchDetail();
  }, [groupId, user, authLoading]);

  const registeredEventIds = new Set(myRegistrations.filter((r) => r.status === 'CONFIRMED').map((r) => r.eventId));

  if (loading || authLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="h-72 sm:h-96 rounded-3xl bg-surface-sunken animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <EmptyState
          icon={<CalendarX2 />}
          title="Festival not found"
          description="This collection may have been removed or renamed."
          action={
            <Button
              variant="primary"
              onClick={() => router.push('/events')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to events
            </Button>
          }
        />
      </div>
    );
  }

  const defaultImage =
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&auto=format&fit=crop&q=80';

  /** Shared pill styling for the category and timing filter rows. */
  const pillClass = (active: boolean) =>
    cn(
      'shrink-0 px-3.5 h-9 rounded-full border text-caption font-display font-semibold',
      'transition-colors duration-200 whitespace-nowrap',
      active
        ? 'bg-ink text-ink-invert border-ink'
        : 'bg-surface-raised text-ink-muted border-hairline hover:border-hairline-strong hover:text-ink'
    );

  const filteredEvents = subEvents.filter((evt) => {
    if (activeCategory !== 'All') {
      const cats = Array.isArray(evt.category) ? evt.category : [evt.category || ''];
      const mainCats = ['technical', 'cultural', 'sports'];

      if (activeCategory === 'Other') {
        const hasOtherCat = cats.some(
          (c) => c && typeof c === 'string' && !mainCats.some((m) => c.toLowerCase().includes(m))
        );
        const hasNoCat = cats.length === 0 || (cats.length === 1 && !cats[0]);
        if (!hasOtherCat && !hasNoCat) return false;
      } else {
        const active = activeCategory.toLowerCase();
        if (
          !cats.some(
            (c) =>
              c &&
              typeof c === 'string' &&
              (c.toLowerCase() === active || c.toLowerCase().includes(active))
          )
        ) {
          return false;
        }
      }
    }

    if (activeTiming !== 'All') {
      const now = Date.now();
      const start = new Date(evt.startDateTime).getTime();
      const end = new Date(evt.endDateTime || evt.startDateTime).getTime();
      const regDeadline = new Date(evt.registrationDeadline).getTime();
      const regEnd = evt.registrationEndDateTime
        ? new Date(evt.registrationEndDateTime).getTime()
        : regDeadline;

      const isRegOpen = now < regEnd && evt.status === 'PUBLISHED';
      const isOngoing = now >= start && now <= end;
      const isEnded = now > end;

      if (activeTiming === 'Registrations Open' && !isRegOpen) return false;
      if (activeTiming === 'Ongoing' && !isOngoing) return false;
      if (activeTiming === 'Ended' && !isEnded) return false;
    }

    return true;
  });

  const sortedEvents = [...filteredEvents].sort(
    (a, b) =>
      new Date(b.startDateTime || b.createdAt).getTime() -
      new Date(a.startDateTime || a.createdAt).getTime()
  );

  const hasFilters = activeCategory !== 'All' || activeTiming !== 'All';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <button
        onClick={() => router.push('/events')}
        className="inline-flex items-center gap-1.5 text-caption font-display font-semibold text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        All events
      </button>

      {/* ─── Full-bleed festival masthead ─── */}
      <Reveal>
        <header className="relative rounded-3xl overflow-hidden ed-stage ed-grain border border-white/10 shadow-e-3 min-h-[18rem] sm:min-h-[24rem] flex items-end">
          <img
            src={getOptimizedImageUrl(group.coverImageUrl) || defaultImage}
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

          <div className="relative z-[2] p-6 sm:p-10 space-y-4 max-w-3xl">
            <Badge tone="inverse" size="sm">
              {group.status}
            </Badge>
            <h1 className="font-display font-black text-display-lg text-white">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-body text-white/70 leading-relaxed max-w-2xl">
                {group.description}
              </p>
            )}
            <p className="text-eyebrow uppercase font-display text-[rgb(var(--accent-vivid))]">
              {subEvents.length} {subEvents.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
        </header>
      </Reveal>

      {/* ─── Activities ─── */}
      <section className="space-y-5">
        <SectionHeading eyebrow="On the programme" title="Activities" size="md" />

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={pillClass(activeCategory === cat)}
            >
              {cat === 'All' ? 'All categories' : cat}
            </button>
          ))}

          <span className="w-px h-6 bg-hairline mx-1 hidden sm:block" aria-hidden />

          {['All', 'Registrations Open', 'Ongoing', 'Ended'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTiming(t)}
              aria-pressed={activeTiming === t}
              className={pillClass(activeTiming === t)}
            >
              {t === 'All' ? 'Any status' : t}
            </button>
          ))}
        </div>

        {error ? (
          <div
            role="alert"
            className="p-6 rounded-2xl border border-signal-danger/25 bg-signal-danger/10 space-y-2"
          >
            <h3 className="inline-flex items-center gap-2 font-display font-bold text-title-sm text-signal-danger">
              <AlertTriangle className="w-4 h-4" aria-hidden />
              Could not load activities
            </h3>
            <p className="text-caption font-mono text-signal-danger/90 break-all">{error}</p>
            <p className="text-micro text-ink-muted">
              A permissions error usually means the Firestore security rules still need to be
              deployed.
            </p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 />}
            title={hasFilters ? 'Nothing matches those filters' : 'No activities scheduled'}
            description={
              hasFilters
                ? 'Try a different category or status to see more of this festival.'
                : 'Activities for this festival have not been published yet.'
            }
            action={
              hasFilters && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveCategory('All');
                    setActiveTiming('All');
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedEvents.map((evt) => (
              <StaggerItem key={evt.id} className="h-full">
                <EventCard
                  event={evt}
                  isRegistered={registeredEventIds.has(evt.id)}
                  onRegisterClick={setSelectedEventToRegister}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <RegistrationModal
        event={selectedEventToRegister}
        isOpen={!!selectedEventToRegister}
        onClose={() => setSelectedEventToRegister(null)}
        onSuccess={fetchDetail}
      />
    </div>
  );
}
