'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs } from 'firebase/firestore';
import {
  getAllEventsGroupRef,
  getAllRegistrationsGroupRef,
  getMainEventsCollectionRef,
  DEFAULT_TENURE_ID,
} from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Stat } from '@/components/ui/Stat';
import { SectionHeading } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowSkeleton } from '@/components/ui/Skeleton';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Reveal } from '@/components/ui/Motion';
import { CSVExportButton } from '@/components/admin/CSVExportButton';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';
import { Calendar, Ticket, PlusCircle, CalendarX2, ArrowUpRight, LayoutList } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      if (isMockMode) {
        setEvents(mockStore.getEvents());
        const sortedMockRegs = [...mockStore.getRegistrations()].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRegistrations(sortedMockRegs);
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
        setLoading(false);
      } else {
        try {
          const evSnap = await getDocs(getAllEventsGroupRef());
          const evs: EventItem[] = [];
          evSnap.forEach((d) => {
            if (d.ref.path.includes('tenures/')) {
              evs.push({ id: d.id, ...d.data() } as EventItem);
            }
          });

          const regSnap = await getDocs(getAllRegistrationsGroupRef());
          const regs: Registration[] = [];
          regSnap.forEach((d) => {
            if (d.ref.path.includes('tenures/')) {
              const data = d.data();
              regs.push({
                id: d.id,
                ...data,
                nameSnapshot: data.nameSnapshot || data.name || '',
                emailSnapshot: data.emailSnapshot || data.email || '',
                phoneSnapshot: data.phoneSnapshot || data.phone || '',
                regionSnapshot: data.regionSnapshot || data.region || '',
                levelSnapshot: data.levelSnapshot || data.level || '',
                programmeSnapshot: data.programmeSnapshot || data.programme || '',
              } as Registration);
            }
          });

          const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
          const mains: MainEvent[] = [];
          mainSnap.forEach((d) => mains.push({ id: d.id, ...d.data() } as MainEvent));

          evs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setEvents(evs);
          regs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRegistrations(regs);
          mains.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMainEvents(mains);
        } catch (err) {
          console.error('Admin dashboard fetch error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, router]);

  if (!user || user.role === 'USER') return null;

  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED');
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED');

  const draftEvents = events.filter((e) => e.status === 'DRAFT');

  /** Sub-events bucketed under their parent festival, empty buckets dropped. */
  const eventGroups = mainEvents
    .map((main) => ({
      id: main.id,
      name: main.name,
      items: events.filter((e) => e.mainEventId === main.id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <AdminNavTabs />

      <div className="space-y-8">
        <SectionHeading
          eyebrow="Admin control"
          title="Event operations"
          description="Manage event lifecycles, review participant data and generate export reports."
          size="lg"
          as="h1"
          actions={
            <>
              <CSVExportButton
                registrations={confirmedRegistrations}
                filename="all_kaziranga_registrations.csv"
                variant="secondary"
              />
              <Link href="/admin/events/new">
                <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  New event
                </Button>
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            icon={<LayoutList />}
            label="Total events"
            value={<AnimatedNumber value={events.length} />}
            meta={`${draftEvents.length} draft · ${publishedEvents.length} published`}
          />
          <Stat
            icon={<Calendar />}
            tone="live"
            label="Open for registration"
            value={<AnimatedNumber value={publishedEvents.length} />}
            meta="Currently accepting entries"
          />
          <Stat
            icon={<Ticket />}
            tone="brand"
            label="Confirmed registrations"
            value={<AnimatedNumber value={confirmedRegistrations.length} />}
            meta="Across all events"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8 items-start">
          {/* ─── Events ─── */}
          <section className="xl:col-span-2 space-y-5 min-w-0">
            <SectionHeading
              title="Events"
              size="md"
              actions={
                <Link
                  href="/admin/events"
                  className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors"
                >
                  Manage all
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              }
            />

            {loading ? (
              <div className="space-y-3">
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            ) : eventGroups.length === 0 ? (
              <EmptyState
                icon={<CalendarX2 />}
                title="No events yet"
                description="Create your first event to start taking registrations."
                action={
                  <Link href="/admin/events/new">
                    <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                      Create event
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-6">
                {eventGroups.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <h3 className="ed-eyebrow">{group.name}</h3>

                    <Card elevation={1} className="divide-y divide-hairline">
                      {group.items.slice(0, 5).map((evt) => (
                        <div
                          key={evt.id}
                          className="p-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 transition-colors hover:bg-surface-sunken"
                        >
                          <div className="flex-1 min-w-[12rem] space-y-1">
                            <p className="font-display font-bold text-caption text-ink clamp-1">
                              {evt.name}
                            </p>
                            <p className="text-micro text-ink-faint">
                              Deadline{' '}
                              {new Date(
                                evt.registrationDeadline ||
                                  evt.registrationEndDateTime ||
                                  evt.startDateTime,
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <Badge
                            tone={
                              evt.status === 'PUBLISHED'
                                ? 'live'
                                : evt.status === 'DRAFT'
                                  ? 'warn'
                                  : 'neutral'
                            }
                            size="sm"
                          >
                            {evt.status}
                          </Badge>

                          <Link href={`/admin/events/${evt.id}/edit`} className="shrink-0">
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── Recent registrations ─── */}
          <Reveal delay={0.12} className="xl:col-span-1 space-y-5">
            <SectionHeading
              title="Recent activity"
              size="md"
              actions={
                <Link
                  href="/admin/registrations"
                  className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors"
                >
                  All
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              }
            />

            <Card elevation={1}>
              {confirmedRegistrations.length === 0 ? (
                <p className="px-5 py-10 text-center text-caption text-ink-muted">
                  No registrations yet.
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {confirmedRegistrations.slice(0, 6).map((reg) => {
                    const mainEvent = mainEvents.find((m) => m.id === reg.mainEventId);
                    return (
                      <li key={reg.id} className="px-5 py-3.5 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-caption font-semibold text-ink truncate">
                            {reg.nameSnapshot}
                          </span>
                          <time className="text-micro text-ink-faint shrink-0 nums">
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="text-micro text-ink-muted truncate">
                          {mainEvent ? `${mainEvent.name} · ` : ''}
                          {reg.eventTitle}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
