export type UserRole = 'student' | 'supervisor' | 'lecturer';

export type ApprovalStage = 'pending' | 'supervisor' | 'lecturer' | 'approved';

export type ThemeChoice = 'light' | 'dark' | 'flower' | 'pastel' | 'football' | 'mario';

export interface ThemeMarkers {
  pending: string;
  inProgress: string;
  completed: string;
  approved: string;
}

export interface ThemeConfig {
  name: string;
  emoji: string;
  navVariant: 'light' | 'dark';
  bgImage: string;
  bgOverlay: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headingColor: string;
  bodyText: string;
  mutedText: string;
  button: string;
  progressGradient: string;
  progressTrack: string;
  sectionCheckedBg: string;
  sectionCheckedBorder: string;
  sectionCheckedText: string;
  sectionUncheckedBg: string;
  sectionUncheckedBorder: string;
  checkboxActiveBg: string;
  checkboxActiveBorder: string;
  checkboxInactiveBg: string;
  checkboxInactiveBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  inputText: string;
  labelColor: string;
  selectBg: string;
  themeButtonActive: string;
  themeButtonInactive: string;
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
  customDeadline?: string;
  extensionReason?: string;
  updatedAt?: Date | null;
}

export type AccessLogAction = 'login' | 'view_cases' | 'approve' | 'reject' | 'revoke' | 'assign_supervisor';

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
