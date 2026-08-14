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
  let count = 0;

  eventsSnap.forEach((docSnap) => {
    const data = docSnap.data();
    // Prepend "Community Day Aug'26 -" to the existing event name
    // Or you can change the category here instead
    const oldName = data.name || 'Unnamed Event';
    if (!oldName.startsWith("Community Day Aug'26")) {
      const newName = `Community Day Aug'26 - ${oldName}`;
      batch.update(docSnap.ref, { 
        name: newName,
        category: "Community Day Aug'26" 
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully clubbed ${count} events under Community Day Aug'26.`);
  } else {
    console.log('All events are already clubbed.');
  }
}

clubEvents().catch(console.error);
