'use client';

import React, { useState } from 'react';
import { TeamInvitation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { updateDoc } from 'firebase/firestore';
import { getTeamInvitationRef } from '@/lib/firebase/paths';
import { Users, CheckCircle2, XCircle, Calendar, User, Mail, AlertCircle } from 'lucide-react';

interface TeamInvitationCardProps {
  invitation: TeamInvitation;
  onAccept?: (invitation: TeamInvitation) => void;
  onReject?: () => void;
  compact?: boolean;
}

export const TeamInvitationCard: React.FC<TeamInvitationCardProps> = ({
  invitation,
  onAccept,
  onReject,
  compact = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [actionTaken, setActionTaken] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      if (isMockMode) {
        mockStore.acceptTeamInvitation(invitation.id, user.uid);
      } else {
        await updateDoc(getTeamInvitationRef(invitation.id), {
          status: 'ACCEPTED',
          inviteeUserId: user.uid,
          updatedAt: new Date().toISOString(),
        });
      }
      setActionTaken('ACCEPTED');
      if (onAccept) onAccept(invitation);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      if (isMockMode) {
        mockStore.rejectTeamInvitation(invitation.id, user.uid);
      } else {
        await updateDoc(getTeamInvitationRef(invitation.id), {
          status: 'REJECTED',
          inviteeUserId: user.uid,
          updatedAt: new Date().toISOString(),
        });
      }
      setActionTaken('REJECTED');
      if (onReject) onReject();
    } catch (err: any) {
      setError(err.message || 'Failed to reject invitation.');
    } finally {
      setLoading(false);
    }
  };

  const displayStatus = actionTaken || invitation.status;
  const isPending = displayStatus === 'PENDING';
  const isAccepted = displayStatus === 'ACCEPTED';
  const isRejected = displayStatus === 'REJECTED';

  const statusTone = isPending ? 'warn' : isAccepted ? 'live' : 'danger';

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-sunken border border-hairline">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-caption font-display font-bold text-ink truncate">
            {invitation.eventName}
          </p>
          <p className="flex items-center gap-1.5 text-micro text-ink-muted">
            <User className="w-3 h-3 shrink-0" aria-hidden />
            From {invitation.inviterName}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isPending ? (
            <>
              <Button size="sm" variant="primary" onClick={handleAccept} isLoading={loading}>
                Accept
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReject} isLoading={loading}>
                Decline
              </Button>
            </>
          ) : (
            <Badge tone={statusTone} size="sm">
              {displayStatus}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card elevation={2} className="overflow-visible">
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-display font-bold text-title-sm text-ink">
          <Users className="w-4 h-4 text-ink-faint" aria-hidden />
          Team invitation
        </h3>
        <Badge tone={statusTone}>{displayStatus}</Badge>
      </div>

      <dl className="px-5 py-4 space-y-3">
        {[
          { Icon: Calendar, label: 'Event', value: invitation.eventName },
          { Icon: User, label: 'Invited by', value: invitation.inviterName },
          {
            Icon: Mail,
            label: 'Leader email',
            value: invitation.inviterEmail,
            mono: true,
          },
        ].map(({ Icon, label, value, mono }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0">
              <dt className="text-eyebrow uppercase font-display text-ink-faint">{label}</dt>
              <dd
                className={`text-caption text-ink font-medium break-words ${
                  mono ? 'font-mono' : ''
                }`}
              >
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {error && (
        <div
          role="alert"
          className="mx-5 mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-signal-danger/10 border border-signal-danger/25 text-signal-danger text-caption"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {isPending && (
        <div className="px-5 py-4 border-t border-hairline flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAccept}
            isLoading={loading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Accept &amp; register
          </Button>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleReject}
            isLoading={loading}
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Decline
          </Button>
        </div>
      )}

      {isAccepted && !actionTaken && (
        <p className="mx-5 mb-5 p-3.5 rounded-xl bg-signal-live/10 border border-signal-live/25 text-caption text-signal-live">
          You have accepted this invitation. Complete your registration for the event to secure
          your place.
        </p>
      )}

      {isRejected && (
        <p className="mx-5 mb-5 p-3.5 rounded-xl bg-signal-danger/10 border border-signal-danger/25 text-caption text-signal-danger">
          You declined this team invitation.
        </p>
      )}
    </Card>
  );
};
