import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDgtXJ0RP_tEnGyXK-5eiZIu7xHJCreyRQ',
  appId: '1:660548718445:web:f3b48a167e6f53f1b59464',
  authDomain: 'kazi-671e6.firebaseapp.com',
  projectId: 'kazi-671e6',
  storageBucket: 'kazi-671e6.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchEvents() {
  try {
    const eventsSnap = await getDocs(collection(db, 'events'));
    console.log(`Found ${eventsSnap.size} event groups in Firebase (kazi-671e6)`);
    for (const d of eventsSnap.docs) {
      console.log(`- Group ID: ${d.id}`);
      console.log(`  Name: ${d.data().name}`);
      const subEventsSnap = await getDocs(collection(db, 'events', d.id, 'subEvents'));
      console.log(`  SubEvents: ${subEventsSnap.size}`);
      for (const subDoc of subEventsSnap.docs) {
        console.log(`    - SubEvent ID: ${subDoc.id}, Name: ${subDoc.data().name}, Category: ${subDoc.data().category}`);
      }
    }
  } catch (err) {
    console.error("Error fetching:", err);
  }
}
fetchEvents();
