import React from 'react';
import { CheckCircle2, Lock, FileEdit } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EventStatus } from '@/types';

interface EventStatusBadgeProps {
  status: EventStatus;
  registrationDeadline?: string;
  onImage?: boolean;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  registrationDeadline,
}) => {
  const isDeadlinePassed =
    registrationDeadline && new Date() > new Date(registrationDeadline);

  if (status === 'DRAFT') {
    return (
      <Badge tone="warn" size="sm">
        <FileEdit className="w-3 h-3 stroke-[2.5]" aria-hidden />
        Draft
      </Badge>
    );
  }

  if (status === 'CLOSED' || isDeadlinePassed) {
    return (
      <Badge tone="danger" size="sm">
        <Lock className="w-3 h-3 stroke-[2.5]" aria-hidden />
        Closed
      </Badge>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <Badge tone="neutral" size="sm">
        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" aria-hidden />
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
