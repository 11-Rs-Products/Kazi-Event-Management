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

  if (status === 'DRAFT') {
    return (
      <Badge tone="warn" size="sm" solid={onImage}>
        <FileEdit className="w-3 h-3" aria-hidden />
        Draft
      </Badge>
    );
  }

  if (status === 'CLOSED' || isDeadlinePassed) {
    return (
      <Badge tone="danger" size="sm" solid={onImage}>
        <Lock className="w-3 h-3" aria-hidden />
        Closed
      </Badge>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <Badge tone="neutral" size="sm" solid={onImage}>
        <CheckCircle2 className="w-3 h-3" aria-hidden />
        Completed
      </Badge>
    );
  }

  return (
    <Badge tone="live" size="sm" solid={onImage} pulse>
      Open
    </Badge>
  );
};
