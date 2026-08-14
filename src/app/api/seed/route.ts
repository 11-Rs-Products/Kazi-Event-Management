import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { INITIAL_ALLOWED_USERS, INITIAL_SUPER_ADMIN_EMAILS } from '@/lib/firebase/mockData';

export async function POST() {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { message: 'Firebase Admin SDK not configured on server side. Operating in client/mock mode.' },
        { status: 200 }
      );
    }

    const db = adminDb;
    const batch = db.batch();

    // Seed Initial Allowed Users
    INITIAL_ALLOWED_USERS.forEach((u) => {
      const docRef = db.collection('allowedUsers').doc(u.email.toLowerCase());
      batch.set(docRef, {
        email: u.email.toLowerCase(),
        importBatchId: 'initial_seed',
        importedAt: new Date().toISOString(),
      });
    });

    // Record initial bootstrap log
    const auditRef = db.collection('auditLogs').doc('log_bootstrap_' + Date.now());
    batch.set(auditRef, {
      id: auditRef.id,
      actorUserId: 'SYSTEM_BOOTSTRAP',
      actorEmail: 'system@kaziranga.portal',
      action: 'SYSTEM_BOOTSTRAP',
      target: 'SUPER_ADMIN_INITIALIZATION',
      timestamp: new Date().toISOString(),
      metadata: { initialSuperAdmins: INITIAL_SUPER_ADMIN_EMAILS },
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded initial allowed users and super admins into Cloud Firestore.',
      initialSuperAdmins: INITIAL_SUPER_ADMIN_EMAILS,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
