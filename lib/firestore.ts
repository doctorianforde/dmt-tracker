import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getSafeDb } from './firebase';
import type { UserProfile, CaseRecord, ApprovalStage, SupervisorApproval, UserRole } from '@/types';

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
    supervisor1Approval: normalizeApproval(data.supervisor1Approval),
    supervisor2Approval: normalizeApproval(data.supervisor2Approval),
    drpaulApproval: normalizeApproval(data.drpaulApproval),
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
    approvalStage: 'supervisor1',
    updatedAt: serverTimestamp(),
  });
}

export async function approveCase(
  caseNumber: string,
  supervisorRole: 'supervisor1' | 'supervisor2' | 'drpaul',
  nextStage: ApprovalStage
): Promise<void> {
  const db = getSafeDb();
  const approvalKey = `${supervisorRole}Approval` as const;

  const updates: Record<string, unknown> = {
    [approvalKey]: {
      approved: true,
      approvedAt: serverTimestamp(),
    },
    approvalStage: nextStage,
    updatedAt: serverTimestamp(),
  };

  // Only Dr. Paul flips the final green light.
  if (supervisorRole === 'drpaul') {
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
  supervisorRole: 'supervisor1' | 'supervisor2' | 'drpaul',
  reason: string
): Promise<void> {
  const db = getSafeDb();
  const approvalKey = `${supervisorRole}Approval` as const;

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
    approvalStage: 'drpaul',
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
