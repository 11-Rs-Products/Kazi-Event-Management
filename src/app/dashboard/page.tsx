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
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Calendar, Ticket, User, ArrowRight, Trophy, Sparkles, ShieldCheck } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventToRegister, setSelectedEventToRegister] = useState<EventItem | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      const allEvents = mockStore.getEvents();
      const myRegs = mockStore.getRegistrationsForUser(user.uid);
      setEvents(allEvents);
      setMyRegistrations(myRegs);
      setLoading(false);
    } else {
      try {
        const eventsQuery = query(collection(db, 'events'));
        const eventsSnap = await getDocs(eventsQuery);
        const evList: EventItem[] = [];
        eventsSnap.forEach((doc) => evList.push({ id: doc.id, ...doc.data() } as EventItem));

        const regsQuery = query(collection(db, 'registrations'), where('userId', '==', user.uid));
        const regsSnap = await getDocs(regsQuery);
        const regList: Registration[] = [];
        regsSnap.forEach((doc) => regList.push({ id: doc.id, ...doc.data() } as Registration));

        setEvents(evList);
        setMyRegistrations(regList);
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
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <HouseHeader
        title={`Welcome back, ${user.name}! 🦏`}
        subtitle="Discover upcoming inter-house tournaments, earn house points, and represent Kaziranga House with pride."
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

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border border-kaziranga-100 dark:border-kaziranga-800/80 shadow-md">
          <div className="w-11 h-11 rounded-2xl bg-kaziranga-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-gold-400 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-kaziranga-950 dark:text-white">
              {publishedEvents.length}
            </div>
            <div className="text-[11px] text-kaziranga-600 dark:text-kaziranga-300 font-semibold">Open Events</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border border-kaziranga-100 dark:border-kaziranga-800/80 shadow-md">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-kaziranga-950 dark:text-white">
              {registeredEventIds.size}
            </div>
            <div className="text-[11px] text-kaziranga-600 dark:text-kaziranga-300 font-semibold">My Registrations</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border border-kaziranga-100 dark:border-kaziranga-800/80 shadow-md">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-gold-600 dark:text-gold-400 flex items-center justify-center font-bold shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-kaziranga-950 dark:text-white">
              Kaziranga
            </div>
            <div className="text-[11px] text-kaziranga-600 dark:text-kaziranga-300 font-semibold">House Standings</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border border-kaziranga-100 dark:border-kaziranga-800/80 shadow-md">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-kaziranga-950 dark:text-white truncate max-w-[100px]">
              {user.role}
            </div>
            <div className="text-[11px] text-kaziranga-600 dark:text-kaziranga-300 font-semibold">Account Role</div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Events & Registrations Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Featured Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              <span>Upcoming & Active Events</span>
            </h2>
            <Link href="/events" className="text-xs font-bold text-kaziranga-700 dark:text-gold-400 hover:underline">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publishedEvents.slice(0, 4).map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isRegistered={registeredEventIds.has(evt.id)}
                  onRegisterClick={(e) => setSelectedEventToRegister(e)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: My Registrations & Quick Profile */}
        <div className="space-y-6">
          {/* My Registrations Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
                      <h4 className="font-bold text-xs text-kaziranga-950 dark:text-white truncate max-w-[180px]">
                        {reg.eventTitle}
                      </h4>
                      <Badge variant="emerald" size="sm">
                        Confirmed
                      </Badge>
                    </div>
                    <div className="text-[11px] text-kaziranga-500">
                      Registered: {new Date(reg.createdAt).toLocaleDateString()}
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
                <span className="font-mono text-[11px] text-kaziranga-700 dark:text-kaziranga-300">{user.email}</span>
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
