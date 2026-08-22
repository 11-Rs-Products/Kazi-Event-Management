'use client';

import React from 'react';
import Link from 'next/link';
import { EventItem } from '@/types';
import { Card } from '../ui/Card';
import { EventStatusBadge } from './EventStatusBadge';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Users, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';
import { formatDate } from '@/lib/utils/formatDate';
import { DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { CountdownTimer } from './CountdownTimer';

interface EventCardProps {
  event: EventItem;
  isRegistered?: boolean;
  onRegisterClick?: (event: EventItem) => void;
  children?: React.ReactNode;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered = false,
  onRegisterClick,
  children,
}) => {
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull =
    event.maximumParticipants !== null &&
    (event.currentRegistrationCount || 0) >= (event.maximumParticipants || 0);

  const canRegister =
    event.status === 'PUBLISHED' && !isDeadlinePassed && !isFull && !isRegistered;

  const defaultImage =
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80';

  return (
    <Card hoverable className="flex flex-col h-full group">
      {/* Cover Image Header */}
      <div className="relative h-44 w-full bg-kaziranga-900 overflow-hidden">
        <img
          src={getOptimizedImageUrl(event.coverImageUrl) || defaultImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.currentTarget.src = defaultImage; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full bg-kaziranga-950/80 backdrop-blur-md text-white text-[11px] font-bold border border-kaziranga-700/50">
            {Array.isArray(event.category) ? event.category.join(', ') : event.category}
          </span>
          <EventStatusBadge status={event.status} registrationDeadline={event.registrationDeadline} />
        </div>

        {/* Registered Ribbon */}
        {isRegistered && (
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
            <span>Registered</span>
          </div>
        )}

        {/* Countdown Timer */}
        <CountdownTimer targetDate={event.startDateTime} />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={`/events/${event.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${event.slug || event.id}`}>
            <h3 className="text-base sm:text-lg font-bold font-display text-kaziranga-900 dark:text-cream-100 group-hover:text-kaziranga-600 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
              {event.name}
            </h3>
          </Link>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/80 line-clamp-2 leading-relaxed">
            {event.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="space-y-2 text-xs text-kaziranga-700 dark:text-cream-300/90 pt-2 border-t border-cream-400/30 dark:border-kaziranga-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-kaziranga-500 dark:text-kaziranga-400 shrink-0" />
            <span className="truncate">
              {formatDate(event.startDateTime)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-kaziranga-500 dark:text-kaziranga-400 shrink-0" />
            {event.venueType !== 'TEXT' ? (
              <a href={event.venue.startsWith('http') ? event.venue : `https://${event.venue}`} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-kaziranga-600 dark:text-cream-300" onClick={(e) => e.stopPropagation()}>
                {event.venue}
              </a>
            ) : (
              <span className="truncate">{event.venue}</span>
            )}
          </div>

          {event.maximumParticipants && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-kaziranga-500 dark:text-kaziranga-400 shrink-0" />
              <span>
                {event.currentRegistrationCount || 0} / {event.maximumParticipants} Seats Filled
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-kaziranga-500 dark:text-cream-400/60">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Deadline: {formatDate(event.registrationDeadline)}
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-cream-400/20 dark:border-kaziranga-800">
          <Link
            href={`/events/${event.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${event.slug || event.id}`}
            className="text-xs font-bold text-kaziranga-700 dark:text-cream-300 hover:text-kaziranga-900 dark:hover:text-gold-400 flex items-center gap-1"
          >
            <span>View Rulebook & Info</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {canRegister ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onRegisterClick && onRegisterClick(event)}
            >
              Register Now
            </Button>
          ) : isRegistered ? (
            <Button size="sm" variant="secondary" disabled>
              Registered
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
              <ShieldAlert className="w-3 h-3" />
              {isFull ? 'Seats Full' : isDeadlinePassed ? 'Deadline Passed' : 'Closed'}
            </span>
          )}
        </div>

        {children && (
          <div className="pt-4 border-t border-cream-400/30 dark:border-kaziranga-800">
            {children}
          </div>
        )}
      </div>
    </Card>
  );
};
