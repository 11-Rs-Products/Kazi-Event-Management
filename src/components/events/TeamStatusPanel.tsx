'use client';

import React, { useState, useEffect } from 'react';
import { Registration, EventItem, TeamInvitation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getTeamInvitationsCollectionRef, getAllRegistrationsGroupRef, DEFAULT_MAIN_EVENT_ID, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Users, Mail, Plus, AlertCircle, CheckCircle2, User, Loader2 } from 'lucide-react';

interface TeamStatusPanelProps {
  registration: Registration;
  event: EventItem;
}

export const TeamStatusPanel: React.FC<TeamStatusPanelProps> = ({ registration, event }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [members, setMembers] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const teamId = registration.teamId || registration.id;
  const isInitiator = registration.teamRole === 'INITIATOR';
  const maxTeamSize = event.maximumTeamSize || 4;

  const fetchTeamData = async () => {
    if (!user) return;
    setLoading(true);

    if (isMockMode) {
      setInvitations(mockStore.getTeamInvitationsForTeam(teamId));
      setMembers(mockStore.getTeamMembers(teamId));
      setLoading(false);
    } else {
      try {
        const invQ = query(getTeamInvitationsCollectionRef(), where('teamRegistrationId', '==', teamId));
        const invSnap = await getDocs(invQ);
        const invs: TeamInvitation[] = [];
        invSnap.forEach(d => invs.push({ id: d.id, ...d.data() } as TeamInvitation));
        setInvitations(invs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        const memQ = query(getAllRegistrationsGroupRef(), where('teamId', '==', teamId), where('status', '==', 'CONFIRMED'));
        const memSnap = await getDocs(memQ);
        const mems: Registration[] = [];
        memSnap.forEach(d => mems.push({ id: d.id, ...d.data() } as Registration));
        setMembers(mems);
      } catch (err) {
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId, user]);

  const handleInvite = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !user?.email) return;

    if (email === user.email.toLowerCase()) {
      setInviteError('You cannot invite yourself.');
      return;
    }

    setInviting(true);

    try {
      // Instant verification against allowed users
      const checkRes = await fetch('/api/auth/allowed-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const checkData = await checkRes.json();
      
      if (!checkRes.ok || !checkData.isAllowed) {
        setInviteError('Either it is an invalid email or it is not an email associated with Kaziranga.');
        setInviting(false);
        return;
      }
    } catch (err) {
      setInviteError('Error verifying email. Please try again.');
      setInviting(false);
      return;
    }
    
    if (isMockMode) {
      const result = mockStore.createTeamInvitation(user, event, teamId, email);
      if (result.error) {
        setInviteError(result.error);
      } else {
        setInviteSuccess(`Invitation sent to ${email}`);
        setInviteEmail('');
        fetchTeamData();
      }
      setInviting(false);
    } else {
      try {
        const { getAuth } = await import('firebase/auth');
        const authInstance = getAuth();
        const idToken = await authInstance.currentUser?.getIdToken();
        
        const res = await fetch('/api/team/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            teammateEmails: [email],
            eventId: event.id,
            mainEventId: event.mainEventId || DEFAULT_MAIN_EVENT_ID,
            tenureId: event.tenureId || DEFAULT_TENURE_ID,
            eventName: event.name,
            teamRegistrationId: teamId,
            inviterName: user.name,
          }),
        });
        
        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
          setInviteError(data.errors[0]);
        } else if (data.created && data.created.length > 0) {
          setInviteSuccess(`Invitation sent to ${email}`);
          setInviteEmail('');
          fetchTeamData();
        } else {
          setInviteError('Failed to send invitation.');
        }
      } catch (err: any) {
        setInviteError('Network error while sending invitation.');
      } finally {
        setInviting(false);
      }
    }
  };

  if (!registration.teamRole) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-hairline bg-surface-sunken text-caption text-ink-faint">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Loading team status…
      </div>
    );
  }

  // Active slots count
  const activeMembers = members.length; // Includes initiator since they are CONFIRMED and have teamId
  const pendingInvites = invitations.filter(i => i.status === 'PENDING').length;
  const takenSlots = activeMembers + pendingInvites;
  const availableSlots = Math.max(0, maxTeamSize - takenSlots);

  // Group by email to show the latest status per email
  const displayEmails = new Set<string>();
  members.forEach(m => displayEmails.add(m.emailSnapshot.toLowerCase()));
  invitations.forEach(i => displayEmails.add(i.inviteeEmail.toLowerCase()));
  if (user?.email) {
    displayEmails.delete(user.email.toLowerCase()); // Don't show initiator in the invite list usually, or just show them as Leader
  }
  
  const teammateList = Array.from(displayEmails).map(email => {
    // Check if they are a registered member
    const member = members.find(m => m.emailSnapshot.toLowerCase() === email);
    if (member) return { email, status: 'REGISTERED', name: member.nameSnapshot };
    
    // Check latest invitation
    const inv = invitations.filter(i => i.inviteeEmail.toLowerCase() === email)
                           .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (inv) return { email, status: inv.status, name: null };
    return { email, status: 'UNKNOWN', name: null };
  });

  /** One row in the roster: a member, or an invite in some state. */
  const statusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return <Badge tone="live" size="sm">Registered</Badge>;
      case 'ACCEPTED':
        return <Badge tone="live" size="sm">Joining</Badge>;
      case 'PENDING':
        return <Badge tone="warn" size="sm">Invited</Badge>;
      case 'REJECTED':
        return <Badge tone="danger" size="sm">Declined</Badge>;
      default:
        return <Badge tone="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-hairline bg-surface-sunken overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-hairline">
        <h4 className="inline-flex items-center gap-2 text-caption font-display font-bold text-ink">
          <Users className="w-4 h-4 text-ink-faint" aria-hidden />
          Team
          <span className="font-normal text-ink-faint">
            {isInitiator ? 'Leader' : 'Member'}
          </span>
        </h4>
        <Badge tone="brand" size="sm">
          {activeMembers}/{maxTeamSize}
        </Badge>
      </div>

      <ul className="divide-y divide-hairline">
        <li className="px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0 text-caption">
            <User className="w-3.5 h-3.5 text-ink-faint shrink-0" aria-hidden />
            <span className="font-semibold text-ink truncate">
              {isInitiator ? `${user?.name || 'You'} (you)` : 'Team leader'}
            </span>
          </span>
          {statusBadge('REGISTERED')}
        </li>

        {teammateList.map((tm, idx) => (
          <li key={idx} className="px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0 text-caption">
              <Mail className="w-3.5 h-3.5 text-ink-faint shrink-0" aria-hidden />
              <span className="min-w-0 truncate">
                {tm.name && <span className="font-semibold text-ink mr-1.5">{tm.name}</span>}
                <span className="font-mono text-micro text-ink-muted">{tm.email}</span>
              </span>
            </span>
            <span className="shrink-0">{statusBadge(tm.status)}</span>
          </li>
        ))}
      </ul>

      {isInitiator && (
        <div className="px-4 py-3.5 border-t border-hairline space-y-2.5">
          {availableSlots > 0 ? (
            <>
              <p className="text-micro text-ink-muted">
                {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'} left. Invite a
                teammate by their Kaziranga email.
              </p>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                    setInviteSuccess(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inviteEmail.trim() && !inviting) {
                      handleInvite(e);
                    }
                  }}
                  placeholder="teammate@ds.study.iitm.ac.in"
                  aria-label="Teammate email address"
                  className="ed-field ed-field-sm flex-1 min-w-0"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  isLoading={inviting}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Invite
                </Button>
              </div>

              {inviteError && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 text-micro text-signal-danger"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
                  {inviteError}
                </p>
              )}
              {inviteSuccess && (
                <p
                  role="status"
                  className="flex items-start gap-1.5 text-micro text-signal-live"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
                  {inviteSuccess}
                </p>
              )}
            </>
          ) : (
            <p className="flex items-start gap-1.5 text-micro text-ink-muted">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px text-signal-live" aria-hidden />
              Team is full or every slot is pending. A declined invite frees one up.
            </p>
          )}
        </div>
      )}

      {!isInitiator && (
        <p className="px-4 py-3 border-t border-hairline text-micro text-ink-faint">
          You joined via invitation. Only the team leader can invite new members.
        </p>
      )}
    </div>
  );
};
