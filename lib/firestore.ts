import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getSafeDb } from './firebase';
import type {
  UserProfile,
  CaseRecord,
  ApprovalStage,
  SupervisorApproval,
  UserRole,
  AccessLogEntry,
} from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return null;
}

function normalizeApproval(value: unknown): SupervisorApproval | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const a = value as DocumentData;
  return {
    approved: Boolean(a.approved),
    approvedAt: toDate(a.approvedAt) ?? undefined,
    rejectedAt: toDate(a.rejectedAt) ?? undefined,
    rejectionReason: a.rejectionReason ?? undefined,
    notes: a.notes ?? undefined,
  };
}

function normalizeCaseRecord(data: DocumentData): CaseRecord {
  return {
    ...data,
    updatedAt: toDate(data.updatedAt),
    supervisorApproval: normalizeApproval(data.supervisorApproval),
    lecturerApproval: normalizeApproval(data.lecturerApproval),
  } as CaseRecord;
}

// ── User Profiles ──────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getSafeDb();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const db = getSafeDb();
  const { uid, ...data } = profile;
  await setDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const db = getSafeDb();
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>);
}

export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const db = getSafeDb();
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
    .filter((u) => u.role === role)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Lecturer-only: assign or reassign a student's supervisor. Keeps the case
// record's denormalized supervisorUid/Name in sync if the student already
// has a case on file.
export async function assignSupervisor(
  studentUid: string,
  supervisorUid: string,
  supervisorName: string,
  caseNumber?: string
): Promise<void> {
  const db = getSafeDb();
  await updateUserProfile(studentUid, {
    assignedSupervisorUid: supervisorUid,
    assignedSupervisorName: supervisorName,
  });
  if (caseNumber) {
    await updateDoc(doc(db, 'cases', caseNumber), {
      supervisorUid,
      supervisorName,
      updatedAt: serverTimestamp(),
    });
  }
}

// ── Case Records ────────────────────────────────────────────────────────────

export async function getCaseRecord(caseNumber: string): Promise<CaseRecord | null> {
  const db = getSafeDb();
  const snap = await getDoc(doc(db, 'cases', caseNumber));
  if (!snap.exists()) return null;
  return normalizeCaseRecord(snap.data());
}

export async function saveCaseRecord(
  caseNumber: string,
  data: Partial<CaseRecord>
): Promise<void> {
  const db = getSafeDb();
  await setDoc(
    doc(db, 'cases', caseNumber),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function submitCaseForReview(caseNumber: string): Promise<void> {
  const db = getSafeDb();
  await updateDoc(doc(db, 'cases', caseNumber), {
    approvalStage: 'supervisor',
    updatedAt: serverTimestamp(),
  });
}

export async function approveCase(
  caseNumber: string,
  reviewerRole: 'supervisor' | 'lecturer',
  nextStage: ApprovalStage
): Promise<void> {
  const db = getSafeDb();
  const approvalKey = `${reviewerRole}Approval` as const;

  const updates: Record<string, unknown> = {
    [approvalKey]: {
      approved: true,
      approvedAt: serverTimestamp(),
    },
    approvalStage: nextStage,
    updatedAt: serverTimestamp(),
  };

  // Only the Lecturer flips the final green light.
  if (reviewerRole === 'lecturer') {
    updates.greenLight = nextStage === 'approved';
  }

  await updateDoc(doc(db, 'cases', caseNumber), updates);
}

// Rejection intentionally leaves approvalStage untouched: the case stays at the
// rejecting reviewer's stage (with approved: false) so they can re-approve directly
// once the student addresses the feedback, instead of requiring a full resubmission
// that would re-route past reviewers whose approvals are still recorded as true.
export async function rejectCase(
  caseNumber: string,
  reviewerRole: 'supervisor' | 'lecturer',
  reason: string
): Promise<void> {
  const db = getSafeDb();
  const approvalKey = `${reviewerRole}Approval` as const;

  await updateDoc(doc(db, 'cases', caseNumber), {
    [approvalKey]: {
      approved: false,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function revokeApproval(caseNumber: string): Promise<void> {
  const db = getSafeDb();
  await updateDoc(doc(db, 'cases', caseNumber), {
    greenLight: false,
    approvalStage: 'lecturer',
    updatedAt: serverTimestamp(),
  });
}

export async function getAllCases(): Promise<CaseRecord[]> {
  const db = getSafeDb();
  const snap = await getDocs(collection(db, 'cases'));
  return snap.docs
    .map((d) => normalizeCaseRecord(d.data()))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export async function getCasesForSupervisor(uid: string): Promise<CaseRecord[]> {
  const db = getSafeDb();
  const snap = await getDocs(query(collection(db, 'cases'), where('supervisorUid', '==', uid)));
  return snap.docs
    .map((d) => normalizeCaseRecord(d.data()))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

// ── Access Log ───────────────────────────────────────────────────────────
// Client-attributed audit trail: every entry is written by the actor whose
// action it records (enforced in firestore.rules — actorUid must match the
// writer's own uid). This is enough to catch accidental/curious access, but
// isn't tamper-proof against a user who edits the client to skip logging —
// a server-enforced log would need a Cloud Function, which is out of scope
// here. Only the Lecturer can read this collection.

export async function logAccess(entry: Omit<AccessLogEntry, 'id' | 'createdAt'>): Promise<void> {
  const db = getSafeDb();
  try {
    await addDoc(collection(db, 'accessLogs'), { ...entry, createdAt: serverTimestamp() });
  } catch (err) {
    // Logging must never block the action it's describing.
    console.error('Failed to write access log:', err);
  }
}

export async function getAccessLogs(max = 200): Promise<AccessLogEntry[]> {
  const db = getSafeDb();
  const snap = await getDocs(
    query(collection(db, 'accessLogs'), orderBy('createdAt', 'desc'), limit(max))
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: toDate(d.data().createdAt),
  }) as AccessLogEntry);
}
