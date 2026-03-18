import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, CaseRecord } from '@/types';

// ── User Profiles ──────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const { uid, ...data } = profile;
  await setDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>);
}

// ── Case Records ────────────────────────────────────────────────────────────

export async function getCaseRecord(caseNumber: string): Promise<CaseRecord | null> {
  const snap = await getDoc(doc(db, 'cases', caseNumber));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, updatedAt: data.updatedAt?.toDate() ?? null } as CaseRecord;
}

export async function saveCaseRecord(
  caseNumber: string,
  data: Partial<CaseRecord>
): Promise<void> {
  await setDoc(
    doc(db, 'cases', caseNumber),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function updateGreenLight(caseNumber: string, value: boolean): Promise<void> {
  await updateDoc(doc(db, 'cases', caseNumber), {
    greenLight: value,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllCases(): Promise<CaseRecord[]> {
  const snap = await getDocs(collection(db, 'cases'));
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, updatedAt: data.updatedAt?.toDate() ?? null } as CaseRecord;
  });
}
