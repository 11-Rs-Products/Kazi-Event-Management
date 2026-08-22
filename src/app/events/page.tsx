'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { INITIAL_EVENT_GROUPS } from '@/lib/firebase/mockData';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDocs } from 'firebase/firestore';
import { getMainEventsCollectionRef, getAllEventsGroupRef } from '@/lib/firebase/paths';
import { EventGroupCard } from '@/components/events/EventGroupCard';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { RhinoMascot } from '@/components/branding/RhinoMascot';
import { Calendar, Search, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EventsPage() {
  const { user } = useAuth();
  const [eventGroups, setEventGroups] = useState<import('@/types').EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTiming, setActiveTiming] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  const [megaEventMeta, setMegaEventMeta] = useState<Record<string, {
    categories: Set<string>;
    hasRegistrationOpen: boolean;
    hasOngoing: boolean;
    allEnded: boolean;
    hasOtherCategory: boolean;
  }>>({});

  const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Other'];

  const fetchEventsData = async () => {
    setLoading(true);
    if (isMockMode) {
      setEventGroups(mockStore.getMainEvents());
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(getMainEventsCollectionRef());
        const list: import('@/types').EventGroup[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as import('@/types').EventGroup));
        setEventGroups(list);

        const subEventsSnap = await getDocs(getAllEventsGroupRef());
        const meta: Record<string, { categories: Set<string>; hasRegistrationOpen: boolean; hasOngoing: boolean; allEnded: boolean; count: number; endedCount: number; hasOtherCategory: boolean }> = {};

        subEventsSnap.forEach((d) => {
          const evt = { id: d.id, ...d.data() } as EventItem;
          if (!evt.mainEventId) return;

          if (!meta[evt.mainEventId]) {
            meta[evt.mainEventId] = { categories: new Set(), hasRegistrationOpen: false, hasOngoing: false, allEnded: false, count: 0, endedCount: 0, hasOtherCategory: false };
          }

          const m = meta[evt.mainEventId];
          m.count++;

          // Add categories
          const cats = Array.isArray(evt.category) ? evt.category : [evt.category || ''];
          const mainCats = ['technical', 'cultural', 'sports'];
          let thisEventHasOther = false;
          
          cats.forEach(c => {
             if(c && typeof c === 'string') {
               const cl = c.toLowerCase();
               m.categories.add(cl);
               if (!mainCats.some(mcat => cl.includes(mcat))) {
                 thisEventHasOther = true;
               }
             }
          });
          
          if (cats.length === 0 || (cats.length === 1 && !cats[0])) {
            thisEventHasOther = true;
          }
          
          if (thisEventHasOther) {
            m.hasOtherCategory = true;
          }

          const now = new Date().getTime();
          const start = new Date(evt.startDateTime).getTime();
          const end = new Date(evt.endDateTime || evt.startDateTime).getTime();
          const regDeadline = new Date(evt.registrationDeadline).getTime();
          const regEndDateTime = evt.registrationEndDateTime ? new Date(evt.registrationEndDateTime).getTime() : regDeadline;

          if (now < regEndDateTime && evt.status === 'PUBLISHED') {
            m.hasRegistrationOpen = true;
          }
          if (now >= start && now <= end) {
            m.hasOngoing = true;
          }
          if (now > end) {
            m.endedCount++;
          }
        });

        const finalMeta: Record<string, { categories: Set<string>; hasRegistrationOpen: boolean; hasOngoing: boolean; allEnded: boolean; hasOtherCategory: boolean }> = {};
        Object.keys(meta).forEach(k => {
          finalMeta[k] = {
            categories: meta[k].categories,
            hasRegistrationOpen: meta[k].hasRegistrationOpen,
            hasOngoing: meta[k].hasOngoing,
            allEnded: meta[k].count > 0 && meta[k].count === meta[k].endedCount,
            hasOtherCategory: meta[k].hasOtherCategory
          };
        });
        setMegaEventMeta(finalMeta);

      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  const filteredGroups = useMemo(() => {
    return eventGroups
      .filter((evt) => {
        if (user?.role === 'USER' && evt.status === 'DRAFT') return false;

        const meta = megaEventMeta[evt.id];

        // Timing Filter
        if (activeTiming === 'Registrations Open' && (!meta || !meta.hasRegistrationOpen)) return false;
        if (activeTiming === 'Ongoing' && (!meta || !meta.hasOngoing)) return false;
        if (activeTiming === 'Ended' && (!meta || !meta.allEnded)) return false;

        // Category Filter
        if (activeCategory !== 'All') {
          if (!meta) return false;
          
          if (activeCategory === 'Other') {
            if (!meta.hasOtherCategory) return false;
          } else {
            const active = activeCategory.toLowerCase();
            let hasCategory = false;
            meta.categories.forEach(c => {
              if (c && typeof c === 'string' && (c === active || c.includes(active))) hasCategory = true;
            });
            if (!hasCategory) return false;
          }
        }

        return searchQuery === '' ||
          evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.description.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [eventGroups, user, searchQuery, activeTiming, activeCategory, megaEventMeta]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-kaziranga-800 dark:text-cream-100 flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-gold-500 shrink-0" />
            <span>RHINOS Event Arena</span>
          </h1>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-1">
            Browse active competitions, rulebooks, venues, and deadlines for Kaziranga House.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="max-w-md w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400 dark:text-cream-400/40" />
          <input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="arena-input pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto w-full md:w-auto">
          <div className="relative group w-full md:w-auto">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="appearance-none bg-cream-300/50 dark:bg-kaziranga-900/50 text-kaziranga-800 dark:text-cream-100 px-4 py-2 pr-10 rounded-xl text-sm font-bold border border-cream-400/20 dark:border-kaziranga-800/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50 cursor-pointer font-display w-full"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-kaziranga-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="relative group w-full md:w-auto">
            <select
              value={activeTiming}
              onChange={(e) => setActiveTiming(e.target.value)}
              className="appearance-none bg-cream-300/50 dark:bg-kaziranga-900/50 text-kaziranga-800 dark:text-cream-100 px-4 py-2 pr-10 rounded-xl text-sm font-bold border border-cream-400/20 dark:border-kaziranga-800/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50 cursor-pointer font-display w-full"
            >
              <option value="All">All</option>
              <option value="Registrations Open">Registrations Open</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Ended">Ended</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-kaziranga-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
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
