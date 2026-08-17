import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function initAdmin() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const json = serviceAccountKey.trim().startsWith('{')
        ? serviceAccountKey
        : Buffer.from(serviceAccountKey, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(json);
      initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      initializeApp({ credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-671e6' });
    }
  }
}

initAdmin();
const db = getFirestore();

async function verifyMigration() {
  console.log(`[INFO] Starting Firestore Migration Verification`);
  
  let passed = true;

  try {
    const migrationLog = await db.doc('_migrations/firestore_event_hierarchy_v1').get();
    if (!migrationLog.exists) {
      console.error("[ERROR] Migration log not found. Did you run the migration?");
      return;
    }

    const { recordsMigrated } = migrationLog.data() as any;
    
    // Verify Tenures
    const tenuresSnap = await db.collection('tenures').get();
    if (tenuresSnap.size < recordsMigrated.tenures) {
       console.error(`[FAIL] Expected at least ${recordsMigrated.tenures} tenures, found ${tenuresSnap.size}`);
       passed = false;
    } else {
       console.log(`[PASS] Tenures verified: ${tenuresSnap.size}`);
    }

    // Verify Main Events (collection group query)
    const mainEventsSnap = await db.collectionGroup('mainEvents').get();
    if (mainEventsSnap.size < recordsMigrated.mainEvents) {
       console.error(`[FAIL] Expected at least ${recordsMigrated.mainEvents} mainEvents, found ${mainEventsSnap.size}`);
       passed = false;
    } else {
       console.log(`[PASS] Main Events verified: ${mainEventsSnap.size}`);
    }

    // Verify Events (collection group query)
    const eventsSnap = await db.collectionGroup('events').get();
    // Exclude the root 'events' collection from our count because collectionGroup matches root too
    const newEventsCount = eventsSnap.docs.filter(d => d.ref.path.includes('tenures/')).length;
    
    if (newEventsCount < recordsMigrated.events) {
       console.error(`[FAIL] Expected at least ${recordsMigrated.events} events in new hierarchy, found ${newEventsCount}`);
       passed = false;
    } else {
       console.log(`[PASS] Events verified: ${newEventsCount}`);
    }

    // Verify Registrations (collection group query)
    const regSnap = await db.collectionGroup('registrations').get();
    const newRegCount = regSnap.docs.filter(d => d.ref.path.includes('tenures/')).length;
    
    if (newRegCount < recordsMigrated.registrations) {
       console.error(`[FAIL] Expected at least ${recordsMigrated.registrations} registrations in new hierarchy, found ${newRegCount}`);
       passed = false;
    } else {
       console.log(`[PASS] Registrations verified: ${newRegCount}`);
    }
    
    if (passed) {
       console.log(`\n[SUCCESS] Migration verification passed!`);
    } else {
       console.log(`\n[FAILURE] Verification failed due to count mismatches.`);
    }

  } catch (error: any) {
    console.error('\n[ERROR] Verification failed:', error.message);
  }
}

verifyMigration();
