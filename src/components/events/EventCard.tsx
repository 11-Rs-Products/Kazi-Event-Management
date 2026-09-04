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
      {/* Full-bleed cover — the editorial anchor of the card. */}
      <div className="relative aspect-[16/9] w-full bg-stage overflow-hidden shrink-0">
        <img
          src={getOptimizedImageUrl(event.coverImageUrl) || FALLBACK_COVER}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.06]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-stage via-stage/25 to-stage/10"
          aria-hidden
        />

        <div className="absolute top-3 inset-x-3 flex flex-wrap items-start justify-between gap-1.5 z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            {category && (
              <span className="px-2 py-1 rounded-md bg-stage/80 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/90 clamp-1">
                {category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stage/80 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/90">
              {event.registrationType === 'TEAM' ? (
                <>
                  <Users className="w-3 h-3 text-[rgb(var(--accent-vivid))]" />
                  <span>
                    Team {event.minimumTeamSize || 2}
                    {event.maximumTeamSize && event.maximumTeamSize !== event.minimumTeamSize
                      ? `–${event.maximumTeamSize}`
                      : ''}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-kaziranga-300" />
                  <span>Solo</span>
                </>
              )}
            </span>
            {event.requireSubmission && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stage/80 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/90">
                <FileText className="w-3 h-3 text-[rgb(var(--accent-vivid))]" />
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-signal-live text-white text-[0.625rem] font-display font-bold uppercase tracking-wider shrink-0">
              <Check className="w-3 h-3" aria-hidden />
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
          <h3 className="font-display font-extrabold text-title-sm text-ink leading-snug clamp-2">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:content-[''] hover:text-brand transition-colors"
            >
              {event.name}
            </Link>
          </h3>
          <p className="text-caption text-ink-muted leading-relaxed clamp-2">
            {toPlainText(event.description)}
          </p>
        </div>

        <dl className="space-y-2.5 text-caption text-ink-muted pt-4 border-t border-hairline">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-ink-faint shrink-0" aria-hidden />
            <dt className="sr-only">Starts</dt>
            <dd className="truncate">{formatDate(event.startDateTime)}</dd>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-ink-faint shrink-0" aria-hidden />
              <dt className="sr-only">Venue</dt>
              <dd className="truncate">{event.venue}</dd>
            </div>
          )}

          {event.maximumParticipants && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-caption text-ink-muted">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-ink-faint shrink-0" aria-hidden />
                  <dt className="sr-only">Seats</dt>
                  <dd className="nums">
                    {event.currentRegistrationCount || 0}/{event.maximumParticipants} seats
                  </dd>
                </div>
                {isAlmostFull && !isFull && (
                  <span className="text-micro font-display font-bold text-signal-warn flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-signal-warn animate-pulse" />
                    Only {seatsRemaining} left!
                  </span>
                )}
                {isFull && (
                  <span className="text-micro font-display font-bold text-signal-danger">
                    Full
                  </span>
                )}
              </div>
              <div
                className="h-1.5 rounded-full bg-surface-sunken overflow-hidden w-full"
                aria-hidden
              >
                <span
                  className={cn(
                    'block h-full rounded-full transition-[width] duration-700 ease-editorial',
                    isFull
                      ? 'bg-signal-danger'
                      : isAlmostFull || (seatsPct && seatsPct >= 75)
                      ? 'bg-signal-warn'
                      : 'bg-brand'
                  )}
                  style={{ width: `${seatsPct}%` }}
                />
              </div>
            </div>
          )}
        </dl>

        {/* Sits above the card-wide link overlay so the button stays clickable. */}
        <div className="relative z-10 pt-4 border-t border-hairline flex items-center justify-between gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-caption font-display font-bold text-ink-muted hover:text-brand transition-colors"
          >
            Details
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
          </Link>

          {canRegister ? (
            <Button size="sm" variant="primary" onClick={() => onRegisterClick?.(event)}>
              Register
            </Button>
          ) : isRegistered ? (
            <span className="text-caption font-display font-bold text-signal-live">
              You&rsquo;re in
            </span>
          ) : (
            <span className="text-caption font-display font-semibold text-ink-faint">
              {isFull ? 'Seats full' : isDeadlinePassed ? 'Deadline passed' : 'Closed'}
            </span>
          )}
        </div>

        {children && (
          <div className="relative z-10 pt-4 border-t border-hairline">{children}</div>
        )}
      </div>
    </Card>
  );
};
