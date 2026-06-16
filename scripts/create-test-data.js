#!/usr/bin/env node

/**
 * Test Data Seeding Script
 * Creates supervisor and student test accounts with sample case data
 *
 * Usage: node scripts/create-test-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-service-key.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });
} catch (error) {
  console.error('❌ Error: Could not load firebase-service-key.json');
  console.error('Please create this file with your Firebase service account credentials.');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

// Test data
const testSupervisors = [
  {
    email: 'supervisor1@test.edu',
    password: 'Test1234!',
    name: 'Dr. Davin Powdhar',
    role: 'supervisor1',
  },
  {
    email: 'supervisor2@test.edu',
    password: 'Test1234!',
    name: 'Dr. Windale',
    role: 'supervisor2',
  },
  {
    email: 'drpaul@test.edu',
    password: 'Test1234!',
    name: 'Dr. Paul',
    role: 'drpaul',
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
  },
  {
    email: 'student2@test.edu',
    password: 'Test1234!',
    name: 'Bob Smith',
    caseNumber: 'DMT-2024-002',
    startYear: 2024,
    classYear: 4,
  },
  {
    email: 'student3@test.edu',
    password: 'Test1234!',
    name: 'Carol Davis',
    caseNumber: 'DMT-2024-003',
    startYear: 2024,
    classYear: 3,
  },
  {
    email: 'student4@test.edu',
    password: 'Test1234!',
    name: 'David Wilson',
    caseNumber: 'DMT-2024-004',
    startYear: 2024,
    classYear: 3,
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
    approvalStage: 'supervisor1',
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    supervisor1Approval: { approved: false },
  },
  {
    caseNumber: 'DMT-2024-003',
    studentName: 'Carol Davis',
    approvalStage: 'supervisor2',
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    supervisor1Approval: { approved: true, approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  },
  {
    caseNumber: 'DMT-2024-004',
    studentName: 'David Wilson',
    approvalStage: 'drpaul',
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    supervisor1Approval: { approved: true, approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    supervisor2Approval: { approved: true, approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  },
];

async function createTestData() {
  try {
    console.log('\n🔐 Creating test supervisors...');
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

        console.log(`  ✅ ${supervisor.role}: ${supervisor.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`  ⚠️  ${supervisor.email} already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n👥 Creating test students...');
    for (const student of testStudents) {
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`  ✅ ${student.name} (${student.email})`);
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
      const caseData = {
        ...testCase,
        studentUid: 'test-student-uid',
        submitted: testCase.approvalStage !== 'pending',
        greenLight: testCase.approvalStage === 'approved',
        supervisor1Name: 'Dr. Davin Powdhar',
        supervisor2Name: testCase.approvalStage === 'supervisor2' || testCase.approvalStage === 'drpaul' || testCase.approvalStage === 'approved' ? 'Dr. Windale' : undefined,
        customDeadline: '2026-06-30',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('cases').doc(testCase.caseNumber).set(caseData);
      console.log(`  ✅ ${testCase.caseNumber}: ${testCase.approvalStage}`);
    }

    console.log('\n✨ Test data created successfully!\n');
    console.log('📝 Test Accounts:');
    console.log('\n🔐 Supervisors:');
    testSupervisors.forEach(s => {
      console.log(`  • ${s.role}: ${s.email} / ${s.password}`);
    });
    console.log('\n👥 Students:');
    testStudents.forEach(s => {
      console.log(`  • ${s.name}: ${s.email} / ${s.password}`);
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
