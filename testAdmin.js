import { adminDb } from './src/lib/firebase/admin.js';

async function test() {
  console.log("adminDb exists:", !!adminDb);
}
test();
