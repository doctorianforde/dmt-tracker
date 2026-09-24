import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { STAFF_COLLECTION, claimStaffEntry } from '@/lib/staff-directory-server';

// Server-only (Admin SDK). Lets a supervisor add students who have no
// supervisor yet to their own list, or release a student they added. Both
// only while the student's case is still a draft — the same limit students
// have when picking their own supervisor.

export class StudentActionError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

export interface UnassignedStudent {
  uid: string;
  name: string;
  email?: string;
  caseNumber?: string;
  photoURL?: string;
}

function hasSupervisor(data: FirebaseFirestore.DocumentData): boolean {
  return Boolean(data.supervisorDirectoryId || data.assignedSupervisorUid);
}

export async function listUnassignedStudents(db: Firestore): Promise<UnassignedStudent[]> {
  const snap = await db.collection('users').where('role', '==', 'student').get();
  return snap.docs
    .filter((d) => !hasSupervisor(d.data()))
    .map((d) => {
      const u = d.data();
      return {
        uid: d.id,
        name: String(u.name ?? ''),
        ...(u.email ? { email: u.email } : {}),
        ...(u.caseNumber ? { caseNumber: u.caseNumber } : {}),
        ...(u.photoURL ? { photoURL: u.photoURL } : {}),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// The supervisor's own directory entry, created if they signed up before the
// directory existed.
async function directoryEntryFor(db: Firestore, supervisor: { uid: string; name: string }) {
  const existing = await db.collection(STAFF_COLLECTION).where('uid', '==', supervisor.uid).limit(1).get();
  if (!existing.empty) {
    const d = existing.docs[0];
    return { id: d.id, name: String(d.data().name ?? supervisor.name) };
  }
  const id = await claimStaffEntry(db, { uid: supervisor.uid, name: supervisor.name, role: 'supervisor' });
  return { id, name: supervisor.name };
}

export async function addStudentToSupervisor(
  db: Firestore,
  supervisor: { uid: string; name: string },
  studentUid: string
): Promise<void> {
  const entry = await directoryEntryFor(db, supervisor);
  const studentRef = db.collection('users').doc(studentUid);

  await db.runTransaction(async (tx) => {
    const student = await tx.get(studentRef);
    const data = student.data();
    if (!student.exists || data?.role !== 'student') throw new StudentActionError('Student not found.', 404);
    if (hasSupervisor(data)) throw new StudentActionError('That student already has a supervisor.');

    const caseRef = data.caseNumber ? db.collection('cases').doc(String(data.caseNumber)) : null;
    const caseSnap = caseRef ? await tx.get(caseRef) : null;
    if (caseSnap?.exists && (caseSnap.data()?.approvalStage ?? 'pending') !== 'pending') {
      throw new StudentActionError('That student’s case has already been submitted. Ask the Lecturer to assign them.');
    }

    tx.update(studentRef, {
      supervisorDirectoryId: entry.id,
      supervisorDirectoryName: entry.name,
      assignedSupervisorUid: supervisor.uid,
      assignedSupervisorName: entry.name,
    });
    if (caseRef && caseSnap?.exists) {
      tx.update(caseRef, {
        supervisorUid: supervisor.uid,
        supervisorName: entry.name,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}

export async function removeStudentFromSupervisor(
  db: Firestore,
  supervisorUid: string,
  studentUid: string
): Promise<void> {
  const studentRef = db.collection('users').doc(studentUid);

  await db.runTransaction(async (tx) => {
    const student = await tx.get(studentRef);
    const data = student.data();
    if (!student.exists || data?.assignedSupervisorUid !== supervisorUid) {
      throw new StudentActionError('That student isn’t on your list.', 404);
    }

    const caseRef = data.caseNumber ? db.collection('cases').doc(String(data.caseNumber)) : null;
    const caseSnap = caseRef ? await tx.get(caseRef) : null;
    if (caseSnap?.exists && (caseSnap.data()?.approvalStage ?? 'pending') !== 'pending') {
      throw new StudentActionError('That student’s case has already been submitted, so they can’t be removed. Ask the Lecturer.');
    }

    tx.update(studentRef, {
      supervisorDirectoryId: FieldValue.delete(),
      supervisorDirectoryName: FieldValue.delete(),
      assignedSupervisorUid: FieldValue.delete(),
      assignedSupervisorName: FieldValue.delete(),
    });
    if (caseRef && caseSnap?.exists) {
      tx.update(caseRef, {
        supervisorUid: FieldValue.delete(),
        supervisorName: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}
