'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-event-portal';
  
  if (process.env.FIREBASE_ADMIN_KEY) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
      projectId,
    });
  } else {
    // Fallback for dev/emulator
    initializeApp({ projectId });
  }
}

const adminDb = getFirestore();

export async function POST(req: NextRequest) {
  try {
    // Verify auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const initiatorUid = decodedToken.uid;
    const initiatorEmail = decodedToken.email;

    if (!initiatorEmail) {
      return NextResponse.json({ error: 'Could not determine your email address.' }, { status: 400 });
    }

    const body = await req.json();
    const {
      teammateEmails,
      eventId,
      mainEventId,
      tenureId,
      eventName,
      teamRegistrationId,
      inviterName,
    } = body;

    if (!teammateEmails || !Array.isArray(teammateEmails) || teammateEmails.length === 0) {
      return NextResponse.json({ error: 'No teammate emails provided.' }, { status: 400 });
    }

    if (!eventId || !teamRegistrationId) {
      return NextResponse.json({ error: 'Missing required fields (eventId, teamRegistrationId).' }, { status: 400 });
    }

    const errors: string[] = [];
    const created: string[] = [];

    for (const email of teammateEmails) {
      const cleanEmail = email.trim().toLowerCase();

      // Validation: Cannot invite self
      if (cleanEmail === initiatorEmail.toLowerCase()) {
        errors.push(`${cleanEmail}: You cannot invite yourself.`);
        continue;
      }

      // (Removed allowedUsers check to allow testing with arbitrary emails)

      // Validation: Check for duplicate invitation
      const existingInvitesSnap = await adminDb.collection('teamInvitations')
        .where('eventId', '==', eventId)
        .where('inviteeEmail', '==', cleanEmail)
        .where('teamRegistrationId', '==', teamRegistrationId)
        .where('status', 'in', ['PENDING', 'ACCEPTED'])
        .get();

      if (!existingInvitesSnap.empty) {
        errors.push(`${cleanEmail}: Already invited to this team.`);
        continue;
      }

      // Validation: Check if already registered for this event (individual or another team)
      // Use collectionGroup query for registrations
      const existingRegsSnap = await adminDb.collectionGroup('registrations')
        .where('eventId', '==', eventId)
        .where('emailSnapshot', '==', cleanEmail)
        .where('status', '==', 'CONFIRMED')
        .get();

      if (!existingRegsSnap.empty) {
        errors.push(`${cleanEmail}: Already registered for this event.`);
        continue;
      }

      // Look up invitee userId (might not exist if they haven't signed in yet)
      let inviteeUserId: string | undefined;
      const usersSnap = await adminDb.collection('users')
        .where('email', '==', cleanEmail)
        .limit(1)
        .get();
      if (!usersSnap.empty) {
        inviteeUserId = usersSnap.docs[0].id;
      }

      // Create the team invitation
      const invitationRef = adminDb.collection('teamInvitations').doc();
      const invitation = {
        id: invitationRef.id,
        teamRegistrationId,
        eventId,
        mainEventId: mainEventId || 'communityDayAug26',
        tenureId: tenureId || '2026-2027',
        inviterUserId: initiatorUid,
        inviterName: inviterName || 'Team Initiator',
        inviterEmail: initiatorEmail,
        inviteeEmail: cleanEmail,
        ...(inviteeUserId && { inviteeUserId }),
        status: 'PENDING',
        eventName: eventName || 'Event',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await invitationRef.set(invitation);

      // Create notification for the invitee
      const notifRef = adminDb.collection('notifications').doc();
      await notifRef.set({
        id: notifRef.id,
        userId: inviteeUserId || cleanEmail,
        title: `Team Invitation: ${eventName || 'Event'}`,
        message: `${inviterName || initiatorEmail} has invited you to join their team for "${eventName || 'an event'}". Open to accept or decline.`,
        type: 'TEAM_INVITE',
        linkUrl: `/team-invitation/${invitationRef.id}`,
        read: false,
        createdAt: new Date().toISOString(),
        teamInvitationId: invitationRef.id,
      });

      created.push(cleanEmail);
    }

    return NextResponse.json({
      success: true,
      created,
      errors,
      message: created.length > 0
        ? `Invitations sent to ${created.length} teammate(s).${errors.length > 0 ? ` ${errors.length} failed.` : ''}`
        : 'No invitations were sent.',
    });
  } catch (err: any) {
    console.error('[API /team/invite] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
