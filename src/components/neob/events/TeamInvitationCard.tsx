'use client';

import React, { useState } from 'react';
import { TeamInvitation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AlertBanner } from '../ui/AlertBanner';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { updateDoc, doc, collection, setDoc } from 'firebase/firestore';
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

        const notifDoc = doc(collection(db, 'notifications'));
        await setDoc(notifDoc, {
          id: notifDoc.id,
          userId: invitation.inviterUserId,
          title: 'Team Invitation Accepted',
          message: `${user.name || invitation.inviteeEmail} has accepted your team invitation and joined your team for "${invitation.eventName}".`,
          type: 'SUCCESS',
          linkUrl: `/events/${invitation.eventId}`,
          read: false,
          createdAt: new Date().toISOString(),
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

        const notifDoc = doc(collection(db, 'notifications'));
        await setDoc(notifDoc, {
          id: notifDoc.id,
          userId: invitation.inviterUserId,
          title: 'Team Invitation Declined',
          message: `${user.name || invitation.inviteeEmail} has declined your team invitation for "${invitation.eventName}".`,
          type: 'WARNING',
          read: false,
          createdAt: new Date().toISOString(),
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
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-sunken border-2 border-black dark:border-white shadow-[3px_3px_0px_#121212]">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-caption font-display font-black text-ink truncate">
            {invitation.eventName}
          </p>
          <p className="flex items-center gap-1.5 text-micro text-ink-muted font-medium">
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
    <Card elevation={2} className="overflow-hidden">
      <div className="rounded-t-[14px] px-5 py-4 border-b-2 border-black dark:border-white flex items-center justify-between gap-3 bg-[#FFE873] text-black">
        <h3 className="inline-flex items-center gap-2 font-display font-black text-title-sm text-black">
          <Users className="w-4 h-4 text-black stroke-[2.5]" aria-hidden />
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
            <Icon className="w-4 h-4 text-ink-faint shrink-0 mt-0.5 stroke-[2]" aria-hidden />
            <div className="min-w-0">
              <dt className="text-eyebrow uppercase font-display font-black text-ink-faint">{label}</dt>
              <dd
                className={`text-caption text-ink font-bold break-words ${
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
          className="mx-5 mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FFA0A0] text-black border-2 border-black shadow-[2px_2px_0px_#121212] text-caption font-bold"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-black stroke-[2.5]" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {isPending && (
        <div className="px-5 py-4 border-t-2 border-black dark:border-white flex flex-col sm:flex-row items-center gap-3 bg-surface-sunken">
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
        <div className="mx-5 mb-5">
          <AlertBanner tone="success" title="Invitation Accepted">
            You have accepted this invitation. Complete your registration for the event to secure
            your place.
          </AlertBanner>
        </div>
      )}

      {isRejected && (
        <div className="mx-5 mb-5">
          <AlertBanner tone="error" title="Invitation Declined">
            You declined this team invitation.
          </AlertBanner>
        </div>
      )}
    </Card>
  );
};
