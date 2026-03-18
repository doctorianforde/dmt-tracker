export type UserRole = 'student' | 'supervisor1' | 'supervisor2' | 'drpaul';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  caseNumber?: string;
  startYear?: number;
  classYear?: number;
}

export interface CaseSections {
  intro: boolean;
  caseReport: boolean;
  discussion: boolean;
  conclusion: boolean;
}

export interface CaseRecord {
  studentUid: string;
  studentName: string;
  caseNumber: string;
  startYear: number;
  classYear: number;
  sections: CaseSections;
  submitted: boolean;
  documentLink?: string;   // Google Drive / OneDrive / Dropbox share link
  greenLight: boolean;
  updatedAt?: Date | null;
}
