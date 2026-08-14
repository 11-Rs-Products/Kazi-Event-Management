import React from 'react';
import { Badge } from '../ui/Badge';
import { EventStatus } from '@/types';
import { CheckCircle2, Clock, Lock, FileEdit } from 'lucide-react';

interface EventStatusBadgeProps {
  status: EventStatus;
  registrationDeadline?: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  registrationDeadline,
}) => {
  const isDeadlinePassed = registrationDeadline && new Date() > new Date(registrationDeadline);

  if (status === 'DRAFT') {
    return (
      <Badge variant="amber" size="sm">
        <FileEdit className="w-3 h-3" />
        <span>Draft</span>
      </Badge>
    );
  }

  if (status === 'CLOSED' || isDeadlinePassed) {
    return (
      <Badge variant="rose" size="sm">
        <Lock className="w-3 h-3" />
        <span>Registration Closed</span>
      </Badge>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <Badge variant="slate" size="sm">
        <CheckCircle2 className="w-3 h-3" />
        <span>Completed</span>
      </Badge>
    );
  }

  return (
    <Badge variant="emerald" size="sm">
      <Clock className="w-3 h-3 animate-pulse text-emerald-500" />
      <span>Open for Registration</span>
    </Badge>
  );
};
