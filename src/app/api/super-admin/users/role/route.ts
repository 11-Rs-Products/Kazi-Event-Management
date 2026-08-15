import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const VALID_ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export async function POST(req: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ success: false, error: 'Firebase Admin SDK is not configured' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication token is required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const { targetUserId, newRole } = await req.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ success: false, error: 'Target user id is required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ success: false, error: 'Invalid role selected' }, { status: 400 });
    }

    const actorRef = adminDb.collection('users').doc(decodedToken.uid);
    const targetRef = adminDb.collection('users').doc(targetUserId);
    const auditRef = adminDb.collection('auditLogs').doc();
    const notificationRef = adminDb.collection('notifications').doc();

    const result = await adminDb.runTransaction(async (transaction) => {
      const [actorSnap, targetSnap] = await Promise.all([transaction.get(actorRef), transaction.get(targetRef)]);

      if (!actorSnap.exists) {
        throw new Error('Signed-in user profile was not found');
      }

      const actor = actorSnap.data();
      if (actor?.role !== 'SUPER_ADMIN') {
        const error = new Error('Only Super Admins can change user roles');
        error.name = 'Forbidden';
        throw error;
      }

      if (!targetSnap.exists) {
        const error = new Error('Target user was not found');
        error.name = 'NotFound';
        throw error;
      }

      const target = targetSnap.data();
      const oldRole = target?.role as UserRole | undefined;

      if (oldRole === newRole) {
        return {
          oldRole,
          newRole,
          changed: false,
          targetName: target?.name || 'Unknown user',
          targetEmail: target?.email || targetUserId,
        };
      }

      const timestamp = new Date().toISOString();
      const targetName = target?.name || 'Unknown user';
      const targetEmail = target?.email || targetUserId;

      transaction.update(targetRef, {
        role: newRole,
        updatedAt: timestamp,
      });

      transaction.set(auditRef, {
        id: auditRef.id,
        actorUserId: decodedToken.uid,
        actorEmail: actor?.email || decodedToken.email || '',
        action: 'ROLE_CHANGED',
        target: `${targetName} (${targetEmail})`,
        timestamp,
        metadata: { oldRole, newRole },
      });

      transaction.set(notificationRef, {
        id: notificationRef.id,
        userId: targetUserId,
        title: 'Role Updated',
        message: `Your account access role has been updated from ${oldRole} to ${newRole}.`,
        type: 'ROLE_CHANGE',
        read: false,
        createdAt: timestamp,
      });

      return {
        oldRole,
        newRole,
        changed: true,
        targetName,
        targetEmail,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Role update error:', err);

    if (err?.name === 'Forbidden') {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }

    if (err?.name === 'NotFound') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
