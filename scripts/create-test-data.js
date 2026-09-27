#!/usr/bin/env node

/**
 * Test Data Seeding Script
 * Creates supervisor, lecturer, and student test accounts with a case at each
 * stage of the approval pipeline. Safe to re-run: existing accounts are
 * reused and their profiles/cases reset to the values below.
 *
 * Usage: node --env-file=.env.local scripts/create-test-data.js
 *
 * Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and
 * FIREBASE_ADMIN_PRIVATE_KEY in .env.local (see .env.local.example).
 *
 * Everything here is test-only — delete these accounts before handing over.
 */

const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing FIREBASE_ADMIN_* env vars. Run with: node --env-file=.env.local scripts/create-test-data.js');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const auth = admin.auth();
const db = admin.firestore();
const { FieldValue } = admin.firestore;

const PASSWORD = 'Test1234!';

// Clearly-fake names so they never collide with the real staff directory.
const testStaff = [
  { email: 'supervisor1@test.edu', name: 'Dr. Test Supervisor A', role: 'supervisor' },
  { email: 'supervisor2@test.edu', name: 'Dr. Test Supervisor B', role: 'supervisor' },
  { email: 'lecturer@test.edu', name: 'Dr. Test Lecturer', role: 'lecturer' },
];

// One student per pipeline stage.
const ALL_DONE = { intro: true, caseReport: true, discussion: true, conclusion: true, references: true };
const testStudents = [
  {
    email: 'student1@test.edu', name: 'Test Student Alice', caseNumber: 'TEST-001',
    startYear: 2024, classYear: 4, supervisorEmail: 'supervisor1@test.edu',
    case: { approvalStage: 'pending', sections: { ...ALL_DONE, discussion: false, conclusion: false, references: false } },
  },
  {
    email: 'student2@test.edu', name: 'Test Student Bob', caseNumber: 'TEST-002',
    startYear: 2024, classYear: 4, supervisorEmail: 'supervisor1@test.edu',
    case: { approvalStage: 'supervisor', sections: ALL_DONE },
  },
  {
    email: 'student3@test.edu', name: 'Test Student Carol', caseNumber: 'TEST-003',
    startYear: 2024, classYear: 3, supervisorEmail: 'supervisor2@test.edu',
    case: { approvalStage: 'lecturer', sections: ALL_DONE, supervisorApproval: { approved: true, approvedAt: new Date() } },
  },
  {
    email: 'student4@test.edu', name: 'Test Student Dave', caseNumber: 'TEST-004',
    startYear: 2024, classYear: 3, supervisorEmail: 'supervisor2@test.edu',
    case: { approvalStage: 'lecturer', sections: ALL_DONE, supervisorApproval: { approved: true, approvedAt: new Date() } },
  },
];

// Creates the auth account (or reuses an existing one) with the email
// already confirmed — the app requires a confirmed email, and @test.edu
// inboxes don't exist.
async function ensureAccount({ email, name }) {
  try {
    const user = await auth.createUser({ email, password: PASSWORD, displayName: name, emailVerified: true });
    console.log(`  ✅ created ${email}`);
    return user.uid;
  } catch (error) {
    if (error.code !== 'auth/email-already-exists') throw error;
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password: PASSWORD, emailVerified: true });
    console.log(`  ↺  reused ${email}`);
    return existing.uid;
  }
}

async function createTestData() {
  console.log('\n🔐 Staff');
  const staffByEmail = {};
  for (const s of testStaff) {
    const uid = await ensureAccount(s);
    await db.collection('users').doc(uid).set({
      name: s.name, email: s.email, role: s.role, createdAt: FieldValue.serverTimestamp(),
    });
    // A claimed staff-directory entry, as /api/supervisor-signup creates.
    const directoryId = `test-${uid}`;
    await db.collection('staff').doc(directoryId).set({
      name: s.name, uid, role: s.role, createdAt: FieldValue.serverTimestamp(), claimedAt: FieldValue.serverTimestamp(),
    });
    staffByEmail[s.email] = { uid, name: s.name, directoryId };
  }

  console.log('\n👥 Students and cases');
  for (const s of testStudents) {
    const uid = await ensureAccount(s);
    const sup = staffByEmail[s.supervisorEmail];
    await db.collection('users').doc(uid).set({
      name: s.name,
      email: s.email,
      role: 'student',
      caseNumber: s.caseNumber,
      startYear: s.startYear,
      classYear: s.classYear,
      supervisorDirectoryId: sup.directoryId,
      supervisorDirectoryName: sup.name,
      assignedSupervisorUid: sup.uid,
      assignedSupervisorName: sup.name,
      createdAt: FieldValue.serverTimestamp(),
    });
    await db.collection('cases').doc(s.caseNumber).set({
      studentUid: uid,
      studentName: s.name,
      caseNumber: s.caseNumber,
      startYear: s.startYear,
      classYear: s.classYear,
      greenLight: false,
      supervisorUid: sup.uid,
      supervisorName: sup.name,
      ...s.case,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`     ${s.caseNumber} (${s.case.approvalStage}) → ${sup.name}`);
  }

  console.log('\n✨ Done. All accounts use the password', PASSWORD);
  [...testStaff, ...testStudents].forEach((a) => console.log(`  • ${a.email}  ${a.name}`));
  console.log();
}

createTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  });
