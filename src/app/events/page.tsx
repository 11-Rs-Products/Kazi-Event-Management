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
import { RhinoMascot } from '@/components/branding/RhinoMascot';
import { Calendar, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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
    return eventGroups
      .filter((evt) => {
        if (user?.role === 'USER' && evt.status === 'DRAFT') return false;
        return searchQuery === '' || 
               evt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               evt.description.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [eventGroups, user, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span>RHINOS Event Arena</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
            Browse active competitions, rulebooks, venues, and deadlines for Kaziranga House.
          </p>
        </div>
      </div>

      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400 dark:text-cream-400/40" />
        <input 
          type="text" 
          placeholder="Search challenges..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="arena-input pl-10"
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
        <div className="p-12 text-center rounded-2xl bg-arena-surface dark:bg-kaziranga-900/80 border border-cream-400/20 dark:border-kaziranga-800/50 shadow-arena space-y-4">
          <RhinoMascot pose="thinking" size="md" />
          <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">No Event Collections Found</h3>
          <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 max-w-sm mx-auto">
            No collections match your current search query.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredGroups.map((evt) => (
            <motion.div
              key={evt.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <EventGroupCard group={evt} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
