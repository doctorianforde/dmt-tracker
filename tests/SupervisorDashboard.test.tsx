import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SupervisorDashboard from '@/components/SupervisorDashboard';
import { useAuth } from '@/lib/auth-context';
import * as db from '@/lib/firestore';
import type { CaseRecord, UserProfile } from '@/types';

vi.mock('@/lib/auth-context', () => ({ useAuth: vi.fn() }));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/SiteFooter', () => ({ default: () => null }));
vi.mock('@/lib/api-client', () => ({ getUnassignedStudents: vi.fn(), updateMyStudents: vi.fn() }));
vi.mock('@/lib/firestore', () => ({
  getAllCases: vi.fn(),
  getCasesForSupervisor: vi.fn(),
  getUsersByRole: vi.fn(),
  getStudentsForSupervisor: vi.fn(),
  getStaffDirectory: vi.fn(),
  setSupervisorChoice: vi.fn(),
  setStudentDeadline: vi.fn(),
  approveCase: vi.fn(),
  rejectCase: vi.fn(),
  revokeApproval: vi.fn(),
  logAccess: vi.fn(),
  getAccessLogs: vi.fn(),
}));

const mocked = vi.mocked(db);

const SUPERVISOR: UserProfile = { uid: 'sup-a', name: 'Dr A', email: 'a@test.edu', role: 'supervisor' };
const LECTURER: UserProfile = { uid: 'lect', name: 'Dr L', email: 'l@test.edu', role: 'lecturer' };
const STUDENT: UserProfile = {
  uid: 'stu-1', name: 'Jane Student', email: 'jane@test.edu', role: 'student', caseNumber: 'C1',
  supervisorDirectoryId: 'd-a', supervisorDirectoryName: 'Dr A', assignedSupervisorUid: 'sup-a', assignedSupervisorName: 'Dr A',
};
const STAFF = [
  { id: 'd-a', name: 'Dr A', uid: 'sup-a' },
  { id: 'd-b', name: 'Dr B', uid: 'sup-b' },
];

function caseRecord(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    studentUid: 'stu-1',
    studentName: 'Jane Student',
    caseNumber: 'C1',
    startYear: 2025,
    classYear: 1,
    sections: { intro: true, caseReport: true, discussion: true, conclusion: true, references: true },
    greenLight: false,
    approvalStage: 'supervisor',
    supervisorUid: 'sup-a',
    supervisorName: 'Dr A',
    ...overrides,
  };
}

function signInAs(profile: UserProfile) {
  vi.mocked(useAuth).mockReturnValue({ userProfile: profile } as unknown as ReturnType<typeof useAuth>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getStudentsForSupervisor.mockResolvedValue([STUDENT]);
  mocked.getUsersByRole.mockResolvedValue([STUDENT]);
  mocked.getStaffDirectory.mockResolvedValue(STAFF);
  mocked.getAccessLogs.mockResolvedValue([]);
  mocked.approveCase.mockResolvedValue();
  mocked.rejectCase.mockResolvedValue();
  mocked.revokeApproval.mockResolvedValue();
  mocked.setSupervisorChoice.mockResolvedValue();
  mocked.logAccess.mockResolvedValue();
});

describe('SupervisorDashboard: supervisor', () => {
  beforeEach(() => signInAs(SUPERVISOR));

  it('loads only their own students and cases, and logs the view', async () => {
    mocked.getCasesForSupervisor.mockResolvedValue([caseRecord()]);
    render(<SupervisorDashboard />);

    expect(await screen.findByText('✅ Approve & Send to Lecturer')).toBeInTheDocument();
    expect(mocked.getCasesForSupervisor).toHaveBeenCalledWith('sup-a');
    expect(mocked.getStudentsForSupervisor).toHaveBeenCalledWith('sup-a');
    expect(mocked.getAllCases).not.toHaveBeenCalled();
    expect(mocked.logAccess).toHaveBeenCalledWith(expect.objectContaining({ action: 'view_cases', actorRole: 'supervisor' }));
    expect(screen.queryByText('Access log')).not.toBeInTheDocument();
  });

  it('approves a case, sending it to the Lecturer', async () => {
    mocked.getCasesForSupervisor.mockResolvedValue([caseRecord()]);
    render(<SupervisorDashboard />);

    fireEvent.click(await screen.findByText('✅ Approve & Send to Lecturer'));

    await waitFor(() => expect(mocked.approveCase).toHaveBeenCalledWith('C1', 'supervisor', 'lecturer'));
    expect(mocked.logAccess).toHaveBeenCalledWith(expect.objectContaining({ action: 'approve', targetId: 'C1' }));
    await waitFor(() => expect(screen.queryByText('✅ Approve & Send to Lecturer')).not.toBeInTheDocument());
  });

  it('rejects a case with a reason', async () => {
    mocked.getCasesForSupervisor.mockResolvedValue([caseRecord()]);
    render(<SupervisorDashboard />);

    fireEvent.click(await screen.findByText('Reject'));
    fireEvent.change(screen.getByPlaceholderText(/reason/i), { target: { value: 'More detail please' } });
    fireEvent.click(screen.getByText(/Confirm/));

    await waitFor(() => expect(mocked.rejectCase).toHaveBeenCalledWith('C1', 'supervisor', 'More detail please'));
    expect(mocked.logAccess).toHaveBeenCalledWith(expect.objectContaining({ action: 'reject' }));
  });

  it('shows an error when an action fails', async () => {
    mocked.getCasesForSupervisor.mockResolvedValue([caseRecord()]);
    mocked.approveCase.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    render(<SupervisorDashboard />);

    fireEvent.click(await screen.findByText('✅ Approve & Send to Lecturer'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t approve this case: Missing or insufficient permissions.');
    expect(mocked.logAccess).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'approve' }));
  });
});

describe('SupervisorDashboard: lecturer', () => {
  beforeEach(() => signInAs(LECTURER));

  it('grants final approval once the supervisor has approved', async () => {
    mocked.getAllCases.mockResolvedValue([caseRecord({ approvalStage: 'lecturer', supervisorApproval: { approved: true } })]);
    render(<SupervisorDashboard />);

    fireEvent.click(await screen.findByText('✅ Grant Final Approval'));

    await waitFor(() => expect(mocked.approveCase).toHaveBeenCalledWith('C1', 'lecturer', 'approved'));
  });

  it('can approve again after revoking an approval', async () => {
    mocked.getAllCases.mockResolvedValue([caseRecord({
      approvalStage: 'approved', greenLight: true,
      supervisorApproval: { approved: true }, lecturerApproval: { approved: true },
    })]);
    render(<SupervisorDashboard />);

    fireEvent.click(await screen.findByText('Revoke'));

    await waitFor(() => expect(mocked.revokeApproval).toHaveBeenCalledWith('C1'));
    expect(await screen.findByText('✅ Grant Final Approval')).toBeInTheDocument();
  });

  it('reassigns a student to another supervisor', async () => {
    mocked.getAllCases.mockResolvedValue([caseRecord()]);
    render(<SupervisorDashboard />);

    const select = await screen.findByLabelText('Supervisor for Jane Student');
    await within(select).findByRole('option', { name: 'Dr B' });
    fireEvent.change(select, { target: { value: 'd-b' } });

    await waitFor(() => expect(mocked.setSupervisorChoice).toHaveBeenCalledWith('stu-1', STAFF[1], 'C1'));
    expect(mocked.logAccess).toHaveBeenCalledWith(expect.objectContaining({ action: 'assign_supervisor', targetLabel: 'Jane Student → Dr B' }));
  });

  it('sees the access log', async () => {
    mocked.getAllCases.mockResolvedValue([]);
    mocked.getAccessLogs.mockResolvedValue([
      { id: '1', actorUid: 'sup-a', actorName: 'Dr A', actorRole: 'supervisor', action: 'approve', targetLabel: 'Jane Student (C1)', createdAt: new Date() },
    ]);
    render(<SupervisorDashboard />);

    expect(await screen.findByText('Access log')).toBeInTheDocument();
    expect(await screen.findByText('Approved case')).toBeInTheDocument();
    expect(screen.getByText('Jane Student (C1)')).toBeInTheDocument();
  });
});
