'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { INITIAL_EVENT_GROUPS } from '@/lib/firebase/mockData';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs } from 'firebase/firestore';
import { getMainEventsCollectionRef } from '@/lib/firebase/paths';
import { EventGroupCard } from '@/components/events/EventGroupCard';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { Calendar, Sparkles } from 'lucide-react';

export default function EventsPage() {
  const { user } = useAuth();
  const [eventGroups, setEventGroups] = useState<import('@/types').EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEventsData = async () => {
    setLoading(true);
    if (isMockMode) {
      setEventGroups(INITIAL_EVENT_GROUPS);
      setLoading(false);
    } else {
      try {
        const eventsSnap = await getDocs(getMainEventsCollectionRef());
        const evList: import('@/types').MainEvent[] = [];
        eventsSnap.forEach((doc) => evList.push({ id: doc.id, ...doc.data() } as import('@/types').MainEvent));
        setEventGroups(evList as any);

      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, [user]);

  const filteredGroups = useMemo(() => {
    return eventGroups.filter((evt) => {
      if (user?.role === 'USER' && evt.status === 'DRAFT') return false;
      return searchQuery === '' || 
             evt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [eventGroups, user, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-kaziranga-950 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-kaziranga-600" />
            <span>Inter-House Events Catalog</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 mt-1">
            Browse active competitions, rulebooks, venues, and deadlines for Kaziranga House.
          </p>
        </div>
      </div>

      <div className="mb-6 max-w-md">
        <input 
          type="text" 
          placeholder="Search collections..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-kaziranga-200 dark:border-kaziranga-800 rounded-xl bg-white dark:bg-kaziranga-900 text-kaziranga-900 dark:text-kaziranga-100 focus:outline-none focus:ring-2 focus:ring-kaziranga-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-kaziranga-100 dark:border-kaziranga-900 bg-white dark:bg-kaziranga-950 space-y-2">
          <Calendar className="w-10 h-10 text-kaziranga-400 mx-auto" />
          <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">No Event Collections Found</h3>
          <p className="text-xs text-kaziranga-500 max-w-sm mx-auto">
            No collections match your current search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((evt) => (
            <EventGroupCard
              key={evt.id}
              group={evt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
