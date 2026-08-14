const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Ensure you have run: gcloud auth application-default login
// Or set GOOGLE_APPLICATION_CREDENTIALS before running this script.

admin.initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function clubEvents() {
  console.log('Fetching events from Firestore...');
  const eventsSnap = await db.collection('events').get();
  
  if (eventsSnap.empty) {
    console.log('No events found in Firestore.');
    return;
  }

  const batch = db.batch();
  
  // Create Mega Event
  const megaEventRef = db.collection('events').doc('communityDayAug26');
  batch.set(megaEventRef, {
    id: 'communityDayAug26',
    name: "Community Day Aug'26",
    description: 'All activities and events happening on Community Day.',
    coverImageUrl: null,
    status: 'PUBLISHED',
    createdBy: 'system_migration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  let count = 0;

  eventsSnap.forEach((docSnap) => {
    if (docSnap.id === 'communityDayAug26') return;
    const data = docSnap.data();
    
    // Move to subcollection
    const subEventRef = megaEventRef.collection('subEvents').doc(docSnap.id);
    data.groupId = 'communityDayAug26';
    
    batch.set(subEventRef, data);
    batch.delete(docSnap.ref); // Delete original
    count++;
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully clubbed ${count} events into Community Day Aug'26 subcollection.`);
  } else {
    console.log('All events are already clubbed.');
  }
}

clubEvents().catch(console.error);
