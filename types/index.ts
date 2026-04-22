export type UserRole = 'student' | 'supervisor1' | 'supervisor2' | 'drpaul';

export type ApprovalStage = 'pending' | 'supervisor1' | 'supervisor2' | 'drpaul' | 'approved';

export type ThemeChoice = 'light' | 'dark' | 'feminine' | 'pastel' | 'sports';

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

export interface CaseRecord {
  studentUid: string;
  studentName: string;
  caseNumber: string;
  startYear: number;
  classYear: number;
  sections: CaseSections;
  submitted: boolean;
  documentLink?: string;
  greenLight: boolean;
  approvalStage?: ApprovalStage;
  supervisor1Name?: string;
  supervisor2Name?: string;
  customDeadline?: string;
  extensionReason?: string;
  updatedAt?: Date | null;
}
