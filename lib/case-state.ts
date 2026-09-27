import type { ApprovalStage, CaseRecord, CaseSections, StaffDirectoryEntry, SupervisorApproval, UserProfile } from '@/types';
import { daysUntil } from '@/lib/deadlines';

// Pure helpers for the dashboards: they mirror in local state what a
// Firestore write (lib/firestore.ts) just did, and derive what to show.

export type ReviewerRole = 'supervisor' | 'lecturer';

export const SECTION_KEYS: (keyof CaseSections)[] = ['intro', 'caseReport', 'discussion', 'conclusion', 'references'];

export const DEFAULT_SECTIONS: CaseSections = {
  intro: false,
  caseReport: false,
  discussion: false,
  conclusion: false,
  references: false,
};

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

export function stageOf(record: CaseRecord): ApprovalStage {
  return record.approvalStage ?? (record.greenLight ? 'approved' : 'pending');
}

function approvalKey(role: ReviewerRole): 'supervisorApproval' | 'lecturerApproval' {
  return role === 'supervisor' ? 'supervisorApproval' : 'lecturerApproval';
}

function updateCase(cases: CaseRecord[], caseNumber: string, change: (c: CaseRecord) => CaseRecord): CaseRecord[] {
  return cases.map((c) => (c.caseNumber === caseNumber ? change(c) : c));
}

// ── Staff-side case updates (see approveCase / rejectCase / revokeApproval) ──

export function withApproval(cases: CaseRecord[], caseNumber: string, role: ReviewerRole, nextStage: ApprovalStage): CaseRecord[] {
  return updateCase(cases, caseNumber, (c) => ({
    ...c,
    approvalStage: nextStage,
    greenLight: nextStage === 'approved',
    [approvalKey(role)]: { approved: true, approvedAt: new Date() },
  }));
}

export function withRejection(cases: CaseRecord[], caseNumber: string, role: ReviewerRole, reason: string): CaseRecord[] {
  return updateCase(cases, caseNumber, (c) => ({
    ...c,
    [approvalKey(role)]: { approved: false, rejectionReason: reason, rejectedAt: new Date() },
  }));
}

// Back to the Lecturer's stage with their approval cleared, so they can
// approve or reject it again.
export function withRevoke(cases: CaseRecord[], caseNumber: string): CaseRecord[] {
  return updateCase(cases, caseNumber, (c) => ({
    ...c,
    greenLight: false,
    approvalStage: 'lecturer',
    lecturerApproval: undefined,
  }));
}

// A student's supervisor picked from the staff directory (null clears it).
// The account uid/name are only set once that person has signed up.
export function supervisorFields(entry: StaffDirectoryEntry | null) {
  return {
    supervisorDirectoryId: entry?.id,
    supervisorDirectoryName: entry?.name,
    assignedSupervisorUid: entry?.uid,
    assignedSupervisorName: entry?.uid ? entry.name : undefined,
  };
}

export function withStudentSupervisor(students: UserProfile[], studentUid: string, entry: StaffDirectoryEntry | null): UserProfile[] {
  const fields = supervisorFields(entry);
  return students.map((s) => (s.uid === studentUid ? { ...s, ...fields } : s));
}

// The case record carries a denormalized copy of the supervisor's account.
export function withCaseSupervisor(cases: CaseRecord[], caseNumber: string, entry: StaffDirectoryEntry | null): CaseRecord[] {
  const { assignedSupervisorUid, assignedSupervisorName } = supervisorFields(entry);
  return updateCase(cases, caseNumber, (c) => ({ ...c, supervisorUid: assignedSupervisorUid, supervisorName: assignedSupervisorName }));
}

export function withDeadline(students: UserProfile[], studentUid: string, deadline: string | null, setByName: string): UserProfile[] {
  return students.map((s) =>
    s.uid === studentUid
      ? { ...s, deadline: deadline ?? undefined, deadlineSetByName: deadline ? setByName : undefined }
      : s
  );
}

// ── Dashboard stats ──────────────────────────────────────────────────────

export function deadlineCounts(deadlines: (string | undefined)[], windowDays: number, now = Date.now()) {
  let dueSoon = 0;
  let overdue = 0;
  for (const d of deadlines) {
    if (!d) continue;
    const days = daysUntil(d, now);
    if (days < 0) overdue++;
    else if (days <= windowDays) dueSoon++;
  }
  return { dueSoon, overdue };
}

// ── Student view of their own case ────────────────────────────────────────

export interface ReviewFeedback {
  stage: ApprovalStage;
  // The current reviewer's reason, while their rejection stands.
  rejectionReason?: string;
  // The student has flagged the case as fixed since that rejection.
  resubmitted: boolean;
}

export function reviewFeedback(record: CaseRecord | null): ReviewFeedback {
  if (!record) return { stage: 'pending', resubmitted: false };
  const stage = stageOf(record);
  const approval: SupervisorApproval | undefined =
    stage === 'supervisor' ? record.supervisorApproval
    : stage === 'lecturer' ? record.lecturerApproval
    : undefined;
  const rejectionReason = approval && !approval.approved ? approval.rejectionReason : undefined;
  const resubmittedAt = record.resubmittedAt;
  const resubmitted =
    !!rejectionReason && !!resubmittedAt &&
    (!approval?.rejectedAt || resubmittedAt.getTime() > approval.rejectedAt.getTime());
  return { stage, rejectionReason, resubmitted };
}

// A stable string of the student's editable form fields, for unsaved-change
// detection.
export function formSnapshot(f: {
  caseNumber: string;
  startYear: number;
  classYear: number;
  sections: CaseSections;
  extensionReason: string;
}): string {
  return JSON.stringify([
    f.caseNumber.trim(),
    f.startYear,
    f.classYear,
    SECTION_KEYS.map((k) => Boolean(f.sections[k])),
    f.extensionReason.trim(),
  ]);
}
