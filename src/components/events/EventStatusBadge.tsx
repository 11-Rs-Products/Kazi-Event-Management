import React from 'react';
import { CheckCircle2, Lock, FileEdit } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EventStatus } from '@/types';

interface EventStatusBadgeProps {
  status: EventStatus;
  registrationDeadline?: string;
  /** Use on top of imagery, where the soft tones lack contrast. */
  onImage?: boolean;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  registrationDeadline,
  onImage = false,
}) => {
  const isDeadlinePassed =
    registrationDeadline && new Date() > new Date(registrationDeadline);

  if (onImage) {
    if (status === 'DRAFT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stage/70 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/90">
          <FileEdit className="w-3 h-3 text-signal-warn" aria-hidden />
          Draft
        </span>
      );
    }

    if (status === 'CLOSED' || isDeadlinePassed) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stage/70 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/80">
          <Lock className="w-3 h-3 text-signal-danger" aria-hidden />
          Closed
        </span>
      );
    }

    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stage/70 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/70">
          <CheckCircle2 className="w-3 h-3 text-white/60" aria-hidden />
          Completed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stage/70 backdrop-blur-md border border-white/15 text-[0.625rem] font-display font-bold uppercase tracking-wider text-white/95">
        <span className="relative flex w-1.5 h-1.5 shrink-0" aria-hidden>
          <span className="absolute inset-0 rounded-full animate-live-ping bg-signal-live" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-signal-live" />
        </span>
        Open
      </span>
    );
  }

  if (status === 'DRAFT') {
    return (
      <Badge tone="warn" size="sm">
        <FileEdit className="w-3 h-3" aria-hidden />
        Draft
      </Badge>
    );
  }

  if (status === 'CLOSED' || isDeadlinePassed) {
    return (
      <Badge tone="danger" size="sm">
        <Lock className="w-3 h-3" aria-hidden />
        Closed
      </Badge>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <Badge tone="neutral" size="sm">
        <CheckCircle2 className="w-3 h-3" aria-hidden />
        Completed
      </Badge>
    );
  }

  return (
    <Badge tone="live" size="sm" pulse>
      Open
    </Badge>
  );
};
