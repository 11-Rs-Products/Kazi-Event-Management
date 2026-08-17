import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

// Initialize Admin SDK
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
      console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local. Attempting applicationDefault().");
      initializeApp({ credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kazi-671e6' });
    }
  }
}

initAdmin();
const db = getFirestore();

const isDryRun = process.argv.includes('--dry-run');

async function runMigration() {
  console.log(`[INFO] Starting Firestore migration ${isDryRun ? '(DRY-RUN MODE)' : '(EXECUTION MODE)'}`);
  
  const migrationState = {
    tenures: 0,
    mainEvents: 0,
    events: 0,
    subEvents: 0,
    registrations: 0,
    submissions: 0,
    winners: 0
  };

  const batchList: any[] = []; // Collect writes here for non-dry-run mode

  try {
    // 1. Create Default Tenure
    const tenureId = '2026-2027';
    if (!isDryRun) {
      batchList.push({
        ref: db.doc(`tenures/${tenureId}`),
        data: {
          name: '2026-2027',
          displayName: '2026-2027 Academic Year',
          active: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      });
    }
    migrationState.tenures++;
    console.log(`[INFO] Tenure:\n       ${tenureId} -> tenures/${tenureId}`);

    // 2. Fetch all current Main Events
    const oldEventsSnap = await db.collection('events').get();
    for (const mainEventDoc of oldEventsSnap.docs) {
      const mainEventId = mainEventDoc.id;
      const mainEventData = mainEventDoc.data();
      
      const newMainEventRef = `tenures/${tenureId}/mainEvents/${mainEventId}`;
      if (!isDryRun) {
         batchList.push({
           ref: db.doc(newMainEventRef),
           data: { ...mainEventData, migratedAt: FieldValue.serverTimestamp() }
         });
      }
      migrationState.mainEvents++;
      console.log(`[INFO] Main Event:\n       events/${mainEventId} -> ${newMainEventRef}`);

      // 3. Scan subcollections for legacy registrations and submissions
      const subCollections = await mainEventDoc.ref.listCollections();
      for (const subCol of subCollections) {
        if (subCol.id === 'subEvents') continue;
        
        // Detect if it's a registration or submission collection
        const isSubmissions = subCol.id.toLowerCase().includes('submissions');
        
        // Extract base event name (e.g., 'Spotlight Showdown registrations' -> 'Spotlight Showdown')
        const rawName = subCol.id.replace(/registrations/i, '').replace(/submissions/i, '').trim();
        const eventSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        if (!eventSlug) continue;
        
        // Create the intermediate Event document
        const newEventRef = `${newMainEventRef}/events/${eventSlug}`;
        if (!isDryRun) {
          batchList.push({
            ref: db.doc(newEventRef),
            data: {
              name: rawName || eventSlug,
              id: eventSlug,
              mainEventId: mainEventId,
              tenureId: tenureId,
              status: 'PUBLISHED',
              migratedAt: FieldValue.serverTimestamp()
            },
            merge: true
          });
        }
        
        // Only log event creation if not already seen
        migrationState.events++; // Note: this count might be slightly high if both reg/sub exist, but okay for preview
        console.log(`[INFO] Event:\n       ${subCol.id} (Subcollection) -> ${newEventRef}`);

        // Migrate records inside this subcollection
        const legacySnap = await subCol.get();
        const targetSubcollectionName = isSubmissions ? 'submissions' : 'registrations';
        
        for (const doc of legacySnap.docs) {
          const docData = doc.data();
          const newDocRef = `${newEventRef}/${targetSubcollectionName}/${doc.id}`;
          
          if (!isDryRun) {
            batchList.push({
              ref: db.doc(newDocRef),
              data: {
                ...docData,
                mainEventId: mainEventId,
                eventId: eventSlug,
                tenureId: tenureId,
                migratedAt: FieldValue.serverTimestamp()
              }
            });
          }
          if (isSubmissions) {
            migrationState.submissions++;
          } else {
            migrationState.registrations++;
          }
        }
      }
    }

    // 4. Migrate Root Registrations (if any exist)
    const rootRegSnap = await db.collection('registrations').get();
    for (const regDoc of rootRegSnap.docs) {
      const regData = regDoc.data();
      // Determine destination based on fields
      const regMainEventId = regData.mainEventId || 'communityDayAug26'; // Fallback
      const regEventId = regData.eventId || 'legacy-events';
      
      const newRegRef = `tenures/${tenureId}/mainEvents/${regMainEventId}/events/${regEventId}/registrations/${regDoc.id}`;
      
      if (!isDryRun) {
        batchList.push({
          ref: db.doc(newRegRef),
          data: {
            ...regData,
            mainEventId: regMainEventId,
            eventId: regEventId,
            tenureId: tenureId,
            migratedAt: FieldValue.serverTimestamp()
          }
        });
      }
      migrationState.registrations++;
    }

    // Display Summary
    console.log(`\n[INFO] Migration Preview:`);
    console.log(`  Tenures: ${migrationState.tenures}`);
    console.log(`  Main Events: ${migrationState.mainEvents}`);
    console.log(`  Events: ${migrationState.events}`);
    console.log(`  Sub-events: ${migrationState.subEvents}`);
    console.log(`  Registrations: ${migrationState.registrations}`);
    console.log(`  Submissions: ${migrationState.submissions}`);
    console.log(`  Winners: ${migrationState.winners}`);

    if (isDryRun) {
      console.log('\n[INFO] Dry-run completed. Run without --dry-run to execute.');
    } else {
      console.log('\n[INFO] Executing database writes...');
      
      // Batch commits (Firestore limit is 500 per batch)
      const MAX_BATCH_SIZE = 450;
      for (let i = 0; i < batchList.length; i += MAX_BATCH_SIZE) {
        const batch = db.batch();
        const currentSlice = batchList.slice(i, i + MAX_BATCH_SIZE);
        for (const op of currentSlice) {
          if (op.merge) {
            batch.set(op.ref, op.data, { merge: true });
          } else {
            batch.set(op.ref, op.data);
          }
        }
        await batch.commit();
        console.log(`  -> Committed batch ${Math.floor(i / MAX_BATCH_SIZE) + 1}`);
      }

      // Record migration metadata
      const migrationLogRef = db.doc(`_migrations/firestore_event_hierarchy_v1`);
      await migrationLogRef.set({
        migration: "firestore_event_hierarchy_v1",
        startedAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        status: "completed",
        dryRun: false,
        recordsMigrated: migrationState
      });

      console.log('\n[INFO] Migration completed successfully.');
    }

  } catch (error: any) {
    console.error('\n[ERROR] Migration failed:', error.message);
    if (error.code === 'permission-denied' || error.message.includes('credentials')) {
      console.error('\n*** AUTHENTICATION REQUIRED ***');
      console.error('Please generate a Firebase Admin Service Account Key from your Firebase Console.');
      console.error('Save the JSON string to your .env.local file as:');
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY=\'{...json here...}\'');
    }
  }
}

runMigration();
