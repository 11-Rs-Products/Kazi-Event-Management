'use client';

import React from 'react';
import Link from 'next/link';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { EventItem, EventStatus } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EventStatusBadge } from '../events/EventStatusBadge';
import { DEFAULT_MAIN_EVENT_ID } from '@/lib/firebase/paths';

interface AdminEventRowProps {
  event: EventItem;
  onStatusChange: (eventId: string, status: string) => void;
  onDelete: (eventId: string) => void;
}

/** Strips stored rich text down to a plain preview line. */
function toPlainText(html?: string): string {
  return (html || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STATUSES: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED'];

export const AdminEventRow: React.FC<AdminEventRowProps> = ({
  event,
  onStatusChange,
  onDelete,
}) => {
  const publicHref = `/events/${event.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${event.slug || event.id}`;
  const deadline = new Date(
    event.registrationDeadline || event.registrationEndDateTime || event.startDateTime,
  );

  return (
    <Card elevation={1} className="p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display font-bold text-title-sm text-ink min-w-0 clamp-1">
              {event.name}
            </h3>
            <EventStatusBadge
              status={event.status}
              registrationDeadline={event.registrationDeadline}
            />
          </div>

          <p className="text-caption text-ink-muted clamp-2">{toPlainText(event.description)}</p>

          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-micro text-ink-faint">
            {event.category && (
              <div className="flex gap-1.5">
                <dt>Category</dt>
                <dd className="text-ink-muted font-medium">
                  {Array.isArray(event.category) ? event.category.join(', ') : event.category}
                </dd>
              </div>
            )}
            {event.venue && (
              <div className="flex gap-1.5 min-w-0">
                <dt>Venue</dt>
                <dd className="text-ink-muted font-medium truncate">{event.venue}</dd>
              </div>
            )}
            <div className="flex gap-1.5">
              <dt>Deadline</dt>
              <dd className="text-ink-muted font-medium nums">{deadline.toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Controls wrap onto their own row below the lg breakpoint. */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-hairline">
          <label className="sr-only" htmlFor={`status-${event.id}`}>
            Status for {event.name}
          </label>
          <select
            id={`status-${event.id}`}
            value={event.status}
            onChange={(e) => onStatusChange(event.id, e.target.value)}
            className="ed-select ed-field-sm w-auto min-w-[8.5rem]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          <Link href={`/admin/events/${event.id}/edit`}>
            <Button size="sm" variant="secondary" leftIcon={<Edit className="w-3.5 h-3.5" />}>
              Edit
            </Button>
          </Link>

          <Link href={publicHref} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              View
            </Button>
          </Link>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(event.id)}
            aria-label={`Delete ${event.name}`}
            className="text-signal-danger hover:bg-signal-danger/10 hover:text-signal-danger w-9 h-9"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
