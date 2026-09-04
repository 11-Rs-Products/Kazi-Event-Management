'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TeamInvitation, EventItem } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDoc, getDocs, query, where } from 'firebase/firestore';
import { getTeamInvitationRef, getAllEventsGroupRef } from '@/lib/firebase/paths';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { MailQuestion, LogIn } from 'lucide-react';
import { TeamInvitationCard } from '@/components/events/TeamInvitationCard';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function TeamInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchInvitation = async () => {
      setLoading(true);
      try {
        if (isMockMode) {
          const inv = mockStore.getTeamInvitationById(invitationId);
          if (!inv) {
            setError('Invitation not found.');
            setLoading(false);
            return;
          }
          setInvitation(inv);
          
          const events = mockStore.getEvents();
          const evt = events.find(e => e.id === inv.eventId);
          setEvent(evt || null);
        } else {
          const invSnap = await getDoc(getTeamInvitationRef(invitationId));
          if (!invSnap.exists()) {
            setError('Invitation not found.');
            setLoading(false);
            return;
          }
          const inv = { id: invSnap.id, ...invSnap.data() } as TeamInvitation;
          setInvitation(inv);

          // Fetch the event
          const eventsSnap = await getDocs(getAllEventsGroupRef());
          eventsSnap.forEach(d => {
            if (d.id === inv.eventId) {
              setEvent({ id: d.id, ...d.data() } as EventItem);
            }
          });
        }
      } catch (err: any) {
        console.error('Error fetching invitation:', err);
        setError(err.message || 'Failed to load invitation.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [invitationId, user, authLoading]);

  const handleAccept = (inv: TeamInvitation) => {
    // Navigate to the event page with team join params
    const mainEventId = inv.mainEventId || 'communityDayAug26';
    const eventSlug = event?.slug || inv.eventId;
    router.push(`/events/${mainEventId}/subevents/${eventSlug}?teamId=${inv.teamRegistrationId}&invitationId=${inv.id}`);
  };

  const handleReject = () => {
    // Refresh to show updated status
    router.refresh();
  };

  const backLink = (
    <button
      onClick={() => router.push('/notifications')}
      className="inline-flex items-center gap-1.5 text-caption font-display font-semibold text-ink-muted hover:text-ink transition-colors"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden />
      Back to notifications
    </button>
  );

  if (authLoading || loading) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto">
        <EmptyState
          icon={<LogIn />}
          title="Sign in required"
          description="Sign in with your Kaziranga House account to view this team invitation."
        />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        {backLink}
        <EmptyState
          icon={<MailQuestion />}
          title="Invitation not found"
          description={error || 'This invitation may have been withdrawn or already actioned.'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {backLink}

      <TeamInvitationCard
        invitation={invitation}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
}
