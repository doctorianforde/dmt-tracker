// One-off script to create a privileged (supervisor/lecturer) account in Firebase.
// Uses the Admin SDK directly, since firestore.rules no longer let a client
// self-assign anything but the 'student' role — see /api/supervisor-signup
// for the invite-code-gated supervisor sign-up flow this script bypasses.
//
// Usage:
//   node --env-file=.env.local scripts/create-supervisor.mjs
//
// Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and
// FIREBASE_ADMIN_PRIVATE_KEY in .env.local (see .env.local.example).

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ── Edit these before running ─────────────────────────────────────
const ACCOUNT = {
  name: 'Dr. Paul',
  email: 'lecturer@test.edu',
  password: 'TestSuper123!',
  role: 'lecturer', // supervisor | lecturer
};
// ─────────────────────────────────────────────────────────────────

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing FIREBASE_ADMIN_* env vars. Run with: node --env-file=.env.local scripts/create-supervisor.mjs');
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const db = getFirestore(app);

try {
  console.log(`Creating ${ACCOUNT.role} account for ${ACCOUNT.email}...`);

  const userRecord = await auth.createUser({
    email: ACCOUNT.email,
    password: ACCOUNT.password,
    displayName: ACCOUNT.name,
  });

  await db.collection('users').doc(userRecord.uid).set({
    name: ACCOUNT.name,
    email: ACCOUNT.email,
    role: ACCOUNT.role,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log('✅ Account created successfully!');
  console.log(`   Name:     ${ACCOUNT.name}`);
  console.log(`   Email:    ${ACCOUNT.email}`);
  console.log(`   Password: ${ACCOUNT.password}`);
  console.log(`   Role:     ${ACCOUNT.role}`);
  console.log(`   UID:      ${userRecord.uid}`);
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
