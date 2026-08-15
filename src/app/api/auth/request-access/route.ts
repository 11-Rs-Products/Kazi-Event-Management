import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const getProjectId = () => process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-event-portal';

const getFirestoreRestUrl = () => {
  const projectId = getProjectId();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/accessRequests`;
  return apiKey ? `${baseUrl}?key=${apiKey}` : baseUrl;
};

const stringValue = (value: unknown) => ({ stringValue: String(value || '') });

const booleanValue = (value: boolean) => ({ booleanValue: value });

const isCredentialError = (err: any) => {
  const message = String(err?.message || err || '');
  return message.includes('Could not load the default credentials') || message.includes('default credentials');
};

const createAccessRequestWithFirestoreRest = async (email: string, note: string) => {
  const response = await fetch(getFirestoreRestUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        email: stringValue(email),
        note: stringValue(note),
        status: stringValue('PENDING'),
        read: booleanValue(false),
        createdAt: stringValue(new Date().toISOString()),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error?.message || 'Access request could not be saved');
  }
};

export async function POST(req: NextRequest) {
  try {
    const { email, note } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = typeof note === 'string' ? note.trim() : '';

    try {
      if (!adminDb) {
        await createAccessRequestWithFirestoreRest(cleanEmail, cleanNote);
      } else {
        // 1. Create Super Admin Notification document
        const notifRef = adminDb.collection('notifications').doc();
        await notifRef.set({
          userId: 'SUPER_ADMIN',
          title: `Access Request: ${cleanEmail}`,
          message: `Student ${cleanEmail} has requested access to the Kaziranga House Portal.${cleanNote ? ` Note: "${cleanNote}"` : ''}`,
          type: 'WARNING',
          linkUrl: `/super-admin/allowed-users?email=${encodeURIComponent(cleanEmail)}`,
          read: false,
          createdAt: new Date().toISOString(),
        });

        // 2. Add Audit Log
        const auditRef = adminDb.collection('auditLogs').doc();
        await auditRef.set({
          actorUserId: 'UNAUTHORIZED_USER',
          actorEmail: cleanEmail,
          action: 'ACCESS_REQUESTED',
          target: `Kaziranga Allowed-Users Registry (${cleanEmail})`,
          timestamp: new Date().toISOString(),
          metadata: { note: cleanNote },
        });
      }
    } catch (err) {
      if (!isCredentialError(err)) {
        throw err;
      }

      await createAccessRequestWithFirestoreRest(cleanEmail, cleanNote);
    }

    return NextResponse.json({
      success: true,
      message: 'Access request successfully sent to Super Admin notifications.',
      email: cleanEmail,
    });
  } catch (err: any) {
    console.error('Error submitting access request:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
