// One-off script to create a supervisor account in Firebase
// Usage: node scripts/create-supervisor.mjs

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDjLB4LuoNmUsutWMnf4a5ybjNt40fKyLI',
  authDomain: 'dmt-tracker-a80f2.firebaseapp.com',
  projectId: 'dmt-tracker-a80f2',
  storageBucket: 'dmt-tracker-a80f2.firebasestorage.app',
  messagingSenderId: '217506650423',
  appId: '1:217506650423:web:94701e9b830053fcd4e2b2',
};

// ── Edit these before running ─────────────────────────────────────
const ACCOUNT = {
  name: 'Test Supervisor',
  email: 'drpaul@test.com',
  password: 'TestSuper123!',
  role: 'drpaul',   // supervisor1 | supervisor2 | drpaul
};
// ─────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  console.log(`Creating ${ACCOUNT.role} account for ${ACCOUNT.email}...`);

  const { user } = await createUserWithEmailAndPassword(
    auth,
    ACCOUNT.email,
    ACCOUNT.password
  );

  await setDoc(doc(db, 'users', user.uid), {
    name: ACCOUNT.name,
    email: ACCOUNT.email,
    role: ACCOUNT.role,
    createdAt: serverTimestamp(),
  });

  console.log('✅ Account created successfully!');
  console.log(`   Name:     ${ACCOUNT.name}`);
  console.log(`   Email:    ${ACCOUNT.email}`);
  console.log(`   Password: ${ACCOUNT.password}`);
  console.log(`   Role:     ${ACCOUNT.role}`);
  console.log(`   UID:      ${user.uid}`);
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
