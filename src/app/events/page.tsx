'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EventItem, Registration } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { EventCard } from '@/components/events/EventCard';
import { EventFilter } from '@/components/events/EventFilter';
import { RegistrationModal } from '@/components/events/RegistrationModal';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { Calendar, Sparkles } from 'lucide-react';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEventToRegister, setSelectedEventToRegister] = useState<EventItem | null>(null);

  const fetchEventsData = async () => {
    setLoading(true);
    if (isMockMode) {
      setEvents(mockStore.getEvents());
      if (user) {
        setMyRegistrations(mockStore.getRegistrationsForUser(user.uid));
      }
      setLoading(false);
    } else {
      try {
        const eventsSnap = await getDocs(collection(db, 'events'));
        const evList: EventItem[] = [];
        eventsSnap.forEach((doc) => evList.push({ id: doc.id, ...doc.data() } as EventItem));
        setEvents(evList);

        if (user) {
          const regsQuery = query(collection(db, 'registrations'), where('userId', '==', user.uid));
          const regsSnap = await getDocs(regsQuery);
          const regList: Registration[] = [];
          regsSnap.forEach((doc) => regList.push({ id: doc.id, ...doc.data() } as Registration));
          setMyRegistrations(regList);
        }
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

  const categories = useMemo(() => {
    const set = new Set(events.map((e) => e.category));
    return Array.from(set);
  }, [events]);

  const registeredEventIds = useMemo(() => {
    return new Set(myRegistrations.filter((r) => r.status === 'CONFIRMED').map((r) => r.eventId));
  }, [myRegistrations]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Users can only view PUBLISHED, CLOSED, COMPLETED events unless they are admin
      if (user?.role === 'USER' && evt.status === 'DRAFT') {
        return false;
      }

      const matchSearch =
        searchQuery === '' ||
        evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.venue.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'ALL' || evt.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || evt.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [events, user, searchQuery, selectedCategory, selectedStatus]);

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

      {/* Filter Controls */}
      <EventFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        categories={categories}
      />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-kaziranga-100 dark:border-kaziranga-900 bg-white dark:bg-kaziranga-950 space-y-2">
          <Calendar className="w-10 h-10 text-kaziranga-400 mx-auto" />
          <h3 className="text-sm font-bold text-kaziranga-950 dark:text-white">No Events Found</h3>
          <p className="text-xs text-kaziranga-500 max-w-sm mx-auto">
            No events match your current search query or filter selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              isRegistered={registeredEventIds.has(evt.id)}
              onRegisterClick={(e) => setSelectedEventToRegister(e)}
            />
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        event={selectedEventToRegister}
        isOpen={!!selectedEventToRegister}
        onClose={() => setSelectedEventToRegister(null)}
        onSuccess={() => fetchEventsData()}
      />
    </div>
  );
}
