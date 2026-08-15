import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, note } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = typeof note === 'string' ? note.trim() : '';

    if (adminDb) {
      // 1. Create Super Admin Notification document
      const notifRef = adminDb.collection('notifications').doc();
      await notifRef.set({
        userId: 'SUPER_ADMIN',
        title: `🔑 Access Request: ${cleanEmail}`,
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
