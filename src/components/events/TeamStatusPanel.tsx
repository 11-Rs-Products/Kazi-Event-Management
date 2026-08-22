'use client';

import React, { useState, useEffect } from 'react';
import { Registration, EventItem, TeamInvitation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getTeamInvitationsCollectionRef, getAllRegistrationsGroupRef, DEFAULT_MAIN_EVENT_ID, DEFAULT_TENURE_ID } from '@/lib/firebase/paths';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Users, Mail, Plus, AlertCircle, CheckCircle2, User, XCircle, Loader2 } from 'lucide-react';

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

  const handleInvite = async (e: React.FormEvent) => {
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
      <div className="p-4 rounded-xl border border-cream-400/20 dark:border-kaziranga-800 flex items-center justify-center text-xs text-kaziranga-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading team status...
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

  return (
    <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-900/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold font-display text-kaziranga-900 dark:text-cream-100 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-sky-500" />
          Team Status {isInitiator ? '(Leader)' : '(Member)'}
        </h4>
        <Badge variant="blue" size="sm">
          {activeMembers} / {maxTeamSize} Registered
        </Badge>
      </div>

      <div className="space-y-2">
        {/* Initiator (Self or the one who invited) */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-kaziranga-950/40 border border-cream-400/20 dark:border-kaziranga-800">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-kaziranga-500" />
            <span className="font-semibold text-kaziranga-800 dark:text-cream-200">
              {isInitiator ? `${user?.name || 'User'} (You)` : 'Team Leader'}
            </span>
            <span className="text-kaziranga-500 font-mono hidden sm:inline">
              {isInitiator ? (user?.email || '') : ''}
            </span>
          </div>
          <Badge variant="emerald" size="sm">REGISTERED</Badge>
        </div>

        {/* Teammates */}
        {teammateList.map((tm, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-kaziranga-950/40 border border-cream-400/20 dark:border-kaziranga-800">
            <div className="flex items-center gap-2 text-xs min-w-0">
              <Mail className="w-3.5 h-3.5 text-kaziranga-500 shrink-0" />
              <div className="truncate">
                {tm.name && <span className="font-semibold text-kaziranga-800 dark:text-cream-200 mr-1.5">{tm.name}</span>}
                <span className="text-kaziranga-600 dark:text-cream-400/80 font-mono">{tm.email}</span>
              </div>
            </div>
            <div className="shrink-0 ml-2">
              {tm.status === 'REGISTERED' && <Badge variant="emerald" size="sm">REGISTERED</Badge>}
              {tm.status === 'ACCEPTED' && <Badge variant="emerald" size="sm">JOINING...</Badge>}
              {tm.status === 'PENDING' && <Badge variant="gold" size="sm">INVITED</Badge>}
              {tm.status === 'REJECTED' && <Badge variant="rose" size="sm">DECLINED</Badge>}
            </div>
          </div>
        ))}
      </div>

      {isInitiator && (
        <div className="pt-2 border-t border-sky-200/50 dark:border-sky-900/50 space-y-2">
          {availableSlots > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] text-kaziranga-600 dark:text-cream-400/70">
                You have {availableSlots} slot(s) available. Invite replacements or additional members.
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); setInviteSuccess(null); }}
                  placeholder="teammate@ds.study.iitm.ac.in"
                  className="arena-input text-xs flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleInvite} 
                  disabled={!inviteEmail.trim() || inviting}
                  isLoading={inviting}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Invite
                </Button>
              </div>
              {inviteError && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> {inviteSuccess}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50 flex items-center gap-1.5 bg-white/40 dark:bg-kaziranga-950/20 p-2 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Team is full or all invitations are pending. If an invite is declined, a slot will open up.
            </div>
          )}
        </div>
      )}

      {!isInitiator && (
        <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/60 pt-1">
          You joined this team via an invitation. Only the team leader can invite new members.
        </div>
      )}
    </div>
  );
};
