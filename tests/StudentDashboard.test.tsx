import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentDashboard from '@/components/StudentDashboard';
import { useAuth } from '@/lib/auth-context';
import * as db from '@/lib/firestore';
import type { CaseRecord, UserProfile } from '@/types';

vi.mock('@/lib/auth-context', () => ({ useAuth: vi.fn() }));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ themeMarkers: { pending: '○', completed: '●', approved: '★' }, activeQuote: 'Keep going' }),
}));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/SiteFooter', () => ({ default: () => null }));
vi.mock('@/components/ui/AvatarUpload', () => ({ default: () => null }));
vi.mock('@/lib/firestore', () => ({
  getCaseRecord: vi.fn(),
  getCasesForStudent: vi.fn(),
  saveCaseRecord: vi.fn(),
  submitCaseForReview: vi.fn(),
  resubmitCase: vi.fn(),
  updateUserProfile: vi.fn(),
  getStaffDirectory: vi.fn(),
  setSupervisorChoice: vi.fn(),
}));

const mocked = vi.mocked(db);
const refreshProfile = vi.fn();

const STAFF = [
  { id: 'd-a', name: 'Dr A', uid: 'sup-a' },
  { id: 'd-b', name: 'Dr B' },
];

function student(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'stu-1',
    name: 'Jane Student',
    email: 'jane@test.edu',
    role: 'student',
    supervisorDirectoryId: 'd-a',
    supervisorDirectoryName: 'Dr A',
    assignedSupervisorUid: 'sup-a',
    assignedSupervisorName: 'Dr A',
    ...overrides,
  };
}

function caseRecord(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    studentUid: 'stu-1',
    studentName: 'Jane Student',
    caseNumber: 'C1',
    startYear: 2025,
    classYear: 1,
    sections: { intro: true, caseReport: false, discussion: false, conclusion: false, references: false },
    greenLight: false,
    approvalStage: 'pending',
    supervisorUid: 'sup-a',
    supervisorName: 'Dr A',
    ...overrides,
  };
}

function signInAs(profile: UserProfile) {
  vi.mocked(useAuth).mockReturnValue({ user: { uid: profile.uid }, userProfile: profile, refreshProfile } as unknown as ReturnType<typeof useAuth>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getStaffDirectory.mockResolvedValue(STAFF);
  mocked.getCaseRecord.mockResolvedValue(null);
  mocked.getCasesForStudent.mockResolvedValue([]);
  mocked.saveCaseRecord.mockResolvedValue();
  mocked.updateUserProfile.mockResolvedValue();
  mocked.submitCaseForReview.mockResolvedValue();
  mocked.resubmitCase.mockResolvedValue();
  mocked.setSupervisorChoice.mockResolvedValue();
});

describe('StudentDashboard: first save', () => {
  it('creates a draft case stamped with the assigned supervisor, then sets the case number', async () => {
    signInAs(student());
    render(<StudentDashboard />);

    fireEvent.change(await screen.findByLabelText('Case number'), { target: { value: '  C1 ' } });
    fireEvent.click(screen.getByLabelText(/Introduction/));
    fireEvent.click(screen.getByText('Save progress'));

    await waitFor(() => expect(mocked.updateUserProfile).toHaveBeenCalled());
    expect(mocked.saveCaseRecord).toHaveBeenCalledWith('C1', expect.objectContaining({
      studentUid: 'stu-1',
      caseNumber: 'C1',
      greenLight: false,
      approvalStage: 'pending',
      supervisorUid: 'sup-a',
      supervisorName: 'Dr A',
      sections: expect.objectContaining({ intro: true }),
    }));
    expect(mocked.updateUserProfile).toHaveBeenCalledWith('stu-1', expect.objectContaining({ caseNumber: 'C1' }));
  });

  it('shows a save failure', async () => {
    signInAs(student());
    mocked.saveCaseRecord.mockRejectedValue(new Error('permission-denied'));
    render(<StudentDashboard />);

    fireEvent.change(await screen.findByLabelText('Case number'), { target: { value: 'C1' } });
    fireEvent.click(screen.getByText('Save progress'));

    expect(await screen.findByText('Couldn’t save: permission-denied')).toBeInTheDocument();
    expect(mocked.updateUserProfile).not.toHaveBeenCalled();
  });
});

describe('StudentDashboard: draft case', () => {
  it('submits for review and locks the supervisor pick', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(caseRecord());
    render(<StudentDashboard />);

    fireEvent.click(await screen.findByText('Submit for review →'));

    await waitFor(() => expect(mocked.submitCaseForReview).toHaveBeenCalledWith('C1'));
    expect(await screen.findByText('With your supervisor')).toBeInTheDocument();
    expect(screen.getByLabelText('Your supervisor')).toBeDisabled();
  });

  it('can’t submit without a supervisor', async () => {
    signInAs(student({ caseNumber: 'C1', supervisorDirectoryId: undefined, supervisorDirectoryName: undefined,
      assignedSupervisorUid: undefined, assignedSupervisorName: undefined }));
    mocked.getCaseRecord.mockResolvedValue(caseRecord({ supervisorUid: undefined, supervisorName: undefined }));
    render(<StudentDashboard />);

    expect(await screen.findByText('Submit for review →')).toBeDisabled();
    expect(screen.getByText('Choose your supervisor in your profile below before you submit.')).toBeInTheDocument();
  });

  it('changes supervisor from the staff directory', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(caseRecord());
    render(<StudentDashboard />);

    const select = await screen.findByLabelText('Your supervisor');
    await screen.findByRole('option', { name: 'Dr B' });
    fireEvent.change(select, { target: { value: 'd-b' } });

    await waitFor(() => expect(mocked.setSupervisorChoice).toHaveBeenCalledWith('stu-1', STAFF[1], 'C1'));
    expect(await screen.findByText('Supervisor set to Dr B')).toBeInTheDocument();
  });

  it('locks the case number once saved', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(caseRecord());
    render(<StudentDashboard />);

    expect(await screen.findByLabelText('Case number')).toBeDisabled();
  });
});

describe('StudentDashboard: after review', () => {
  it('shows the rejection and lets the student resubmit', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(caseRecord({
      approvalStage: 'supervisor',
      supervisorApproval: { approved: false, rejectionReason: 'Expand the discussion', rejectedAt: new Date(2026, 0, 1) },
    }));
    render(<StudentDashboard />);

    expect(await screen.findByText('“Expand the discussion”')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mark as ready for re-review'));

    await waitFor(() => expect(mocked.resubmitCase).toHaveBeenCalledWith('C1'));
    expect(await screen.findByText('Resubmitted for re-review')).toBeInTheDocument();
  });

  it('celebrates final approval', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(caseRecord({ approvalStage: 'approved', greenLight: true }));
    render(<StudentDashboard />);

    expect(await screen.findByText('Case approved 🎉')).toBeInTheDocument();
    expect(screen.queryByText('Submit for review →')).not.toBeInTheDocument();
  });
});

describe('StudentDashboard: several cases', () => {
  const approvedC1 = caseRecord({ approvalStage: 'approved', greenLight: true, lecturerApproval: { approved: true } });

  it('shows how many cases are approved, with earlier cases listed', async () => {
    signInAs(student({ caseNumber: 'C2' }));
    const current = caseRecord({ caseNumber: 'C2' });
    mocked.getCaseRecord.mockResolvedValue(current);
    mocked.getCasesForStudent.mockResolvedValue([approvedC1, current]);
    render(<StudentDashboard />);

    expect(await screen.findByTestId('approved-count')).toHaveTextContent('1 approved case');
    expect(screen.getByText('Your cases')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
  });

  it('starts the next case once the current one is approved', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(approvedC1);
    mocked.getCasesForStudent.mockResolvedValue([approvedC1]);
    render(<StudentDashboard />);

    fireEvent.click(await screen.findByText('Start your next case →'));
    const input = screen.getByLabelText('Case number');
    expect(input).toBeEnabled();
    expect(input).toHaveValue('');

    fireEvent.change(input, { target: { value: 'C2' } });
    fireEvent.click(screen.getByText('Save progress'));

    await waitFor(() => expect(mocked.updateUserProfile).toHaveBeenCalledWith('stu-1', expect.objectContaining({ caseNumber: 'C2' })));
    expect(mocked.saveCaseRecord).toHaveBeenCalledWith('C2', expect.objectContaining({
      caseNumber: 'C2', approvalStage: 'pending', greenLight: false, supervisorUid: 'sup-a',
      sections: expect.objectContaining({ intro: false }),
    }));
  });

  it('won’t reuse one of their own case numbers', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(approvedC1);
    mocked.getCasesForStudent.mockResolvedValue([approvedC1]);
    render(<StudentDashboard />);

    fireEvent.click(await screen.findByText('Start your next case →'));
    fireEvent.change(screen.getByLabelText('Case number'), { target: { value: 'C1' } });
    fireEvent.click(screen.getByText('Save progress'));

    expect(await screen.findByText('You’ve already used case number C1. Enter a new one.')).toBeInTheDocument();
    expect(mocked.saveCaseRecord).not.toHaveBeenCalled();
  });

  it('explains a case number that belongs to someone else', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(approvedC1);
    mocked.getCasesForStudent.mockResolvedValue([approvedC1]);
    mocked.saveCaseRecord.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }));
    render(<StudentDashboard />);

    fireEvent.click(await screen.findByText('Start your next case →'));
    fireEvent.change(screen.getByLabelText('Case number'), { target: { value: 'TAKEN' } });
    fireEvent.click(screen.getByText('Save progress'));

    expect(await screen.findByText('That case number is already in use. Check it and try again.')).toBeInTheDocument();
  });

  it('can cancel starting a new case', async () => {
    signInAs(student({ caseNumber: 'C1' }));
    mocked.getCaseRecord.mockResolvedValue(approvedC1);
    mocked.getCasesForStudent.mockResolvedValue([approvedC1]);
    render(<StudentDashboard />);

    fireEvent.click(await screen.findByText('Start your next case →'));
    fireEvent.click(screen.getByText('Cancel — back to my approved case'));

    expect(await screen.findByText('Start your next case →')).toBeInTheDocument();
    expect(screen.getByLabelText('Case number')).toHaveValue('C1');
  });
});
