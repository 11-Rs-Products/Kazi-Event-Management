'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { HouseHeader } from '@/components/branding/HouseHeader';
import { RhinoMascot } from '@/components/branding/RhinoMascot';
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
import { Calendar, Ticket, ArrowRight, Trophy, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserDashboard() {
  const { user } = useAuth();

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

  const staggerChild = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* RHINOS Arena Hero */}
      <HouseHeader
        title={`Welcome back, ${user.name}! 🦏`}
        subtitle="Discover upcoming intra-house tournaments, compete for Kaziranga House, and showcase your talent in the RHINOS Arena."
        actions={
          <div className="flex items-center gap-3">
            <Link href="/events">
              <Button variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Enter the Arena
              </Button>
            </Link>
          </div>
        }
      />

      {/* Quick Stats — 3 asymmetric branded cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={staggerChild}>
          <Card variant="teal" className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-300/15 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <div className="text-3xl font-display font-black text-cream-50">
                {publishedEvents.length}
              </div>
              <div className="text-[11px] text-cream-400/70 font-semibold uppercase tracking-wider">Open Events</div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerChild}>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-kaziranga-800/10 dark:bg-kaziranga-700/30 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6 text-kaziranga-700 dark:text-kaziranga-400" />
            </div>
            <div>
              <div className="text-3xl font-display font-black text-kaziranga-800 dark:text-cream-100">
                {registeredEventIds.size}
              </div>
              <div className="text-[11px] text-kaziranga-600/70 dark:text-cream-400/60 font-semibold uppercase tracking-wider">My Registrations</div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerChild}>
          <Card variant="cream" className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-kaziranga-800/10 dark:bg-kaziranga-700/30 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <div className="text-lg font-display font-black text-kaziranga-800 dark:text-cream-100">
                Kaziranga
              </div>
              <div className="text-[11px] text-kaziranga-600/70 dark:text-cream-400/60 font-semibold uppercase tracking-wider">House RHINOS</div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Grid: Events & Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              <span>Upcoming Challenges</span>
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
            <Card className="p-10 text-center">
              <RhinoMascot pose="thinking" size="md" />
              <p className="text-sm text-kaziranga-600 dark:text-cream-400/60 mt-3">
                No open events available right now. Check back soon, RHINO!
              </p>
            </Card>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {publishedEvents.slice(0, 4).map((evt) => (
                <motion.div key={evt.id} variants={staggerChild}>
                  <EventCard
                    event={evt}
                    isRegistered={registeredEventIds.has(evt.id)}
                    onRegisterClick={(e) => setSelectedEventToRegister(e)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right 1 Col: Registrations & Profile */}
        <div className="space-y-6">
          {/* My Registrations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rhino-red" />
                <span>My Active Registrations</span>
              </h3>
              <Link href="/my-registrations" className="text-xs font-semibold text-kaziranga-700 dark:text-gold-400 hover:underline">
                View All
              </Link>
            </div>

            <Card className="p-4 space-y-3">
              {myRegistrations.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-kaziranga-500 dark:text-cream-400/50">
                    No challenges accepted yet. Jump in!
                  </p>
                </div>
              ) : (
                myRegistrations.slice(0, 3).map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/40 border border-cream-400/20 dark:border-kaziranga-700/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-kaziranga-800 dark:text-cream-100 truncate max-w-[180px]">
                        {reg.eventTitle}
                      </h4>
                      <Badge variant="emerald" size="sm">
                        Confirmed
                      </Badge>
                    </div>
                    <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">
                      Registered: {new Date(reg.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>

          {/* RHINOS Member Card */}
          <Card className="overflow-hidden">
            <div className="bg-kaziranga-800 dark:bg-kaziranga-900 px-5 py-4 flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-gold-500/40 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cream-300 text-kaziranga-800 flex items-center justify-center font-display font-black text-sm">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-sm font-display font-bold text-cream-100">{user.name}</h3>
                <p className="text-[10px] text-cream-400/60 font-mono">{user.email}</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-kaziranga-500 dark:text-cream-400/50">
                  RHINOS Member ID
                </span>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-cream-400/15 dark:border-kaziranga-800/40">
                  <span className="text-kaziranga-500 dark:text-cream-400/50">Phone</span>
                  <span className="font-semibold text-kaziranga-800 dark:text-cream-200">{user.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-cream-400/15 dark:border-kaziranga-800/40">
                  <span className="text-kaziranga-500 dark:text-cream-400/50">Region</span>
                  <span className="font-semibold text-kaziranga-800 dark:text-cream-200">{user.region || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-kaziranga-500 dark:text-cream-400/50">Role</span>
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'gold' : user.role === 'ADMIN' ? 'blue' : 'kaziranga'} size="sm">
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : '🦏 Student'}
                  </Badge>
                </div>
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
