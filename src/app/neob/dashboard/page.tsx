'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Calendar,
  ArrowRight,
  ArrowUpRight,
  CalendarX2,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { HouseHeader, HeaderStats } from '@/components/neob/branding/HouseHeader';
import { EventCard } from '@/components/neob/events/EventCard';
import { RegistrationModal } from '@/components/neob/events/RegistrationModal';
import { EventCardSkeleton } from '@/components/neob/ui/Skeleton';
import { Card } from '@/components/neob/ui/Card';
import { Badge } from '@/components/neob/ui/Badge';
import { Button } from '@/components/neob/ui/Button';
import { Stat } from '@/components/neob/ui/Stat';
import { EmptyState } from '@/components/neob/ui/EmptyState';
import { SectionHeading } from '@/components/neob/ui/Section';
import { Stagger, StaggerItem, Reveal } from '@/components/neob/ui/Motion';
import { AnimatedNumber } from '@/components/neob/ui/AnimatedNumber';
import { EventItem, Registration, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import {
  getAllRegistrationsGroupRef,
  getMainEventsCollectionRef,
  DEFAULT_TENURE_ID,
} from '@/lib/firebase/paths';

function formatRegDate(dateVal?: string | null): string {
  if (!dateVal) return 'Recently';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return 'Active';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function UserDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToRegister, setEventToRegister] = useState<EventItem | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      setEvents(mockStore.getEvents());
      setMainEvents([
        {
          id: 'communityDayAug26',
          name: 'Community Day',
          tenureId: '2026-2027',
          description: '',
          status: 'PUBLISHED',
          createdAt: '',
          updatedAt: '',
        },
      ]);
      setMyRegistrations(mockStore.getRegistrationsForUser(user.uid));
      setLoading(false);
      return;
    }

    try {
      const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
      const mainList: MainEvent[] = [];
      mainSnap.forEach((d) => mainList.push({ id: d.id, ...d.data() } as MainEvent));

      const evList: EventItem[] = [];
      const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      for (const mainEvent of mainList) {
        const eventsRef = collection(
          db,
          `tenures/${DEFAULT_TENURE_ID}/mainEvents/${mainEvent.id}/events`
        );
        const eventsQuery = isPrivileged
          ? query(eventsRef)
          : query(eventsRef, where('status', 'in', ['PUBLISHED', 'CLOSED', 'COMPLETED']));

        const eventsSnap = await getDocs(eventsQuery);
        eventsSnap.forEach((d) => evList.push({ id: d.id, ...d.data() } as EventItem));
      }

      const regsSnap = await getDocs(
        query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid))
      );
      const regList: Registration[] = [];
      regsSnap.forEach((d) => {
        if (!d.ref.path.includes('tenures/')) return;
        const data = d.data();
        regList.push({
          id: d.id,
          ...data,
          nameSnapshot: data.nameSnapshot || data.name || '',
          emailSnapshot: data.emailSnapshot || data.email || '',
          phoneSnapshot: data.phoneSnapshot || data.phone || '',
          regionSnapshot: data.regionSnapshot || data.region || '',
          levelSnapshot: data.levelSnapshot || data.level || '',
          programmeSnapshot: data.programmeSnapshot || data.programme || '',
        } as Registration);
      });

      evList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      mainList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setEvents(evList);
      setMainEvents(mainList);
      setMyRegistrations(regList);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!user) return null;

  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED');
  const registeredEventIds = new Set(
    myRegistrations.filter((r) => r.status === 'CONFIRMED').map((r) => r.eventId)
  );
  const firstName = user.name.split(' ')[0];

  /** Events grouped under their parent festival, plus an "Other" bucket. */
  const groupedEvents = mainEvents
    .map((main) => ({
      key: main.id,
      label: main.name,
      items: publishedEvents.filter((e) => e.mainEventId === main.id),
    }))
    .filter((g) => g.items.length > 0);

  const ungrouped = publishedEvents.filter(
    (e) => !mainEvents.some((m) => m.id === e.mainEventId)
  );
  if (ungrouped.length > 0) {
    groupedEvents.push({ key: '__other', label: 'Other Events', items: ungrouped });
  }

  return (
    <div className="space-y-10">
      <HouseHeader
        badge="Kaziranga House"
        title={
          <>
            Welcome back,{' '}
            <span className="text-accent dark:text-[rgb(var(--accent-vivid))]">{firstName}</span>.
          </>
        }
        subtitle="Every Kaziranga House competition, tracked in one place. Find your event, claim your seat, and represent the Rhinos."
        actions={
          <Link href="/neob/events">
            <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Browse all events
            </Button>
          </Link>
        }
        footer={
          <HeaderStats
            items={[
              { label: 'Open events', value: <AnimatedNumber value={publishedEvents.length} /> },
              { label: 'Registered', value: <AnimatedNumber value={registeredEventIds.size} /> },
              { label: 'Festivals', value: <AnimatedNumber value={mainEvents.length} /> },
              { label: 'Total listed', value: <AnimatedNumber value={events.length} /> },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-10 items-start">
        {/* ─── Events ─── */}
        <div className="xl:col-span-2 space-y-10 min-w-0">
          {loading ? (
            <div className="space-y-5">
              <SectionHeading eyebrow="Loading" title="Fetching events" size="md" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <EventCardSkeleton />
                <EventCardSkeleton />
              </div>
            </div>
          ) : groupedEvents.length === 0 ? (
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Now open"
                title="Upcoming events"
                size="md"
              />
              <EmptyState
                icon={<CalendarX2 />}
                title="Nothing open right now"
                description="New competitions are posted here as soon as they go live. Check back shortly."
                action={
                  <Link href="/neob/events">
                    <Button variant="secondary" size="md">
                      View past events
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            groupedEvents.map((group, groupIndex) => (
              <section key={group.key} className="space-y-5">
                <SectionHeading
                  eyebrow={groupIndex === 0 ? 'Now open' : undefined}
                  title={group.label}
                  size="md"
                  actions={
                    <Link
                      href="/neob/events"
                      className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors"
                    >
                      View all
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                    </Link>
                  }
                />
                <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {group.items.map((evt) => (
                    <StaggerItem key={evt.id} className="h-full">
                      <EventCard
                        event={evt}
                        isRegistered={registeredEventIds.has(evt.id)}
                        onRegisterClick={setEventToRegister}
                      />
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            ))
          )}
        </div>

        {/* ─── Side rail ─── */}
        <Reveal delay={0.15} className="xl:col-span-1 space-y-6 xl:sticky xl:top-[calc(var(--navbar-height)+1.5rem)]">

          <Card className="overflow-hidden">
            <div className="rounded-t-[14px] px-5 py-3.5 border-b-2 border-black dark:border-white bg-[#FFE873]/20 flex items-center justify-between gap-3">
              <h3 className="font-display font-black text-title-sm text-ink">
                Your registrations
              </h3>
              <Link
                href="/neob/my-registrations"
                className="px-2.5 py-1 rounded-md text-[0.6875rem] font-display font-black bg-[#FFE873] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                All →
              </Link>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="px-5 py-8 text-center space-y-3">
                <Sparkles className="w-5 h-5 mx-auto text-ink-faint" aria-hidden />
                <p className="text-caption font-bold text-ink-muted">
                  No registrations yet. Pick an event to get started.
                </p>
              </div>
            ) : (
              <ul className="divide-y-2 divide-black/10 dark:divide-white/10">
                {myRegistrations.slice(0, 4).map((reg) => (
                  <li key={reg.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-caption font-extrabold text-ink clamp-1">
                        {reg.eventTitle}
                      </p>
                      <p className="text-micro font-medium text-ink-faint">
                        {formatRegDate(reg.createdAt)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        reg.status === 'CONFIRMED'
                          ? 'live'
                          : reg.status === 'CANCELLED'
                          ? 'danger'
                          : 'accent'
                      }
                      size="sm"
                    >
                      {reg.status === 'CONFIRMED'
                        ? 'Confirmed'
                        : reg.status === 'CANCELLED'
                        ? 'Cancelled'
                        : reg.status || 'Registered'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="rounded-t-[14px] px-5 py-3.5 border-b-2 border-black dark:border-white bg-[#5EEAD4]/20 flex items-center justify-between gap-3">
              <h3 className="font-display font-black text-title-sm text-ink">Your profile</h3>
              <Link
                href="/neob/profile"
                className="px-2.5 py-1 rounded-md text-[0.6875rem] font-display font-black bg-[#5EEAD4] hover:bg-[#4ddac4] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#121212] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Edit ✎
              </Link>
            </div>
            <dl className="px-5 py-4 space-y-3 divide-y-2 divide-black/5 dark:divide-white/5 [&>div:not(:first-child)]:pt-3">
              {[
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email, mono: true },
                { label: 'Phone', value: user.phone || 'Not set' },
                { label: 'Region', value: user.region || 'Not set' },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-caption font-bold text-ink-faint shrink-0">{row.label}</dt>
                  <dd
                    className={`text-caption font-extrabold text-ink truncate text-right ${
                      row.mono ? 'font-mono text-micro' : ''
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </Reveal>
      </div>

      <RegistrationModal
        event={eventToRegister}
        isOpen={!!eventToRegister}
        onClose={() => setEventToRegister(null)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
