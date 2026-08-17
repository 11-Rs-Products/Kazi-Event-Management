import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';

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
  const report = {};
  try {
    // We can't easily list collections without admin SDK, but we know the main ones
    const rootCollections = ['events', 'registrations', 'submissions', 'winners', 'users'];
    
    for (const colName of rootCollections) {
      report[colName] = { count: 0, sample: null };
      try {
        const snap = await getDocs(collection(db, colName));
        report[colName].count = snap.size;
        if (!snap.empty) {
          report[colName].sample = { id: snap.docs[0].id, data: snap.docs[0].data() };
        }
      } catch (e) {
         report[colName].error = e.message;
      }
    }

    fs.writeFileSync('db_inspection.json', JSON.stringify(report, null, 2));
    console.log("Inspection complete. See db_inspection.json");
  } catch (err) {
    console.error("Global error:", err);
  }
}

inspect();
