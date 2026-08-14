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

  it('blocks the Lecturer when the assigned supervisor has not approved yet', () => {
    const rec = makeCase({ supervisorApproval: { approved: false } });
    render(<CaseTable cases={[rec]} isLecturer />);

    expect(screen.queryByText('✅ Grant Final Approval')).not.toBeInTheDocument();
    expect(screen.getByText('Waiting for approval')).toBeInTheDocument();
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
