'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EventItem, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAllEventsGroupRef, getEventRef, getMainEventsCollectionRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { AdminNavTabs } from '@/components/admin/AdminNavTabs';
import { Calendar, PlusCircle, Edit, Lock, CheckCircle2, ArrowRight, Bookmark, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [selectedMainEventId, setSelectedMainEventId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setActiveGroupId(prev => prev === groupId ? null : groupId);
  };

  const fetchEvents = async () => {
    setLoading(true);
    if (isMockMode) {
      setEvents(mockStore.getEvents());
      setMainEvents([{ id: 'communityDayAug26', name: 'Community Day', tenureId: '2026-2027', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }]);
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

    if (isMockMode) {
      mockStore.updateEvent(eventId, { status: newStatus as any }, user);
      fetchEvents();
    } else {
      try {
        const evt = events.find(e => e.id === eventId);
        if (!evt) throw new Error("Event not found");
        const docRef = getEventRef(evt.tenureId, evt.mainEventId, eventId);
        await updateDoc(docRef, { status: newStatus, updatedAt: new Date().toISOString() });
        fetchEvents();
      } catch (err) {
        console.error('Status update error:', err);
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user || !confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    if (isMockMode) {
      mockStore.deleteEvent(eventId, user);
      fetchEvents();
    } else {
      try {
        const evt = events.find(e => e.id === eventId);
        if (!evt) throw new Error("Event not found");
        const docRef = getEventRef(evt.tenureId, evt.mainEventId, eventId);
        await deleteDoc(docRef);
        fetchEvents();
      } catch (err) {
        console.error('Delete event error:', err);
      }
    }
  };

  if (!user || user.role === 'USER') return null;

  return (
    <div className="space-y-6">
      <AdminNavTabs />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-kaziranga-900 dark:text-cream-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
            <span>Event Management</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/70 mt-1">
            Create, edit, publish, or close registration for Kaziranga House events.
          </p>
        </div>

        <Link href="/admin/events/new">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create New Event
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-kaziranga-800 dark:text-cream-200 shrink-0">
            Filter by Mega Event:
          </label>
          <select
            value={selectedMainEventId}
            onChange={(e) => setSelectedMainEventId(e.target.value)}
            className="arena-select text-xs sm:text-sm w-full sm:w-auto sm:min-w-[240px]"
          >
            <option value="ALL">All Mega Events</option>
            {mainEvents.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/60">Loading events...</div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center text-xs text-kaziranga-500 dark:text-cream-400/60">
            No events created yet. Click &quot;Create New Event&quot; to add your first competition.
          </Card>
        ) : (
          <div className="space-y-8">
            {mainEvents
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .filter(m => selectedMainEventId === 'ALL' || m.id === selectedMainEventId)
              .map(mainEvent => {
                const subEvents = events
                  .filter(e => e.mainEventId === mainEvent.id)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  
                if (subEvents.length === 0) return null;
                const isCollapsed = activeGroupId !== mainEvent.id;

                return (
                  <div key={mainEvent.id} className="space-y-4">
                    <button 
                      onClick={() => toggleGroup(mainEvent.id)}
                      className="w-full flex items-center justify-between group border-b border-cream-400/30 dark:border-kaziranga-800 pb-2 hover:bg-cream-200/40 dark:hover:bg-kaziranga-900/40 rounded-lg px-2 transition-colors"
                    >
                      <h2 className="text-lg font-black font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-kaziranga-500 dark:text-kaziranga-400" />
                        {mainEvent.name}
                      </h2>
                      <div className="text-kaziranga-400 dark:text-cream-400/60 group-hover:text-kaziranga-600 dark:group-hover:text-cream-200">
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>
                    
                    {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-4">
                      {subEvents.map((evt) => (
                        <Card key={evt.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1 max-w-xl">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100">{evt.name}</h3>
                              <EventStatusBadge status={evt.status} registrationDeadline={evt.registrationDeadline} />
                            </div>
                            <p className="text-xs text-kaziranga-600 dark:text-cream-400/80 line-clamp-2">
                              {evt.description}
                            </p>
                            <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 flex flex-wrap gap-3 pt-1">
                              <span>Category: {evt.category}</span>
                              <span>Venue: {evt.venue}</span>
                              <span>Deadline: {new Date(evt.registrationDeadline).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-cream-400/20 dark:border-kaziranga-800">
                            <select
                              value={evt.status}
                              onChange={(e) => handleStatusChange(evt.id, e.target.value)}
                              className="arena-select text-xs font-semibold w-auto min-w-[130px]"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="PUBLISHED">Published</option>
                              <option value="CLOSED">Closed</option>
                              <option value="COMPLETED">Completed</option>
                            </select>

                            <Link href={`/admin/events/${evt.id}/edit`}>
                              <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                                Edit
                              </Button>
                            </Link>

                            <Link href={`/events/${evt.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${evt.slug || evt.id}`}>
                              <Button size="sm" variant="ghost">
                                View
                              </Button>
                            </Link>

                            <Button size="sm" variant="ghost" onClick={() => handleDeleteEvent(evt.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                    )}
                  </div>
                );
              })}
              
            {/* Fallback for subevents without matching mainEvent */}
            {events.filter((e) => !mainEvents.some((m) => m.id === e.mainEventId)).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-black font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-2 border-b border-cream-400/30 dark:border-kaziranga-800 pb-2">
                  <Bookmark className="w-5 h-5 text-kaziranga-500 dark:text-kaziranga-400" />
                  Other Events
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {events
                    .filter((e) => !mainEvents.some((m) => m.id === e.mainEventId))
                    .map((evt) => (
                      <Card key={evt.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100">{evt.name}</h3>
                            <EventStatusBadge status={evt.status} registrationDeadline={evt.registrationDeadline} />
                          </div>
                          <p className="text-xs text-kaziranga-600 dark:text-cream-400/80 line-clamp-2">
                            {evt.description}
                          </p>
                          <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 flex flex-wrap gap-3 pt-1">
                            <span>Category: {evt.category}</span>
                            <span>Venue: {evt.venue}</span>
                            <span>Deadline: {new Date(evt.registrationDeadline).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-cream-400/20 dark:border-kaziranga-800">
                          <select
                            value={evt.status}
                            onChange={(e) => handleStatusChange(evt.id, e.target.value)}
                            className="arena-select text-xs font-semibold w-auto min-w-[130px]"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="CLOSED">Closed</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          <Link href={`/admin/events/${evt.id}/edit`}>
                            <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
                          </Link>
                          <Link href={`/events/${evt.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${evt.slug || evt.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                          
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteEvent(evt.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
