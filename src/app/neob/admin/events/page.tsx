'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EventItem, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs, updateDoc, deleteDoc, doc, collection, setDoc } from 'firebase/firestore';
import {
  getAllEventsGroupRef,
  getEventRef,
  getMainEventsCollectionRef,
  DEFAULT_TENURE_ID,
  DEFAULT_MAIN_EVENT_ID,
} from '@/lib/firebase/paths';
import { Button } from '@/components/neob/ui/Button';
import { ConfirmModal } from '@/components/neob/ui/ConfirmModal';
import { EmptyState } from '@/components/neob/ui/EmptyState';
import { SectionHeading } from '@/components/neob/ui/Section';
import { RowSkeleton } from '@/components/neob/ui/Skeleton';
import { Stagger, StaggerItem } from '@/components/neob/ui/Motion';
import { AdminNavTabs } from '@/components/neob/admin/AdminNavTabs';
import { AdminEventRow } from '@/components/neob/admin/AdminEventRow';
import { SearchInput } from '@/components/neob/ui/SearchInput';
import { FilterSelect } from '@/components/neob/ui/FilterSelect';
import { FilterToolbar } from '@/components/neob/ui/FilterToolbar';
import { useToast } from '@/components/neob/ui/Toast';
import { cn } from '@/lib/utils/cn';
import { PlusCircle, CalendarX2, ChevronDown, Calendar, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [selectedMainEventId, setSelectedMainEventId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  /** Groups start expanded; ids land here only once explicitly collapsed. */
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const fetchEvents = async () => {
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
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(getAllEventsGroupRef());
        const items: EventItem[] = [];
        snap.forEach((d) => {
          if (d.ref.path.includes('tenures/')) {
            items.push({ id: d.id, ...d.data() } as EventItem);
          }
        });

        const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
        const mainItems: MainEvent[] = [];
        mainSnap.forEach((d) => mainItems.push({ id: d.id, ...d.data() } as MainEvent));

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEvents(items);
        mainItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMainEvents(mainItems);
      } catch (err) {
        console.error('Error fetching admin events:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/dashboard');
      return;
    }
    fetchEvents();
  }, [user, router]);

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    if (!user) return;

    const eventName = events.find((e) => e.id === eventId)?.name ?? 'Event';
    const pretty = newStatus.charAt(0) + newStatus.slice(1).toLowerCase();

    if (isMockMode) {
      mockStore.updateEvent(eventId, { status: newStatus as any }, user);
      fetchEvents();
      toast.success('Status updated', `${eventName} is now ${pretty}.`);
      return;
    }

    try {
      const evt = events.find((e) => e.id === eventId);
      if (!evt) throw new Error('Event not found');
      const docRef = getEventRef(evt.tenureId, evt.mainEventId, eventId);
      const wasPublished = evt.status === 'PUBLISHED';
      const willBePublished = newStatus === 'PUBLISHED';
      const hasBeenPublished = Boolean(evt.hasBeenPublished || wasPublished || willBePublished);

      await updateDoc(docRef, {
        status: newStatus,
        hasBeenPublished,
        updatedAt: new Date().toISOString(),
      });

      if (!wasPublished && willBePublished) {
        const notifDoc = doc(collection(db, 'notifications'));
        await setDoc(notifDoc, {
          id: notifDoc.id,
          userId: 'GLOBAL',
          title: evt.hasBeenPublished ? 'Event Re-Published' : 'New Event Published',
          message: evt.hasBeenPublished
            ? `${eventName} has been re-published and is open for registration.`
            : `${eventName} is now open for registration.`,
          type: 'EVENT',
          linkUrl: `/events/${eventId}`,
          read: false,
          isGlobal: true,
          createdAt: new Date().toISOString(),
        });
      } else if (wasPublished && !willBePublished) {
        const notifDoc = doc(collection(db, 'notifications'));
        await setDoc(notifDoc, {
          id: notifDoc.id,
          userId: 'GLOBAL',
          title: 'Event Removed',
          message: `${eventName} has been removed from published events.`,
          type: 'WARNING',
          read: false,
          isGlobal: true,
          createdAt: new Date().toISOString(),
        });
      }

      fetchEvents();
      toast.success('Status updated', `${eventName} is now ${pretty}.`);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Could not update status', 'The change was not saved. Please try again.');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setDeleteEventId(eventId);
  };

  const executeDeleteEvent = async () => {
    if (!user || !deleteEventId) return;

    setIsDeleting(true);
    const deletedName = events.find((e) => e.id === deleteEventId)?.name ?? 'Event';

    if (isMockMode) {
      mockStore.deleteEvent(deleteEventId, user);
      setIsDeleting(false);
      setDeleteEventId(null);
      fetchEvents();
      toast.success('Event deleted', `${deletedName} and its registrations were removed.`);
    } else {
      try {
        const evt = events.find((e) => e.id === deleteEventId);
        if (!evt) throw new Error('Event not found');
        const docRef = getEventRef(evt.tenureId, evt.mainEventId, deleteEventId);
        await deleteDoc(docRef);

        if (evt.status === 'PUBLISHED') {
          const notifDoc = doc(collection(db, 'notifications'));
          await setDoc(notifDoc, {
            id: notifDoc.id,
            userId: 'GLOBAL',
            title: 'Event Removed',
            message: `${deletedName} has been removed from published events.`,
            type: 'WARNING',
            read: false,
            isGlobal: true,
            createdAt: new Date().toISOString(),
          });
        }

        setIsDeleting(false);
        setDeleteEventId(null);
        fetchEvents();
        toast.success('Event deleted', `${deletedName} and its registrations were removed.`);
      } catch (err) {
        console.error('Delete event error:', err);
        setIsDeleting(false);
        setDeleteEventId(null);
        toast.error('Could not delete event', 'The event was not removed. Please try again.');
      }
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        e.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const hasActiveFilters =
    selectedMainEventId !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSelectedMainEventId('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  /** Sub-events bucketed under their festival, plus a trailing orphan bucket. */
  const groups = mainEvents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((m) => selectedMainEventId === 'ALL' || m.id === selectedMainEventId)
    .map((main) => ({
      id: main.id,
      label: main.name,
      items: filteredEvents
        .filter((e) => e.mainEventId === main.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }))
    .filter((g) => g.items.length > 0);

  const orphaned = filteredEvents.filter((e) => !mainEvents.some((m) => m.id === e.mainEventId));
  if (orphaned.length > 0 && selectedMainEventId === 'ALL') {
    groups.push({ id: '__other', label: 'Other Events', items: orphaned });
  }

  const totalEventCount = events.length;
  const filteredEventCount = filteredEvents.length;

  return (
    <div>
      <AdminNavTabs />

      <div className="space-y-7">
        <SectionHeading
          eyebrow="Admin control"
          title="Event management"
          description="Create, edit, publish or close registration for Kaziranga House events."
          size="lg"
          as="h1"
          actions={
            <Link href="/neob/admin/events/new">
              <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                New event
              </Button>
            </Link>
          }
        />

        <FilterToolbar
          variant="bare"
          totalCount={totalEventCount}
          filteredCount={filteredEventCount}
          filterTitle="Filter events"
          filterCount={
            (selectedMainEventId !== 'ALL' ? 1 : 0) +
            (selectedStatus !== 'ALL' ? 1 : 0)
          }
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          search={
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search events by title, venue or description…"
              aria-label="Search events"
            />
          }
          filters={
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                  Festival
                </label>
                <FilterSelect
                  value={selectedMainEventId}
                  onChange={setSelectedMainEventId}
                  options={[
                    { value: 'ALL', label: 'All festivals' },
                    ...mainEvents.map((m) => ({ value: m.id, label: m.name })),
                  ]}
                  icon={<Calendar />}
                  ariaLabel="Filter by festival"
                  containerClassName="w-full"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-hairline">
                <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                  Status
                </label>
                <FilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: 'ALL', label: 'All statuses' },
                    { value: 'PUBLISHED', label: 'Published' },
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'CLOSED', label: 'Closed' },
                  ]}
                  icon={<Filter />}
                  ariaLabel="Filter by status"
                  containerClassName="w-full"
                />
              </div>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-3">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 />}
            title={events.length === 0 ? 'No events yet' : 'Nothing in this festival'}
            description={
              events.length === 0
                ? 'Create your first competition to start taking registrations.'
                : 'Try a different festival, or create an event under this one.'
            }
            action={
              <Link href="/neob/admin/events/new">
                <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create event
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => {
              const isOpen = !collapsedGroups.has(group.id);
              return (
                <section key={group.id} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 rounded-2xl bg-[#FFE873] text-black border-2 border-black shadow-[3px_3px_0px_#121212] flex items-center justify-between gap-4 text-left transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="font-display font-black text-title text-black truncate">
                        {group.label}
                      </span>
                      <span className="w-7 h-7 rounded-full bg-white text-black border-2 border-black text-caption font-black grid place-items-center shrink-0 shadow-[1px_1px_0px_#121212]">
                        {group.items.length}
                      </span>
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-white text-black border-2 border-black grid place-items-center shadow-[1.5px_1.5px_0px_#121212] shrink-0">
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 stroke-[3] transition-transform duration-200',
                          isOpen ? 'rotate-0' : '-rotate-90',
                        )}
                        aria-hidden
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <Stagger className="space-y-3">
                      {group.items.map((evt) => (
                        <StaggerItem key={evt.id}>
                          <AdminEventRow
                            event={evt}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteEvent}
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
      </div>

      <ConfirmModal
        isOpen={!!deleteEventId}
        onClose={() => setDeleteEventId(null)}
        onConfirm={executeDeleteEvent}
        title="Delete this event?"
        message="The activity and every participant registration attached to it are removed permanently. This cannot be undone."
        confirmText="Delete event"
        cancelText="Keep it"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
