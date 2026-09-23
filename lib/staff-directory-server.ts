import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { StaffDirectoryEntry, UserRole } from '@/types';

// Server-only (Admin SDK). The staff directory lives in the `staff`
// collection; clients can read it but only the server writes to it.
export const STAFF_COLLECTION = 'staff';

export class StaffEntryUnavailableError extends Error {
  constructor() {
    super('That name has already been claimed by another account. Choose “I’m not on this list yet” or contact the administrator.');
  }
}

// Entries nobody has claimed yet — what the staff sign-up page offers.
export async function listUnclaimedStaff(db: Firestore): Promise<Pick<StaffDirectoryEntry, 'id' | 'name'>[]> {
  const snap = await db.collection(STAFF_COLLECTION).get();
  return snap.docs
    .filter((d) => !d.data().uid)
    .map((d) => ({ id: d.id, name: String(d.data().name ?? '') }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Checked before creating the auth account, so a taken name doesn't leave an
// orphaned account behind. claimStaffEntry re-checks inside a transaction.
export async function assertStaffEntryClaimable(db: Firestore, directoryId: string): Promise<void> {
  const snap = await db.collection(STAFF_COLLECTION).doc(directoryId).get();
  if (!snap.exists || snap.data()?.uid) throw new StaffEntryUnavailableError();
}

// Links a new staff account to its directory entry (claiming an existing one,
// or creating a new entry for someone who wasn't on the list), then points
// any students who already picked that entry at the new account.
export async function claimStaffEntry(
  db: Firestore,
  { directoryId, uid, name, role }: { directoryId?: string; uid: string; name: string; role: UserRole }
): Promise<string> {
  const ref = directoryId
    ? db.collection(STAFF_COLLECTION).doc(directoryId)
    : db.collection(STAFF_COLLECTION).doc();

  await db.runTransaction(async (tx) => {
    if (directoryId) {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.uid) throw new StaffEntryUnavailableError();
      tx.update(ref, { name, uid, role, claimedAt: FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, {
        name,
        uid,
        role,
        createdAt: FieldValue.serverTimestamp(),
        claimedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  if (directoryId) {
    try {
      await linkWaitingStudents(db, ref.id, uid, name);
    } catch (err) {
      // The account and claim succeeded; students can be re-linked by the
      // Lecturer re-selecting the supervisor, so don't fail the sign-up.
      console.error('Failed to link waiting students to', ref.id, err);
    }
  }
  return ref.id;
}

// Students who picked this directory entry before its owner signed up.
async function linkWaitingStudents(db: Firestore, entryId: string, uid: string, name: string): Promise<void> {
  const students = await db.collection('users').where('supervisorDirectoryId', '==', entryId).get();
  if (students.empty) return;

  const caseRefs = students.docs
    .map((d) => d.data().caseNumber)
    .filter((n): n is string => typeof n === 'string' && n.length > 0)
    .map((n) => db.collection('cases').doc(n));
  const caseSnaps = caseRefs.length ? await db.getAll(...caseRefs) : [];

  const batch = db.batch();
  for (const student of students.docs) {
    batch.update(student.ref, {
      assignedSupervisorUid: uid,
      assignedSupervisorName: name,
      supervisorDirectoryName: name,
    });
  }
  for (const snap of caseSnaps) {
    // Includes cases already submitted and waiting for this supervisor.
    if (snap.exists && snap.data()?.approvalStage !== 'approved') {
      batch.update(snap.ref, {
        supervisorUid: uid,
        supervisorName: name,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
}
