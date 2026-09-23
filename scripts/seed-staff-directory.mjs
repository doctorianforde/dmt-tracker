// Adds names to the staff directory (Firestore `staff` collection) that
// students pick their supervisor from and staff claim at sign-up.
// Safe to re-run: names already in the directory are skipped.
//
//   node --env-file=.env.local scripts/seed-staff-directory.mjs
//
// Needs the FIREBASE_ADMIN_* variables (same as the sign-up API route).

import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const STAFF = [
  'Dr. Khan',
  'Dr. A. Ramnarine',
  'Dr. Lalloo',
  'Dr. Varachhia',
  'Dr. Mapp',
  'Dr. Baptiste-Manzano',
  'Dr. Sammy',
  'Dr. Babwahsingh',
  'Dr. R. Bacchus',
  'Dr. Davin Powdhar',
];

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('Missing FIREBASE_ADMIN_* env vars. Run with: node --env-file=.env.local scripts/seed-staff-directory.mjs');
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

const normalize = (name) => name.toLowerCase().replace(/[^a-z]/g, '');

const existing = await db.collection('staff').get();
const known = new Set(existing.docs.map((d) => normalize(String(d.data().name ?? ''))));

let added = 0;
for (const name of STAFF) {
  if (known.has(normalize(name))) {
    console.log(`  skip  ${name} (already listed)`);
    continue;
  }
  await db.collection('staff').add({ name, createdAt: FieldValue.serverTimestamp() });
  known.add(normalize(name));
  added++;
  console.log(`  added ${name}`);
}
console.log(`\nDone: ${added} added, ${existing.size} already in the directory.`);
