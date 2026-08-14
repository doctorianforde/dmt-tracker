#!/usr/bin/env node

/**
 * Test Data Seeding Script
 * Creates supervisor, lecturer, and student test accounts with sample case data.
 *
 * Usage: node --env-file=.env.local scripts/create-test-data.js
 *
 * Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and
 * FIREBASE_ADMIN_PRIVATE_KEY in .env.local (see .env.local.example).
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

// Test data
const testSupervisors = [
  {
    email: 'supervisor1@test.edu',
    password: 'Test1234!',
    name: 'Dr. Davin Powdhar',
    role: 'supervisor',
  },
  {
    email: 'supervisor2@test.edu',
    password: 'Test1234!',
    name: 'Dr. Windale',
    role: 'supervisor',
  },
  {
    email: 'lecturer@test.edu',
    password: 'Test1234!',
    name: 'Dr. Paul',
    role: 'lecturer',
  },
];

const testStudents = [
  {
    email: 'student1@test.edu',
    password: 'Test1234!',
    name: 'Alice Johnson',
    caseNumber: 'DMT-2024-001',
    startYear: 2024,
    classYear: 4,
    supervisorEmail: 'supervisor1@test.edu',
  },
  {
    email: 'student2@test.edu',
    password: 'Test1234!',
    name: 'Bob Smith',
    caseNumber: 'DMT-2024-002',
    startYear: 2024,
    classYear: 4,
    supervisorEmail: 'supervisor1@test.edu',
  },
  {
    email: 'student3@test.edu',
    password: 'Test1234!',
    name: 'Carol Davis',
    caseNumber: 'DMT-2024-003',
    startYear: 2024,
    classYear: 3,
    supervisorEmail: 'supervisor2@test.edu',
  },
  {
    email: 'student4@test.edu',
    password: 'Test1234!',
    name: 'David Wilson',
    caseNumber: 'DMT-2024-004',
    startYear: 2024,
    classYear: 3,
    supervisorEmail: 'supervisor2@test.edu',
  },
];

const testCases = [
  {
    caseNumber: 'DMT-2024-001',
    studentName: 'Alice Johnson',
    approvalStage: 'pending',
    sections: { intro: true, caseReport: true, discussion: false, conclusion: false, references: false },
  },
  {
    caseNumber: 'DMT-2024-002',
    studentName: 'Bob Smith',
    approvalStage: 'supervisor',
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    supervisorApproval: { approved: false },
  },
  {
    caseNumber: 'DMT-2024-003',
    studentName: 'Carol Davis',
    approvalStage: 'lecturer',
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    supervisorApproval: { approved: true, approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  },
  {
    caseNumber: 'DMT-2024-004',
    studentName: 'David Wilson',
    approvalStage: 'lecturer',
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    supervisorApproval: { approved: true, approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  },
];

async function createTestData() {
  try {
    console.log('\n🔐 Creating test supervisors...');
    const supervisorUidByEmail = {};
    for (const supervisor of testSupervisors) {
      try {
        const userRecord = await auth.createUser({
          email: supervisor.email,
          password: supervisor.password,
          displayName: supervisor.name,
        });

        await db.collection('users').doc(userRecord.uid).set({
          name: supervisor.name,
          email: supervisor.email,
          role: supervisor.role,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        supervisorUidByEmail[supervisor.email] = userRecord.uid;
        console.log(`  ✅ ${supervisor.role}: ${supervisor.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          const existing = await auth.getUserByEmail(supervisor.email);
          supervisorUidByEmail[supervisor.email] = existing.uid;
          console.log(`  ⚠️  ${supervisor.email} already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n👥 Creating test students...');
    for (const student of testStudents) {
      const supervisor = testSupervisors.find((s) => s.email === student.supervisorEmail);
      try {
        const userRecord = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.name,
        });

        await db.collection('users').doc(userRecord.uid).set({
          name: student.name,
          email: student.email,
          role: 'student',
          caseNumber: student.caseNumber,
          startYear: student.startYear,
          classYear: student.classYear,
          assignedSupervisorUid: supervisorUidByEmail[student.supervisorEmail],
          assignedSupervisorName: supervisor?.name,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`  ✅ ${student.name} (${student.email}) → assigned to ${supervisor?.name}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`  ⚠️  ${student.email} already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n📋 Creating test case records...');
    for (const testCase of testCases) {
      const student = testStudents.find((s) => s.caseNumber === testCase.caseNumber);
      const supervisor = testSupervisors.find((s) => s.email === student?.supervisorEmail);
      const caseData = {
        ...testCase,
        studentUid: 'test-student-uid',
        submitted: testCase.approvalStage !== 'pending',
        greenLight: testCase.approvalStage === 'approved',
        supervisorUid: testCase.approvalStage !== 'pending' ? supervisorUidByEmail[student?.supervisorEmail] : undefined,
        supervisorName: testCase.approvalStage !== 'pending' ? supervisor?.name : undefined,
        customDeadline: '2026-06-30',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('cases').doc(testCase.caseNumber).set(caseData);
      console.log(`  ✅ ${testCase.caseNumber}: ${testCase.approvalStage}`);
    }

    console.log('\n✨ Test data created successfully!\n');
    console.log('📝 Test Accounts:');
    console.log('\n🔐 Supervisors / Lecturer:');
    testSupervisors.forEach(s => {
      console.log(`  • ${s.role}: ${s.email} / ${s.password}`);
    });
    console.log('\n👥 Students:');
    testStudents.forEach(s => {
      console.log(`  • ${s.name}: ${s.email} / ${s.password} (assigned to ${s.supervisorEmail})`);
    });
    console.log('\n📊 Case Statuses:');
    testCases.forEach(c => {
      console.log(`  • ${c.caseNumber}: ${c.approvalStage}`);
    });
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
