import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
  const report: any = {};
  try {
    const rootCollections = ['events', 'registrations', 'submissions', 'winners', 'users'];
    
    for (const colName of rootCollections) {
      report[colName] = { count: 0, sample: null, error: null };
      try {
        const snap = await getDocs(collection(db, colName));
        report[colName].count = snap.size;
        if (!snap.empty) {
          report[colName].sample = { id: snap.docs[0].id, data: snap.docs[0].data() };
        }
      } catch (e: any) {
         report[colName].error = e.message;
      }
    }
    
    // Check specific subcollections based on user's screenshot
    try {
      const snap = await getDocs(collection(db, 'events', 'communityDayAug26', 'Spotlight Showdown registrations'));
      report['Spotlight Showdown registrations'] = { count: snap.size, sample: snap.empty ? null : snap.docs[0].data() };
    } catch (e: any) {
      report['Spotlight Showdown registrations error'] = e.message;
    }

    fs.writeFileSync('db_inspection.json', JSON.stringify(report, null, 2));
    console.log("Inspection complete. See db_inspection.json");
  } catch (err) {
    console.error("Global error:", err);
  }
}

inspect();
