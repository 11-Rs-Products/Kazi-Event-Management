'use client';

import React from 'react';
import {
  UploadCloud,
  ExternalLink,
  XCircle,
  Edit3,
} from 'lucide-react';
import { Registration, EventItem } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EventCard } from './EventCard';
import { TeamStatusPanel } from './TeamStatusPanel';
import { formatDate } from '@/lib/utils/formatDate';

interface RegistrationCardProps {
  registration: Registration;
  event?: EventItem;
  onEdit: (reg: Registration) => void;
  onCancel: (registrationId: string) => void;
  onOpenSubmission: (reg: Registration) => void;
}

/**
 * One registration in the student's list: the underlying event card plus the
 * team, submission and management controls that only apply once registered.
 */
export const RegistrationCard: React.FC<RegistrationCardProps> = ({
  registration: reg,
  event,
  onEdit,
  onCancel,
  onOpenSubmission,
}) => {
  const isConfirmed = reg.status === 'CONFIRMED';

  // The event document can be missing if it was deleted after registering.
  if (!event) {
    return (
      <Card className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="font-display font-bold text-title-sm text-ink clamp-2">
            {reg.eventTitle || 'Event no longer available'}
          </h3>
          <p className="text-micro text-ink-faint font-mono truncate">ID: {reg.id}</p>
        </div>
        <Badge tone={isConfirmed ? 'live' : 'danger'}>{reg.status}</Badge>
      </Card>
    );
  }

  const needsSubmission = event.requireSubmission || !!reg.submissionContent;
  const isSubmitted = !!reg.submissionContent;
  const isUrlSubmission =
    isSubmitted &&
    (reg.submissionContent!.startsWith('http://') ||
      reg.submissionContent!.startsWith('https://'));

  return (
    <EventCard event={event} isRegistered={isConfirmed}>
      <div className="space-y-3">
        {!isConfirmed && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-signal-danger/10 border border-signal-danger/25">
            <span className="text-caption font-semibold text-signal-danger">
              Registration status
            </span>
            <Badge tone="danger" size="sm">
              {reg.status}
            </Badge>
          </div>
        )}

        {(reg.teamId || reg.teamRole) && (
          <TeamStatusPanel registration={reg} event={event} />
        )}

        {needsSubmission && (
          <div className="p-3.5 rounded-xl bg-surface-sunken border border-hairline space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-caption font-display font-bold text-ink">
                <UploadCloud className="w-4 h-4 text-ink-faint" aria-hidden />
                Submission
              </span>
              <Badge tone={isSubmitted ? 'live' : 'warn'} size="sm">
                {isSubmitted ? 'Submitted' : 'Required'}
              </Badge>
            </div>

            {isSubmitted ? (
              <div className="space-y-2">
                {isUrlSubmission ? (
                  <a
                    href={reg.submissionContent!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-caption font-semibold text-brand hover:underline break-all"
                  >
                    <span className="min-w-0">{reg.submissionContent}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
                  </a>
                ) : (
                  <p className="p-2.5 rounded-lg bg-surface-raised border border-hairline text-micro font-mono text-ink-muted whitespace-pre-wrap clamp-3">
                    {reg.submissionContent}
                  </p>
                )}

                {reg.submittedAt && (
                  <p className="text-micro text-ink-faint">
                    Submitted {formatDate(reg.submittedAt)}
                  </p>
                )}

                {isConfirmed && (
                  <button
                    type="button"
                    onClick={() => onOpenSubmission(reg)}
                    className="text-caption font-display font-bold text-brand hover:underline underline-offset-4"
                  >
                    Update submission
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-micro text-ink-muted leading-relaxed">
                  {event.submissionInstructions ||
                    'Submit your project or files before the deadline.'}
                </p>
                {isConfirmed && (
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                    onClick={() => onOpenSubmission(reg)}
                  >
                    Submit project
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
          <span className="text-micro font-mono text-ink-faint truncate min-w-0">
            {reg.id}
          </span>

          {isConfirmed && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(reg)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(reg.id)}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                className="text-signal-danger hover:bg-signal-danger/10 hover:text-signal-danger"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </EventCard>
  );
};
