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
import { RhinoMascot } from '@/components/branding/RhinoMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
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
  
  const [error, setError] = useState<string | null>(null);
  
  const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports'];

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
        } catch(e) {
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
      <div className="p-8 text-center">
        <RhinoMascot pose="thinking" size="sm" />
        <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 mt-2">Loading event collection...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center space-y-4">
        <RhinoMascot pose="thinking" size="md" />
        <h2 className="text-xl font-display font-bold text-kaziranga-800 dark:text-cream-100">Event Collection Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/events')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Events
        </Button>
      </div>
    );
  }

  const defaultImage =
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/events')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-700 dark:text-cream-300 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-kaziranga-900 border border-kaziranga-700/30 dark:border-kaziranga-800 shadow-kaziranga-lg h-64 sm:h-80">
        <img
          src={getOptimizedImageUrl(group.coverImageUrl) || defaultImage}
          alt={group.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/50 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-kaziranga-800/80 backdrop-blur-sm text-cream-200 text-xs font-bold border border-kaziranga-700/40 font-display">
              {group.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-cream-50 leading-tight">
            {group.name}
          </h1>
          <p className="text-sm text-cream-300/80 mt-2 max-w-3xl">
            {group.description}
          </p>
        </div>
      </div>

      {/* Sub Events */}
      <div className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-kaziranga-600 dark:text-kaziranga-400" />
            <span>Activities in {group.name}</span>
          </h2>
          
          <div className="flex flex-wrap items-center gap-1.5 bg-cream-300/50 dark:bg-kaziranga-900/50 p-1.5 rounded-2xl border border-cream-400/20 dark:border-kaziranga-800/40">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all font-display ${
                  activeCategory === cat
                    ? 'bg-kaziranga-800 dark:bg-kaziranga-700 text-cream-100 shadow-sm'
                    : 'text-kaziranga-600 dark:text-cream-400/60 hover:text-kaziranga-800 dark:hover:text-cream-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center rounded-2xl border border-rhino-red/20 bg-rhino-red/5 text-rhino-red">
            <h3 className="font-bold mb-2">Error Loading Activities</h3>
            <p className="text-sm font-mono">{error}</p>
            <p className="text-xs mt-4 text-kaziranga-500">If this is a "Missing or insufficient permissions" error, please ensure your Firestore Security Rules are deployed.</p>
          </div>
        ) : (
          (() => {
            const filteredEvents = subEvents.filter((evt) => {
              if (activeCategory === 'All') return true;
              const cats = Array.isArray(evt.category) ? evt.category : [evt.category || ''];
              const active = activeCategory.toLowerCase();
              return cats.some(c => c.toLowerCase() === active || c.toLowerCase().includes(active));
            });
          
          const sortedEvents = [...filteredEvents].sort((a, b) => {
            const timeA = new Date(a.startDateTime || a.createdAt).getTime();
            const timeB = new Date(b.startDateTime || b.createdAt).getTime();
            return timeB - timeA;
          });

          if (sortedEvents.length === 0) {
            return (
              <div className="p-12 text-center rounded-2xl bg-arena-surface dark:bg-kaziranga-900/80 border border-cream-400/20 dark:border-kaziranga-800/50 shadow-arena space-y-4">
                <RhinoMascot pose="thinking" size="md" />
                <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">No Activities Found</h3>
                <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 max-w-sm mx-auto">
                  {subEvents.length === 0
                    ? 'There are no activities currently scheduled for this event collection.'
                    : `No events available in the "${activeCategory}" category yet.`}
                </p>
              </div>
            );
          }

          return (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sortedEvents.map((evt) => (
                <motion.div
                  key={evt.id}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                >
                  <EventCard
                    event={evt}
                    isRegistered={registeredEventIds.has(evt.id)}
                    onRegisterClick={(e) => setSelectedEventToRegister(e)}
                  />
                </motion.div>
              ))}
            </motion.div>
          );
        })())}
      </div>

      <RegistrationModal
        event={selectedEventToRegister}
        isOpen={!!selectedEventToRegister}
        onClose={() => setSelectedEventToRegister(null)}
        onSuccess={() => fetchDetail()}
      />
    </div>
  );
}
