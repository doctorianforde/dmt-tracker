export type UserRole = 'student' | 'supervisor' | 'lecturer';

export type ApprovalStage = 'pending' | 'supervisor' | 'lecturer' | 'approved';

export type ThemeChoice = 'light' | 'dark' | 'flower' | 'pastel' | 'football' | 'mario';

export interface ThemeMarkers {
  pending: string;
  completed: string;
  approved: string;
}

// Theme colours, fonts and backgrounds live in app/globals.css under
// [data-theme="..."]; this is only the metadata the theme picker shows.
export interface ThemeConfig {
  name: string;
  emoji: string;
  tagline: string;
  // Three swatch colours for the picker preview: canvas, surface, accent.
  swatch: [string, string, string];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  caseNumber?: string;
  startYear?: number;
  classYear?: number;
  theme?: ThemeChoice;
  // Set only by the Lecturer, via the "Manage Students" panel.
  assignedSupervisorUid?: string;
  assignedSupervisorName?: string;
  // Submission deadline (YYYY-MM-DD). Set only by the Lecturer or the
  // student's assigned Supervisor — students can't move their own deadline.
  deadline?: string;
  deadlineSetByName?: string;
  // Small square JPEG as a data URL (resized client-side, ~10–20 KB).
  photoURL?: string;
}

export interface CaseSections {
  intro: boolean;
  caseReport: boolean;
  discussion: boolean;
  conclusion: boolean;
  references: boolean;
}

export interface SupervisorApproval {
  approved: boolean;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

export interface CaseRecord {
  studentUid: string;
  studentName: string;
  caseNumber: string;
  startYear: number;
  classYear: number;
  sections: CaseSections;
  greenLight: boolean;
  approvalStage?: ApprovalStage;
  supervisorUid?: string;
  supervisorName?: string;
  supervisorApproval?: SupervisorApproval;
  lecturerApproval?: SupervisorApproval;
  // Legacy: deadlines used to be set by students on the case. New deadlines
  // live on the student's UserProfile; this is only read as a fallback.
  customDeadline?: string;
  extensionReason?: string;
  // Set when the student marks a rejected case as ready for re-review.
  resubmittedAt?: Date | null;
  updatedAt?: Date | null;
}

export type AccessLogAction = 'login' | 'view_cases' | 'approve' | 'reject' | 'revoke' | 'assign_supervisor' | 'set_deadline';

export interface AccessLogEntry {
  id?: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: AccessLogAction;
  targetId?: string;
  targetLabel?: string;
  createdAt?: Date | null;
}
