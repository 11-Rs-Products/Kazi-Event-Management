'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventGroup, EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { EventCard } from '@/components/events/EventCard';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function EventGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
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
      setLoading(false);
    } else {
      try {
        const docRef = doc(db, 'events', groupId);
        const snap = await getDoc(docRef);
        
        let groupData: EventGroup | null = null;
        
        if (snap.exists()) {
          groupData = { id: snap.id, ...snap.data() } as EventGroup;
        } else {
          // Fallback if parent document is a ghost document but subEvents might exist
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

        const subEventsSnap = await getDocs(collection(db, 'events', groupId, 'subEvents'));
        const subEvList: EventItem[] = [];
        subEventsSnap.forEach((doc) => subEvList.push({ id: doc.id, ...doc.data() } as EventItem));
        setSubEvents(subEvList);

        // DEBUG TELEMETRY
        try {
          const allEventsSnap = await getDocs(collection(db, 'events'));
          await fetch('/api/debug', {
            method: 'POST',
            body: JSON.stringify({
              groupId,
              subEventsCount: subEventsSnap.size,
              groupDataExists: snap.exists(),
              allEventGroups: allEventsSnap.docs.map(d => d.id),
            })
          });
        } catch(e) {
          console.error("Debug telemetry failed:", e);
        }

        if (user) {
          const regsQ = query(collection(db, 'registrations'), where('userId', '==', user.uid));
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
    fetchDetail();
  }, [groupId, user]);

  const registeredEventIds = new Set(myRegistrations.filter((r) => r.status === 'CONFIRMED').map((r) => r.eventId));

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-kaziranga-500">
        Loading event collection details...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-kaziranga-950 dark:text-white">Event Collection Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/events')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Events Catalog
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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-700 dark:text-kaziranga-300 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events Catalog</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-kaziranga-900 border border-kaziranga-100 dark:border-kaziranga-800 shadow-xl h-64 sm:h-80">
        <img
          src={group.coverImageUrl || defaultImage}
          alt={group.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/60 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-kaziranga-950/80 backdrop-blur-md text-white text-xs font-bold border border-kaziranga-700/50">
              {group.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            {group.name}
          </h1>
          <p className="text-sm text-kaziranga-200 mt-2 max-w-3xl">
            {group.description}
          </p>
        </div>
      </div>

      {/* Sub Events */}
      <div className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-kaziranga-600" />
            <span>Activities in {group.name}</span>
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 bg-kaziranga-100/50 dark:bg-kaziranga-900/50 p-1.5 rounded-2xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-white dark:bg-kaziranga-800 text-kaziranga-950 dark:text-white shadow-sm'
                    : 'text-kaziranga-600 dark:text-kaziranga-400 hover:text-kaziranga-950 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
            <h3 className="font-bold mb-2">Error Loading Activities</h3>
            <p className="text-sm font-mono">{error}</p>
            <p className="text-xs mt-4">If this is a "Missing or insufficient permissions" error, please ensure your Firestore Security Rules are deployed.</p>
          </div>
        ) : (
          (() => {
            const filteredEvents = subEvents.filter((evt) => {
            if (activeCategory === 'All') return true;
            // Handle both exact matches and partial matches for older category names (e.g. 'Sports & Fitness')
            const cat = (evt.category || '').toLowerCase();
            const active = activeCategory.toLowerCase();
            return cat === active || cat.includes(active);
          });
          
          const sortedEvents = [...filteredEvents].sort((a, b) => {
            const orderA = a.displayOrder ?? 0;
            const orderB = b.displayOrder ?? 0;
            return orderA - orderB;
          });

          if (sortedEvents.length === 0) {
            return (
              <div className="p-12 text-center rounded-2xl border border-kaziranga-100 dark:border-kaziranga-900 bg-white dark:bg-kaziranga-950 space-y-2">
                <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">No Activities Found</h3>
                <p className="text-xs text-kaziranga-500 max-w-sm mx-auto">
                  {subEvents.length === 0
                    ? 'There are no activities currently scheduled for this event collection.'
                    : `No events available in the "${activeCategory}" category yet.`}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isRegistered={registeredEventIds.has(evt.id)}
                  onRegisterClick={(e) => setSelectedEventToRegister(e)}
                />
              ))}
            </div>
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
