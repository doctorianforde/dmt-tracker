export type UserRole = 'student' | 'supervisor1' | 'supervisor2' | 'drpaul';

export type ApprovalStage = 'pending' | 'supervisor1' | 'supervisor2' | 'drpaul' | 'approved';

export type ThemeChoice = 'light' | 'dark' | 'flower' | 'pastel' | 'sports' | 'mario';

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
