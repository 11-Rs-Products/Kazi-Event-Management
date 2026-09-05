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
import { HouseHeader, HeaderStats } from '@/components/branding/HouseHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPill } from '@/components/ui/FilterPill';
import { FilterToolbar } from '@/components/ui/FilterToolbar';
import { cn } from '@/lib/utils/cn';
import { SearchX } from 'lucide-react';

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

  const hasActiveFilters =
    searchQuery !== '' || activeTiming !== 'All' || activeCategory !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTiming('All');
    setActiveCategory('All');
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: eventGroups.length };
    CATEGORIES.forEach((cat) => {
      if (cat === 'All') return;
      if (cat === 'Other') {
        counts[cat] = eventGroups.filter((g) => megaEventMeta[g.id]?.hasOtherCategory).length;
      } else {
        const catLower = cat.toLowerCase();
        counts[cat] = eventGroups.filter((g) => {
          const meta = megaEventMeta[g.id];
          if (!meta) return false;
          let match = false;
          meta.categories.forEach((c) => {
            if (c && typeof c === 'string' && (c === catLower || c.includes(catLower))) match = true;
          });
          return match;
        }).length;
      }
    });
    return counts;
  }, [eventGroups, megaEventMeta]);

  const timingCounts: Record<string, number> = useMemo(() => {
    return {
      All: eventGroups.length,
      'Registrations Open': eventGroups.filter((g) => megaEventMeta[g.id]?.hasRegistrationOpen).length,
      Ongoing: eventGroups.filter((g) => megaEventMeta[g.id]?.hasOngoing).length,
      Ended: eventGroups.filter((g) => megaEventMeta[g.id]?.allEnded).length,
    };
  }, [eventGroups, megaEventMeta]);

  return (
    <div className="space-y-8">
      <HouseHeader
        badge="Rhinos Event Arena"
        title="Every competition, one arena."
        subtitle="Browse active festivals, rulebooks, venues and deadlines across Kaziranga House."
        footer={
          <HeaderStats
            items={[
              { label: 'Festivals', value: <AnimatedNumber value={eventGroups.length} /> },
              { label: 'Showing', value: <AnimatedNumber value={filteredGroups.length} /> },
            ]}
          />
        }
      />

      {/* ─── Unified Filters Toolbar ─── */}
      <FilterToolbar
        variant="bare"
        totalCount={eventGroups.length}
        filteredCount={filteredGroups.length}
        filterTitle="Filter festivals"
        filterCount={(activeCategory !== 'All' ? 1 : 0) + (activeTiming !== 'All' ? 1 : 0)}
        hasActiveFilters={hasActiveFilters}
        onReset={clearFilters}
        search={
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search festivals by name or description…"
            aria-label="Search festivals"
          />
        }
        filters={
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <FilterPill
                    key={cat}
                    active={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                    count={categoryCounts[cat] || 0}
                  >
                    {cat === 'All' ? 'All categories' : cat}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-hairline">
              <label className="block text-micro font-display font-bold uppercase tracking-wider text-ink-muted">
                Status & Timeline
              </label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Registrations Open', 'Ongoing', 'Ended'].map((t) => (
                  <FilterPill
                    key={t}
                    active={activeTiming === t}
                    onClick={() => setActiveTiming(t)}
                    count={timingCounts[t] || 0}
                  >
                    {t === 'All' ? 'Any status' : t}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        }
      />

      {/* ─── Results ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="No festivals match those filters"
          description={
            hasActiveFilters
              ? 'Try widening your search or clearing the filters to see everything on offer.'
              : 'Nothing has been published yet. New festivals appear here as soon as they go live.'
          }
          action={
            hasActiveFilters && (
              <Button variant="secondary" size="md" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((evt) => (
            <StaggerItem key={evt.id} className="h-full">
              <EventGroupCard group={evt} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
