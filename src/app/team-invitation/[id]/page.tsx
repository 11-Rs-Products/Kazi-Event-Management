'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TeamInvitation, EventItem } from '@/types';
import { isMockMode, db } from '@/lib/firebase/config';
import { mockStore } from '@/lib/firebase/mockStore';
import { getDoc, getDocs, query, where } from 'firebase/firestore';
import { getTeamInvitationRef, getAllEventsGroupRef } from '@/lib/firebase/paths';
import { TeamInvitationCard } from '@/components/events/TeamInvitationCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RhinoMascot } from '@/components/branding/RhinoMascot';
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

  if (authLoading || loading) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <RhinoMascot pose="thinking" size="sm" />
        <p className="text-xs text-kaziranga-500 dark:text-cream-400/50 mt-2">Loading invitation...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <RhinoMascot pose="thinking" size="md" />
        <h2 className="text-xl font-display font-bold text-kaziranga-800 dark:text-cream-100">Sign In Required</h2>
        <p className="text-xs text-kaziranga-600 dark:text-cream-400/60">Please sign in to view this team invitation.</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <button onClick={() => router.push('/notifications')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-700 dark:text-cream-300 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notifications</span>
        </button>
        <Card className="p-12 text-center space-y-4">
          <RhinoMascot pose="thinking" size="md" />
          <h2 className="text-xl font-display font-bold text-kaziranga-800 dark:text-cream-100">Invitation Not Found</h2>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60">{error || 'This invitation may have been removed or is invalid.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <button onClick={() => router.push('/notifications')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-kaziranga-700 dark:text-cream-300 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Notifications</span>
      </button>

      <TeamInvitationCard
        invitation={invitation}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
}
