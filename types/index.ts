export type UserRole = 'student' | 'supervisor' | 'drpaul';

export type ApprovalStage = 'pending' | 'supervisor1' | 'supervisor2' | 'drpaul' | 'approved';

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
  supervisor1Uid?: string;
  supervisor1Name?: string;
  supervisor2Uid?: string;
  supervisor2Name?: string;
  supervisor1Approval?: SupervisorApproval;
  supervisor2Approval?: SupervisorApproval;
  drpaulApproval?: SupervisorApproval;
  customDeadline?: string;
  extensionReason?: string;
  updatedAt?: Date | null;
}
