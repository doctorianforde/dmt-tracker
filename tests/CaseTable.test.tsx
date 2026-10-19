import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseTable from '@/components/CaseTable';
import type { CaseRecord } from '@/types';

function makeCase(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    studentUid: 'student-1',
    studentName: 'Jane Student',
    caseNumber: 'DMT-2024-001',
    startYear: 2024,
    classYear: 2,
    sections: {
      intro: true,
      caseReport: true,
      discussion: true,
      conclusion: true,
      references: true,
    },
    greenLight: false,
    approvalStage: 'lecturer',
    supervisorUid: 'sup-1',
    supervisorName: 'Dr. Sally',
    supervisorApproval: { approved: true },
    ...overrides,
  };
}

describe('CaseTable approval routing', () => {
  it('lets the Lecturer grant final approval once the assigned supervisor has approved', () => {
    const rec = makeCase();
    render(<CaseTable cases={[rec]} isLecturer />);

    expect(screen.getByText('✅ Grant Final Approval')).toBeInTheDocument();
  });

  it('lets the Lecturer grant final approval to a case still at the supervisor stage', () => {
    const rec = makeCase({ approvalStage: 'supervisor', supervisorUid: 'sup-1', supervisorApproval: undefined });
    const onApprove = vi.fn();
    render(<CaseTable cases={[rec]} isLecturer currentUid="lect-1" onApprove={onApprove} />);

    expect(screen.queryByText('✅ Approve & Send to Lecturer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('✅ Grant Final Approval'));
    expect(onApprove).toHaveBeenCalledWith('DMT-2024-001', 'lecturer', 'approved');
  });

  it('gives the Lecturer final approval directly on cases where they are the chosen supervisor', () => {
    const rec = makeCase({ approvalStage: 'supervisor', supervisorUid: 'lect-1', supervisorApproval: { approved: false } });
    const onApprove = vi.fn();
    render(<CaseTable cases={[rec]} isLecturer currentUid="lect-1" onApprove={onApprove} />);

    fireEvent.click(screen.getByText('✅ Grant Final Approval'));
    expect(onApprove).toHaveBeenCalledWith('DMT-2024-001', 'lecturer', 'approved');
  });

  it('offers no approval on a draft, and says it is a draft', () => {
    const rec = makeCase({ approvalStage: 'pending', supervisorApproval: undefined });
    render(<CaseTable cases={[rec]} isLecturer />);

    expect(screen.queryByText('✅ Grant Final Approval')).not.toBeInTheDocument();
    expect(screen.getByText('Draft — not submitted yet')).toBeInTheDocument();
  });

  it('shows no approval once the Lecturer has approved', () => {
    const rec = makeCase({ approvalStage: 'approved', greenLight: true, lecturerApproval: { approved: true } });
    render(<CaseTable cases={[rec]} isLecturer />);

    expect(screen.queryByText('✅ Grant Final Approval')).not.toBeInTheDocument();
  });

  it('lets the assigned supervisor approve and advance to the Lecturer stage', () => {
    const rec = makeCase({ approvalStage: 'supervisor', supervisorApproval: { approved: false } });
    render(<CaseTable cases={[rec]} isSupervisor />);

    expect(screen.getByText('✅ Approve & Send to Lecturer')).toBeInTheDocument();
  });
});

describe('CaseTable reject flow', () => {
  it('submits a rejection reason for the assigned supervisor and stage', () => {
    const onReject = vi.fn();
    const rec = makeCase({
      approvalStage: 'supervisor',
      supervisorApproval: { approved: false },
    });
    render(
      <CaseTable
        cases={[rec]}
        isSupervisor
        onReject={onReject}
      />
    );

    fireEvent.click(screen.getByText('Reject'));
    fireEvent.change(screen.getByPlaceholderText('Reason for rejection...'), {
      target: { value: 'Please expand the discussion section.' },
    });
    fireEvent.click(screen.getByText('Confirm'));

    expect(onReject).toHaveBeenCalledWith(
      'DMT-2024-001',
      'supervisor',
      'Please expand the discussion section.'
    );
  });

  it('disables Confirm until a reason is entered', () => {
    const rec = makeCase({
      approvalStage: 'supervisor',
      supervisorApproval: { approved: false },
    });
    render(<CaseTable cases={[rec]} isSupervisor />);

    fireEvent.click(screen.getByText('Reject'));
    expect(screen.getByText('Confirm')).toBeDisabled();
  });
});
