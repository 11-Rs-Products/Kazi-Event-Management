import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    admin.initializeApp({
      projectId: projectId || 'kazi-event-portal',
    });
  } catch (error) {
    console.warn('Firebase Admin SDK initialization note:', error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
