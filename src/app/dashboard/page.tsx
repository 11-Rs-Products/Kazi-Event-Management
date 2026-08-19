'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { HouseHeader } from '@/components/branding/HouseHeader';
import { EventCard } from '@/components/events/EventCard';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EventItem, Registration, MainEvent } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { query, where, getDocs, collectionGroup, collection } from 'firebase/firestore';
import { getAllEventsGroupRef, getAllRegistrationsGroupRef, getMainEventsCollectionRef, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { Calendar, Ticket, ArrowRight, Sparkles, Bookmark } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventToRegister, setSelectedEventToRegister] = useState<EventItem | null>(null);

  const formatRegDate = (dateVal?: string | null) => {
    if (!dateVal) return 'Recent';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Active';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      const allEvents = mockStore.getEvents();
      const myRegs = mockStore.getRegistrationsForUser(user.uid);
      setEvents(allEvents);
      setMainEvents([{ id: 'communityDayAug26', name: 'Community Day', tenureId: '2026-2027', description: '', status: 'PUBLISHED', createdAt: '', updatedAt: '' }]);
      setMyRegistrations(myRegs);
      setLoading(false);
    } else {
      try {
        const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
        const mainList: MainEvent[] = [];
        mainSnap.forEach((doc) => mainList.push({ id: doc.id, ...doc.data() } as MainEvent));

        const evList: EventItem[] = [];
        
        for (const mainEvent of mainList) {
          const eventsRef = collection(db, `tenures/${DEFAULT_TENURE_ID}/mainEvents/${mainEvent.id}/events`);
          let eventsQuery;
          if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            eventsQuery = query(eventsRef);
          } else {
            eventsQuery = query(
              eventsRef,
              where('status', 'in', ['PUBLISHED', 'CLOSED', 'COMPLETED'])
            );
          }
          const eventsSnap = await getDocs(eventsQuery);
          eventsSnap.forEach((doc) => {
            evList.push({ id: doc.id, ...doc.data() } as EventItem);
          });
        }

        const regsQuery = query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid));
        const regsSnap = await getDocs(regsQuery);
        const regList: Registration[] = [];
        regsSnap.forEach((doc) => {
          if (doc.ref.path.includes('tenures/')) {
            const data = doc.data();
            regList.push({ 
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

        setEvents(evList);
        setMyRegistrations(regList);
        setMainEvents(mainList);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (!user) return null;

  const publishedEvents = events.filter((e) => e.status === 'PUBLISHED');
  const registeredEventIds = new Set(
    myRegistrations.filter((r) => r.status === 'CONFIRMED').map((r) => r.eventId)
  );

  return (
    <div className="space-y-4">
      {/* Welcome Hero Banner */}
      <HouseHeader
        title={`Welcome back, ${user.name}! 🦏`}
        subtitle="Discover upcoming intra-house tournaments and showcase your talent."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/events">
              <Button variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Events
              </Button>
            </Link>
          </div>
        }
      />

      {/* Clean 2-Card Metrics Bar: Separate Individual Cards (Sticky Anchored on Desktop only) */}
      <div className="lg:sticky lg:top-20 lg:z-20 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 flex items-center gap-4 border border-kaziranga-200/80 dark:border-kaziranga-800/80 shadow-lg bg-cream-100/95 dark:bg-kaziranga-900/95 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-kaziranga-100 dark:bg-kaziranga-800 text-kaziranga-800 dark:text-gold-400 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-kaziranga-950 dark:text-white">
              {publishedEvents.length}
            </div>
            <div className="text-xs text-kaziranga-600 dark:text-kaziranga-300 font-semibold">
              Open Events Available
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-4 border border-kaziranga-200/80 dark:border-kaziranga-800/80 shadow-lg bg-cream-100/95 dark:bg-kaziranga-900/95 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-kaziranga-950 dark:text-white">
              {registeredEventIds.size}
            </div>
            <div className="text-xs text-kaziranga-600 dark:text-kaziranga-300 font-semibold">
              My Active Registrations
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Left Scrollable Events + Right Anchored Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Events Directory */}
        <div className="lg:col-span-2 space-y-4">
          {/* Clean Anchored Section Header */}
          <div className="sticky top-16 lg:top-[176px] z-20 py-2 flex items-center justify-between">
            <h2 className="text-lg font-black text-kaziranga-950 dark:text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <Sparkles className="w-5 h-5 text-gold-500" />
              <span>Upcoming & Active Events</span>
            </h2>
            <Link href="/events" className="text-xs font-bold text-kaziranga-700 dark:text-gold-400 hover:underline bg-cream-50/80 dark:bg-kaziranga-950/80 px-2 py-1 rounded-md backdrop-blur-sm">
              View All Events
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : publishedEvents.length === 0 ? (
            <Card className="p-8 text-center text-kaziranga-500 text-xs">
              No open events available right now. Check back soon!
            </Card>
          ) : (
            <div className="space-y-8">
              {mainEvents.map((mainEvent) => {
                const subEvents = publishedEvents.filter((e) => e.mainEventId === mainEvent.id);
                if (subEvents.length === 0) return null;
                return (
                  <div key={mainEvent.id} className="space-y-3">
                    {/* Clean Push-and-Replace Sticky Category Header */}
                    <div className="sticky top-[108px] lg:top-[220px] z-10 py-2 flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-kaziranga-500 drop-shadow-sm" />
                      <h3 className="text-sm font-bold text-kaziranga-800 dark:text-kaziranga-200 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {mainEvent.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {subEvents.map((evt) => (
                        <EventCard
                          key={evt.id}
                          event={evt}
                          isRegistered={registeredEventIds.has(evt.id)}
                          onRegisterClick={(e) => setSelectedEventToRegister(e)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Fallback for subevents with missing/invalid mainEventId */}
              {publishedEvents.filter((e) => !mainEvents.some((m) => m.id === e.mainEventId)).length > 0 && (
                <div className="space-y-3">
                  <div className="sticky top-[108px] lg:top-[220px] z-10 py-2 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-kaziranga-500 drop-shadow-sm" />
                    <h3 className="text-sm font-bold text-kaziranga-800 dark:text-kaziranga-200 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      Other Events
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {publishedEvents
                      .filter((e) => !mainEvents.some((m) => m.id === e.mainEventId))
                      .map((evt) => (
                        <EventCard
                          key={evt.id}
                          event={evt}
                          isRegistered={registeredEventIds.has(evt.id)}
                          onRegisterClick={(e) => setSelectedEventToRegister(e)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Sticky Registrations & Profile Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-[176px] space-y-6">
          {/* My Registrations Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-[10px] pb-1">
              <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-kaziranga-600 dark:text-gold-400" />
                <span>My Active Registrations</span>
              </h3>
              <Link href="/my-registrations" className="text-xs font-semibold text-kaziranga-700 dark:text-gold-400 hover:underline">
                View All
              </Link>
            </div>

            <Card className="p-4 space-y-3 border border-kaziranga-100 dark:border-kaziranga-800/80">
              {myRegistrations.length === 0 ? (
                <p className="text-xs text-kaziranga-500 text-center py-4">
                  You have not registered for any events yet.
                </p>
              ) : (
                myRegistrations.slice(0, 3).map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3 rounded-xl bg-kaziranga-50/70 dark:bg-kaziranga-900/40 border border-kaziranga-100 dark:border-kaziranga-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-kaziranga-950 dark:text-white truncate max-w-[170px]">
                        {reg.eventTitle}
                      </h4>
                      <Badge variant="emerald" size="sm">
                        Confirmed
                      </Badge>
                    </div>
                    <div className="text-[11px] text-kaziranga-500">
                      Registered: {formatRegDate(reg.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>

          {/* Student Profile Overview Card */}
          <Card className="p-5 space-y-4 border border-kaziranga-100 dark:border-kaziranga-800/80">
            <div className="flex items-center justify-between border-b border-kaziranga-100 dark:border-kaziranga-800/80 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-kaziranga-600 dark:text-kaziranga-300">
                Student Profile
              </h3>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-kaziranga-500 dark:text-kaziranga-400">Name:</span>
                <span className="font-bold text-kaziranga-950 dark:text-white">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kaziranga-500 dark:text-kaziranga-400">Email:</span>
                <span className="font-mono text-[11px] text-kaziranga-700 dark:text-kaziranga-300 truncate max-w-[190px]">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kaziranga-500 dark:text-kaziranga-400">Phone:</span>
                <span className="font-semibold text-kaziranga-950 dark:text-white">{user.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-kaziranga-500 dark:text-kaziranga-400">Region:</span>
                <span className="font-semibold text-kaziranga-950 dark:text-white">{user.region || 'Not set'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        event={selectedEventToRegister}
        isOpen={!!selectedEventToRegister}
        onClose={() => setSelectedEventToRegister(null)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
