import { readFileSync } from 'fs';
import path from 'path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

// Runs against the Firestore emulator: `npm run test:rules`.

let env: RulesTestEnvironment;

const SECTIONS = { intro: true, caseReport: false, discussion: false, conclusion: false, references: false };

// A pending (draft) case, a case at each review stage, and the people around them.
const USERS = {
  // Case C1 is at the supervisor stage, assigned to sup1.
  student1: { name: 'Student One', email: 's1@test.edu', role: 'student', caseNumber: 'C1',
    supervisorDirectoryId: 'staff-sup1', supervisorDirectoryName: 'Dr Sup One',
    assignedSupervisorUid: 'sup1', assignedSupervisorName: 'Dr Sup One' },
  // No case number and no supervisor yet.
  student2: { name: 'Student Two', email: 's2@test.edu', role: 'student' },
  // Case C3 is still a draft, assigned to sup1.
  student3: { name: 'Student Three', email: 's3@test.edu', role: 'student', caseNumber: 'C3',
    supervisorDirectoryId: 'staff-sup1', supervisorDirectoryName: 'Dr Sup One',
    assignedSupervisorUid: 'sup1', assignedSupervisorName: 'Dr Sup One' },
  // Case C4 is waiting on the Lecturer.
  student4: { name: 'Student Four', email: 's4@test.edu', role: 'student', caseNumber: 'C4',
    assignedSupervisorUid: 'sup1', assignedSupervisorName: 'Dr Sup One' },
  sup1: { name: 'Dr Sup One', email: 'sup1@test.edu', role: 'supervisor' },
  sup2: { name: 'Dr Sup Two', email: 'sup2@test.edu', role: 'supervisor' },
  lect: { name: 'Dr Lecturer', email: 'lect@test.edu', role: 'lecturer' },
} as const;

const CASES = {
  C1: { studentUid: 'student1', studentName: 'Student One', caseNumber: 'C1', startYear: 2025, classYear: 1,
    sections: SECTIONS, greenLight: false, approvalStage: 'supervisor', supervisorUid: 'sup1', supervisorName: 'Dr Sup One' },
  C3: { studentUid: 'student3', studentName: 'Student Three', caseNumber: 'C3', startYear: 2025, classYear: 1,
    sections: SECTIONS, greenLight: false, approvalStage: 'pending', supervisorUid: 'sup1', supervisorName: 'Dr Sup One' },
  C4: { studentUid: 'student4', studentName: 'Student Four', caseNumber: 'C4', startYear: 2025, classYear: 1,
    sections: SECTIONS, greenLight: false, approvalStage: 'lecturer', supervisorUid: 'sup1', supervisorName: 'Dr Sup One',
    supervisorApproval: { approved: true } },
};

const STAFF = {
  'staff-sup1': { name: 'Dr Sup One', uid: 'sup1', role: 'supervisor' },
  'staff-sup2': { name: 'Dr Sup Two', uid: 'sup2', role: 'supervisor' },
  'staff-unclaimed': { name: 'Dr Not Yet Joined' },
};

// A signed-in user who has confirmed their email.
function as(uid: string) {
  return env.authenticatedContext(uid, { email_verified: true }).firestore();
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-vis',
    firestore: { rules: readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await Promise.all([
      ...Object.entries(USERS).map(([uid, u]) => setDoc(doc(db, 'users', uid), u)),
      ...Object.entries(CASES).map(([id, c]) => setDoc(doc(db, 'cases', id), c)),
      ...Object.entries(STAFF).map(([id, s]) => setDoc(doc(db, 'staff', id), s)),
      setDoc(doc(db, 'accessLogs', 'existing'), { actorUid: 'student1', actorName: 'Student One',
        actorRole: 'student', action: 'login', createdAt: Timestamp.now() }),
    ]);
  });
});

// ── Users ──────────────────────────────────────────────────────────────────

describe('users: reading', () => {
  it('a user reads their own profile', async () => {
    await assertSucceeds(getDoc(doc(as('student1'), 'users/student1')));
  });

  it('a student cannot read another student', async () => {
    await assertFails(getDoc(doc(as('student1'), 'users/student2')));
  });

  it('a supervisor reads only the students assigned to them', async () => {
    await assertSucceeds(getDoc(doc(as('sup1'), 'users/student1')));
    await assertFails(getDoc(doc(as('sup2'), 'users/student1')));
    await assertSucceeds(getDocs(query(collection(as('sup1'), 'users'), where('assignedSupervisorUid', '==', 'sup1'))));
    await assertFails(getDocs(collection(as('sup1'), 'users')));
  });

  it('the lecturer reads every profile', async () => {
    await assertSucceeds(getDocs(collection(as('lect'), 'users')));
  });
});

describe('users: sign-up', () => {
  it('a new user can create their own student profile', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/newbie'), { name: 'New', email: 'n@test.edu', role: 'student' }));
  });

  it('cannot self-register as staff', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(setDoc(doc(db, 'users/newbie'), { name: 'New', email: 'n@test.edu', role: 'supervisor' }));
    await assertFails(setDoc(doc(db, 'users/newbie'), { name: 'New', email: 'n@test.edu', role: 'lecturer' }));
  });

  it('cannot pre-fill a deadline or supervisor', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(setDoc(doc(db, 'users/newbie'), { name: 'N', email: 'n@test.edu', role: 'student', deadline: '2030-01-01' }));
    await assertFails(setDoc(doc(db, 'users/newbie'), { name: 'N', email: 'n@test.edu', role: 'student', assignedSupervisorUid: 'sup1' }));
  });

  it('cannot create a profile for someone else', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(setDoc(doc(db, 'users/other'), { name: 'N', email: 'n@test.edu', role: 'student' }));
  });
});

describe('users: a student editing their own profile', () => {
  it('can change their name and year', async () => {
    await assertSucceeds(updateDoc(doc(as('student1'), 'users/student1'), { name: 'Renamed', classYear: 2 }));
  });

  it('must have confirmed their email', async () => {
    const db = env.authenticatedContext('student1', { email_verified: false }).firestore();
    await assertFails(updateDoc(doc(db, 'users/student1'), { name: 'Renamed' }));
  });

  it('cannot change their role or deadline', async () => {
    await assertFails(updateDoc(doc(as('student1'), 'users/student1'), { role: 'lecturer' }));
    await assertFails(updateDoc(doc(as('student1'), 'users/student1'), { deadline: '2030-01-01' }));
  });

  it('sets their case number once, then it is locked', async () => {
    await assertSucceeds(updateDoc(doc(as('student2'), 'users/student2'), { caseNumber: 'C2' }));
    await assertFails(updateDoc(doc(as('student1'), 'users/student1'), { caseNumber: 'C9' }));
    await assertFails(updateDoc(doc(as('student1'), 'users/student1'), { caseNumber: '' }));
  });

  it('rejects an oversized profile photo', async () => {
    await assertFails(updateDoc(doc(as('student1'), 'users/student1'), { photoURL: 'x'.repeat(200001) }));
    await assertSucceeds(updateDoc(doc(as('student1'), 'users/student1'), { photoURL: 'data:image/jpeg;base64,abc' }));
  });
});

describe('users: a student picking their supervisor', () => {
  it('can pick a signed-up supervisor from the directory before submitting', async () => {
    await assertSucceeds(updateDoc(doc(as('student2'), 'users/student2'), {
      supervisorDirectoryId: 'staff-sup2', supervisorDirectoryName: 'Dr Sup Two',
      assignedSupervisorUid: 'sup2', assignedSupervisorName: 'Dr Sup Two',
    }));
  });

  it('can pick someone who has not signed up yet', async () => {
    await assertSucceeds(updateDoc(doc(as('student2'), 'users/student2'), {
      supervisorDirectoryId: 'staff-unclaimed', supervisorDirectoryName: 'Dr Not Yet Joined',
    }));
  });

  it('can change their pick while the case is a draft', async () => {
    await assertSucceeds(updateDoc(doc(as('student3'), 'users/student3'), {
      supervisorDirectoryId: 'staff-sup2', supervisorDirectoryName: 'Dr Sup Two',
      assignedSupervisorUid: 'sup2', assignedSupervisorName: 'Dr Sup Two',
    }));
  });

  it('must copy the directory entry faithfully', async () => {
    await assertFails(updateDoc(doc(as('student2'), 'users/student2'), {
      supervisorDirectoryId: 'staff-sup2', supervisorDirectoryName: 'Dr Sup Two',
      assignedSupervisorUid: 'sup1', assignedSupervisorName: 'Dr Sup Two',
    }));
    await assertFails(updateDoc(doc(as('student2'), 'users/student2'), {
      assignedSupervisorUid: 'sup1', assignedSupervisorName: 'Dr Sup One',
    }));
  });

  it('cannot change it once the case is submitted', async () => {
    await assertFails(updateDoc(doc(as('student1'), 'users/student1'), {
      supervisorDirectoryId: 'staff-sup2', supervisorDirectoryName: 'Dr Sup Two',
      assignedSupervisorUid: 'sup2', assignedSupervisorName: 'Dr Sup Two',
    }));
  });
});

describe('users: staff editing a student', () => {
  it('the assigned supervisor sets the deadline', async () => {
    await assertSucceeds(updateDoc(doc(as('sup1'), 'users/student1'), { deadline: '2030-01-01', deadlineSetByName: 'Dr Sup One' }));
  });

  it('another supervisor cannot', async () => {
    await assertFails(updateDoc(doc(as('sup2'), 'users/student1'), { deadline: '2030-01-01' }));
  });

  it('a supervisor cannot reassign the student', async () => {
    await assertFails(updateDoc(doc(as('sup1'), 'users/student1'), { assignedSupervisorUid: 'sup2' }));
  });

  it('the lecturer sets the assignment and deadline but not the role', async () => {
    await assertSucceeds(updateDoc(doc(as('lect'), 'users/student1'), {
      assignedSupervisorUid: 'sup2', assignedSupervisorName: 'Dr Sup Two', deadline: '2030-01-01',
    }));
    await assertFails(updateDoc(doc(as('lect'), 'users/student1'), { role: 'supervisor' }));
    await assertFails(updateDoc(doc(as('lect'), 'users/student1'), { name: 'Renamed' }));
  });
});

// ── Cases ──────────────────────────────────────────────────────────────────

describe('cases: reading', () => {
  it('a student reads only their own case', async () => {
    await assertSucceeds(getDoc(doc(as('student1'), 'cases/C1')));
    await assertFails(getDoc(doc(as('student3'), 'cases/C1')));
  });

  it('a supervisor reads only cases assigned to them', async () => {
    await assertSucceeds(getDoc(doc(as('sup1'), 'cases/C1')));
    await assertFails(getDoc(doc(as('sup2'), 'cases/C1')));
    await assertSucceeds(getDocs(query(collection(as('sup1'), 'cases'), where('supervisorUid', '==', 'sup1'))));
    await assertFails(getDocs(collection(as('sup1'), 'cases')));
  });

  it('the lecturer reads every case', async () => {
    await assertSucceeds(getDocs(collection(as('lect'), 'cases')));
  });

  it('an unverified user reads nothing', async () => {
    const db = env.authenticatedContext('student1', { email_verified: false }).firestore();
    await assertFails(getDoc(doc(db, 'cases/C1')));
  });
});

describe('cases: a student creating their case', () => {
  const draft = { studentUid: 'student2', studentName: 'Student Two', caseNumber: 'C2', startYear: 2025,
    classYear: 1, sections: SECTIONS, greenLight: false, approvalStage: 'pending' };

  it('can create a draft', async () => {
    await assertSucceeds(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, updatedAt: serverTimestamp() }));
  });

  it('cannot create one that is already approved or reviewed', async () => {
    await assertFails(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, greenLight: true }));
    await assertFails(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, approvalStage: 'approved' }));
    await assertFails(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, supervisorApproval: { approved: true } }));
    await assertFails(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, lecturerApproval: { approved: true } }));
  });

  it('cannot create one for someone else, or under a different id', async () => {
    await assertFails(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, studentUid: 'student3' }));
    await assertFails(setDoc(doc(as('student2'), 'cases/OTHER'), draft));
  });

  it('can only name the supervisor already assigned to them', async () => {
    await assertFails(setDoc(doc(as('student2'), 'cases/C2'), { ...draft, supervisorUid: 'sup1' }));
  });

  it('staff cannot create cases', async () => {
    await assertFails(setDoc(doc(as('sup1'), 'cases/C2'), { ...draft, studentUid: 'sup1' }));
  });
});

describe('cases: a student updating their case', () => {
  it('can tick off sections and save', async () => {
    await assertSucceeds(setDoc(doc(as('student1'), 'cases/C1'),
      { sections: { ...SECTIONS, discussion: true }, greenLight: false, approvalStage: 'supervisor', caseNumber: 'C1',
        updatedAt: serverTimestamp() }, { merge: true }));
  });

  it('can submit a draft for review', async () => {
    await assertSucceeds(updateDoc(doc(as('student3'), 'cases/C3'), { approvalStage: 'supervisor', updatedAt: serverTimestamp() }));
  });

  it('cannot move the stage any other way', async () => {
    await assertFails(updateDoc(doc(as('student3'), 'cases/C3'), { approvalStage: 'approved' }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { approvalStage: 'lecturer' }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { approvalStage: 'pending' }));
  });

  it('cannot touch approvals, the green light, or ownership', async () => {
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { greenLight: true }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { supervisorApproval: { approved: true } }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { lecturerApproval: { approved: true } }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { studentUid: 'student2' }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { caseNumber: 'C9' }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { customDeadline: '2030-01-01' }));
  });

  it('can flag a rejected case as resubmitted', async () => {
    await assertSucceeds(updateDoc(doc(as('student1'), 'cases/C1'), { resubmittedAt: serverTimestamp() }));
  });

  it('syncs the supervisor only while the case is a draft', async () => {
    // Profile says sup1, so the case can be (re)stamped with sup1 while a draft…
    await assertSucceeds(updateDoc(doc(as('student3'), 'cases/C3'), { supervisorUid: 'sup1', supervisorName: 'Dr Sup One' }));
    // …but not with anyone else, and not after submitting.
    await assertFails(updateDoc(doc(as('student3'), 'cases/C3'), { supervisorUid: 'sup2', supervisorName: 'Dr Sup Two' }));
    await assertFails(updateDoc(doc(as('student1'), 'cases/C1'), { supervisorUid: deleteField(), supervisorName: deleteField() }));
  });

  it('cannot update another student’s case', async () => {
    await assertFails(updateDoc(doc(as('student3'), 'cases/C1'), { sections: SECTIONS }));
  });
});

describe('cases: supervisor review', () => {
  it('the assigned supervisor approves, sending the case to the lecturer', async () => {
    await assertSucceeds(updateDoc(doc(as('sup1'), 'cases/C1'), {
      supervisorApproval: { approved: true, approvedAt: serverTimestamp() }, approvalStage: 'lecturer', updatedAt: serverTimestamp(),
    }));
  });

  it('the assigned supervisor rejects, keeping the case at their stage', async () => {
    await assertSucceeds(updateDoc(doc(as('sup1'), 'cases/C1'), {
      supervisorApproval: { approved: false, rejectedAt: serverTimestamp(), rejectionReason: 'More detail' }, updatedAt: serverTimestamp(),
    }));
  });

  it('cannot skip the lecturer or set the green light', async () => {
    await assertFails(updateDoc(doc(as('sup1'), 'cases/C1'), { supervisorApproval: { approved: true }, approvalStage: 'approved' }));
    await assertFails(updateDoc(doc(as('sup1'), 'cases/C1'), { greenLight: true }));
  });

  it('cannot pass a case on without approving it', async () => {
    await assertFails(updateDoc(doc(as('sup1'), 'cases/C1'), { supervisorApproval: { approved: false }, approvalStage: 'lecturer' }));
  });

  it('cannot review a draft or a case past their stage', async () => {
    await assertFails(updateDoc(doc(as('sup1'), 'cases/C3'), { supervisorApproval: { approved: true }, approvalStage: 'lecturer' }));
    await assertFails(updateDoc(doc(as('sup1'), 'cases/C4'), { supervisorApproval: { approved: false } }));
  });

  it('cannot edit the student’s content', async () => {
    await assertFails(updateDoc(doc(as('sup1'), 'cases/C1'), { sections: { ...SECTIONS, references: true } }));
  });

  it('a supervisor not assigned to the case can do nothing', async () => {
    await assertFails(updateDoc(doc(as('sup2'), 'cases/C1'), { supervisorApproval: { approved: true }, approvalStage: 'lecturer' }));
  });
});

describe('cases: lecturer review', () => {
  it('gives final approval with the green light', async () => {
    await assertSucceeds(updateDoc(doc(as('lect'), 'cases/C4'), {
      lecturerApproval: { approved: true, approvedAt: serverTimestamp() }, approvalStage: 'approved', greenLight: true,
      updatedAt: serverTimestamp(),
    }));
  });

  it('cannot give the green light before the case is approved', async () => {
    await assertFails(updateDoc(doc(as('lect'), 'cases/C4'), { greenLight: true }));
  });

  it('revokes an approval', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), 'cases/C4'), { approvalStage: 'approved', greenLight: true, lecturerApproval: { approved: true } }));
    await assertSucceeds(updateDoc(doc(as('lect'), 'cases/C4'), {
      greenLight: false, approvalStage: 'lecturer', lecturerApproval: deleteField(), updatedAt: serverTimestamp(),
    }));
  });

  it('reassigns a case to another supervisor', async () => {
    await assertSucceeds(updateDoc(doc(as('lect'), 'cases/C1'), { supervisorUid: 'sup2', supervisorName: 'Dr Sup Two' }));
  });

  it('cannot edit the student’s content', async () => {
    await assertFails(updateDoc(doc(as('lect'), 'cases/C1'), { sections: SECTIONS, studentUid: 'student2' }));
  });

  it('nobody deletes a case', async () => {
    await assertFails(deleteDoc(doc(as('lect'), 'cases/C1')));
    await assertFails(deleteDoc(doc(as('student1'), 'cases/C1')));
  });
});

// ── Staff directory ────────────────────────────────────────────────────────

describe('staff directory', () => {
  it('verified users read it', async () => {
    await assertSucceeds(getDocs(collection(as('student2'), 'staff')));
  });

  it('unverified users do not', async () => {
    const db = env.authenticatedContext('student2', { email_verified: false }).firestore();
    await assertFails(getDocs(collection(db, 'staff')));
  });

  it('only the server writes to it', async () => {
    await assertFails(setDoc(doc(as('lect'), 'staff/new'), { name: 'Dr New' }));
    await assertFails(updateDoc(doc(as('sup2'), 'staff/staff-unclaimed'), { uid: 'sup2' }));
  });
});

// ── Access log ─────────────────────────────────────────────────────────────

describe('access log', () => {
  const entry = { actorUid: 'student1', actorName: 'Student One', actorRole: 'student', action: 'login' };

  it('a user logs their own action', async () => {
    await assertSucceeds(addDoc(collection(as('student1'), 'accessLogs'), { ...entry, createdAt: serverTimestamp() }));
  });

  it('cannot log as someone else', async () => {
    await assertFails(addDoc(collection(as('student1'), 'accessLogs'), { ...entry, actorUid: 'sup1', createdAt: serverTimestamp() }));
  });

  it('cannot claim a role they do not have', async () => {
    await assertFails(addDoc(collection(as('student1'), 'accessLogs'), { ...entry, actorRole: 'lecturer', createdAt: serverTimestamp() }));
  });

  it('cannot backdate an entry', async () => {
    await assertFails(addDoc(collection(as('student1'), 'accessLogs'), { ...entry, createdAt: Timestamp.fromDate(new Date('2020-01-01')) }));
  });

  it('entries cannot be edited or deleted', async () => {
    await assertFails(updateDoc(doc(as('student1'), 'accessLogs/existing'), { action: 'view_cases' }));
    await assertFails(deleteDoc(doc(as('lect'), 'accessLogs/existing')));
  });

  it('only the lecturer reads it', async () => {
    await assertSucceeds(getDocs(collection(as('lect'), 'accessLogs')));
    await assertFails(getDocs(collection(as('sup1'), 'accessLogs')));
    await assertFails(getDocs(collection(as('student1'), 'accessLogs')));
  });
});
