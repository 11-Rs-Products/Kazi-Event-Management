'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, User, FileText, ArrowUpRight, Check } from 'lucide-react';
import { EventItem } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EventStatusBadge } from './EventStatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';
import { formatDate } from '@/lib/utils/formatDate';
import { DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';
import { cn } from '@/lib/utils/cn';

interface EventCardProps {
  event: EventItem;
  isRegistered?: boolean;
  onRegisterClick?: (event: EventItem) => void;
  children?: React.ReactNode;
  className?: string;
}

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';

/** Strips the stored rich-text markup down to a plain preview line. */
function toPlainText(html?: string): string {
  return (html || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered = false,
  onRegisterClick,
  children,
  className,
}) => {
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull =
    event.maximumParticipants !== null &&
    (event.currentRegistrationCount || 0) >= (event.maximumParticipants || 0);
  const canRegister =
    event.status === 'PUBLISHED' && !isDeadlinePassed && !isFull && !isRegistered;

  const href = `/events/${event.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${event.slug || event.id}`;
  const category = Array.isArray(event.category)
    ? event.category.join(' · ')
    : event.category;

  const seatsPct =
    event.maximumParticipants
      ? Math.min(100, ((event.currentRegistrationCount || 0) / event.maximumParticipants) * 100)
      : null;

  const seatsRemaining =
    event.maximumParticipants !== null
      ? Math.max(0, (event.maximumParticipants || 0) - (event.currentRegistrationCount || 0))
      : null;
  const isAlmostFull = seatsRemaining !== null && seatsRemaining > 0 && seatsRemaining <= 5;

  return (
    <Card
      as="article"
      hoverable
      elevation={1}
      className={cn('flex flex-col h-full group', className)}
    >
      {/* Full-bleed cover with black border separator */}
      <div className="relative aspect-[16/9] w-full bg-[#18181B] overflow-hidden shrink-0 border-b-2 border-black dark:border-white">
        <img
          src={getOptimizedImageUrl(event.coverImageUrl) || FALLBACK_COVER}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
          }}
        />

        <div className="absolute top-3 inset-x-3 flex flex-wrap items-start justify-between gap-1.5 z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            {category && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFE873] border-2 border-black text-black text-[0.625rem] font-display font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#121212] clamp-1">
                {category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5EEAD4] border-2 border-black text-black text-[0.625rem] font-display font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#121212]">
              {event.registrationType === 'TEAM' ? (
                <>
                  <Users className="w-3 h-3 text-black stroke-[2.5]" />
                  <span>
                    Team {event.minimumTeamSize || 2}
                    {event.maximumTeamSize && event.maximumTeamSize !== event.minimumTeamSize
                      ? `–${event.maximumTeamSize}`
                      : ''}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-black stroke-[2.5]" />
                  <span>Solo</span>
                </>
              )}
            </span>
            {event.requireSubmission && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C4B5FD] border-2 border-black text-black text-[0.625rem] font-display font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#121212]">
                <FileText className="w-3 h-3 text-black stroke-[2.5]" />
                <span>Entry File</span>
              </span>
            )}
          </div>
          <EventStatusBadge
            status={event.status}
            registrationDeadline={event.registrationDeadline}
            onImage
          />
        </div>

        {/* Bottom row — shares the width so neither item clips the other. */}
        <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between gap-2">
          {isRegistered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#86EFAC] text-black border-2 border-black shadow-[2px_2px_0px_#121212] text-[0.625rem] font-display font-black uppercase tracking-wider shrink-0">
              <Check className="w-3 h-3 stroke-[3]" aria-hidden />
              Registered
            </span>
          ) : (
            <span aria-hidden />
          )}
          <CountdownTimer targetDate={event.startDateTime} className="shrink-0" />
        </div>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-4">
        <div className="space-y-2 flex-1">
          <h3 className="font-display font-black text-title-sm text-ink leading-snug clamp-2">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:content-[''] hover:underline transition-colors"
            >
              {event.name}
            </Link>
          </h3>
          <p className="text-caption font-medium text-ink-muted leading-relaxed clamp-2">
            {toPlainText(event.description)}
          </p>
        </div>

        <dl className="space-y-2.5 text-caption font-semibold text-ink-muted pt-4 border-t-2 border-black dark:border-white">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-ink-faint shrink-0 stroke-[2]" aria-hidden />
            <dt className="sr-only">Starts</dt>
            <dd className="truncate text-ink font-bold">{formatDate(event.startDateTime)}</dd>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-ink-faint shrink-0 stroke-[2]" aria-hidden />
              <dt className="sr-only">Venue</dt>
              <dd className="truncate text-ink font-bold">{event.venue}</dd>
            </div>
          )}

          {event.maximumParticipants && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-caption font-bold text-ink">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-ink-faint shrink-0 stroke-[2]" aria-hidden />
                  <dt className="sr-only">Seats</dt>
                  <dd className="nums">
                    {event.currentRegistrationCount || 0}/{event.maximumParticipants} seats
                  </dd>
                </div>
                {isAlmostFull && !isFull && (
                  <span className="text-micro font-display font-black text-signal-warn flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-signal-warn animate-ping" />
                    Only {seatsRemaining} left!
                  </span>
                )}
                {isFull && (
                  <span className="text-micro font-display font-black text-signal-danger">
                    Full
                  </span>
                )}
              </div>
              <div
                className="h-2.5 rounded-full bg-surface-sunken border-2 border-black overflow-hidden w-full"
                aria-hidden
              >
                <span
                  className={cn(
                    'block h-full rounded-full transition-[width] duration-500',
                    isFull
                      ? 'bg-[#FF708F]'
                      : isAlmostFull || (seatsPct && seatsPct >= 75)
                      ? 'bg-[#FDBA74]'
                      : 'bg-[#5EEAD4]'
                  )}
                  style={{ width: `${seatsPct}%` }}
                />
              </div>
            </div>
          )}
        </dl>

        {/* Sits above the card-wide link overlay so the button stays clickable. */}
        <div className="relative z-10 pt-4 border-t-2 border-black dark:border-white flex items-center justify-between gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-caption font-display font-black text-ink hover:underline transition-all"
          >
            Details
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" aria-hidden />
          </Link>

          {canRegister ? (
            <Button size="sm" variant="primary" onClick={() => onRegisterClick?.(event)}>
              Register
            </Button>
          ) : isRegistered ? (
            <span className="text-caption font-display font-black text-green-700 dark:text-green-400">
              You&rsquo;re in
            </span>
          ) : (
            <span className="text-caption font-display font-bold text-ink-faint">
              {isFull ? 'Seats full' : isDeadlinePassed ? 'Deadline passed' : 'Closed'}
            </span>
          )}
        </div>

        {children && (
          <div className="relative z-10 pt-4 border-t-2 border-black dark:border-white">{children}</div>
        )}
      </div>
    </Card>
  );
};
