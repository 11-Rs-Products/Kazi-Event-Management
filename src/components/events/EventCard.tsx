'use client';

import React from 'react';
import Link from 'next/link';
import { EventItem } from '@/types';
import { Card } from '../ui/Card';
import { EventStatusBadge } from './EventStatusBadge';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Users, Clock, ArrowRight, ShieldAlert, Zap } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  isRegistered?: boolean;
  onRegisterClick?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered = false,
  onRegisterClick,
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
      {/* Cover Image */}
      <div className="relative h-44 w-full bg-kaziranga-900 overflow-hidden">
        <img
          src={event.coverImageUrl || defaultImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-kaziranga-800/80 backdrop-blur-sm text-cream-200 text-[11px] font-bold border border-kaziranga-700/40 font-display">
            {event.category}
          </span>
          <EventStatusBadge status={event.status} registrationDeadline={event.registrationDeadline} />
        </div>

        {/* Registered Ribbon */}
        {isRegistered && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 font-display">
            <span>✓ YOU'RE IN</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={event.groupId ? `/events/${event.groupId}/subevents/${event.id}` : `/events/${event.id}`}>
            <h3 className="text-base sm:text-lg font-display font-bold text-kaziranga-800 dark:text-cream-100 group-hover:text-kaziranga-600 dark:group-hover:text-kaziranga-300 transition-colors line-clamp-2">
              {event.name}
            </h3>
          </Link>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-xs text-kaziranga-700 dark:text-cream-400/70 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/50 shrink-0" />
            <span className="truncate">
              {new Date(event.startDateTime).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/50 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          {event.maximumParticipants && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/50 shrink-0" />
              <span>
                {event.currentRegistrationCount || 0} / {event.maximumParticipants} Seats
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-kaziranga-500 dark:text-cream-400/50">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Deadline: {new Date(event.registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 flex items-center justify-between gap-3">
          <Link
            href={event.groupId ? `/events/${event.groupId}/subevents/${event.id}` : `/events/${event.id}`}
            className="text-xs font-bold text-kaziranga-700 dark:text-cream-300 hover:text-kaziranga-900 dark:hover:text-cream-100 flex items-center gap-1"
          >
            <span>Rulebook & Info</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {canRegister ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onRegisterClick && onRegisterClick(event)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Join Challenge
            </Button>
          ) : isRegistered ? (
            <Button size="sm" variant="secondary" disabled>
              Registered
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rhino-red dark:text-rhino-red-light bg-rhino-red/5 dark:bg-rhino-red/10 px-2.5 py-1 rounded-lg border border-rhino-red/15">
              <ShieldAlert className="w-3 h-3" />
              {isFull ? 'Seats Full' : isDeadlinePassed ? 'Deadline Passed' : 'Closed'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
