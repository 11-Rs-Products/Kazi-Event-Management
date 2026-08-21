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

  const statusVariant = isPending ? 'gold' : isAccepted ? 'emerald' : 'rose';

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream-100/70 dark:bg-kaziranga-900/40 border border-cream-400/20 dark:border-kaziranga-800">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-kaziranga-800 dark:text-cream-100 truncate">
            {invitation.eventName}
          </div>
          <div className="text-[11px] text-kaziranga-600 dark:text-cream-400/60 flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 shrink-0" />
            <span>From: {invitation.inviterName}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {isPending ? (
            <>
              <Button size="sm" variant="primary" onClick={handleAccept} isLoading={loading} className="text-[10px] px-2.5 py-1">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} isLoading={loading} className="text-[10px] px-2.5 py-1">
                Decline
              </Button>
            </>
          ) : (
            <Badge variant={statusVariant} size="sm">{displayStatus}</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-kaziranga-600 dark:text-kaziranga-400" />
          <h3 className="text-base font-bold font-display text-kaziranga-900 dark:text-cream-100">
            Team Invitation
          </h3>
        </div>
        <Badge variant={statusVariant} size="md">{displayStatus}</Badge>
      </div>

      <div className="p-3 rounded-xl bg-cream-200/50 dark:bg-kaziranga-900/60 text-xs text-kaziranga-700 dark:text-cream-300 space-y-2 border border-cream-400/20 dark:border-kaziranga-800">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-kaziranga-600 dark:text-kaziranga-400 shrink-0" />
          <div>
            <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Event: </span>
            {invitation.eventName}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-kaziranga-600 dark:text-kaziranga-400 shrink-0" />
          <div>
            <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Invited by: </span>
            {invitation.inviterName}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-kaziranga-600 dark:text-kaziranga-400 shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Initiator Email: </span>
            <span className="font-mono">{invitation.inviterEmail}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-3 pt-2 border-t border-cream-400/20 dark:border-kaziranga-800">
          <Button
            variant="primary"
            onClick={handleAccept}
            isLoading={loading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="flex-1"
          >
            Accept & Register
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            isLoading={loading}
            leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      )}

      {isAccepted && !actionTaken && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
          You have accepted this invitation. Please complete your registration for this event.
        </div>
      )}

      {isRejected && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          You have declined this team invitation.
        </div>
      )}
    </Card>
  );
};
