import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
initializeApp({ credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-671e6' });
const db = getFirestore();

async function fix() {
  await db.doc('_migrations/firestore_event_hierarchy_v1').update({
    'recordsMigrated.events': 10
  });
  console.log("Fixed migration log to 10 events.");
}
fix();
