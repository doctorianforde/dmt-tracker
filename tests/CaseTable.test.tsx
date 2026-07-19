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
    approvalStage: 'drpaul',
    supervisor1Uid: 'sup-1',
    supervisor1Name: 'Dr. Sally',
    supervisor1Approval: { approved: true },
    ...overrides,
  };
}

describe('CaseTable approval routing', () => {
  it('lets Dr. Paul grant final approval when only one supervisor was assigned', () => {
    // Regression test: a case with no Supervisor 2 must not require a
    // supervisor2Approval that can never exist.
    const rec = makeCase();
    render(<CaseTable cases={[rec]} isDrPaul supervisorUid="drpaul-1" />);

    expect(screen.getByText('✅ Grant Final Approval')).toBeInTheDocument();
  });

  it('still blocks Dr. Paul when a second supervisor is assigned but has not approved', () => {
    const rec = makeCase({
      supervisor2Uid: 'sup-2',
      supervisor2Name: 'Dr. Kyle',
      supervisor2Approval: { approved: false },
    });
    render(<CaseTable cases={[rec]} isDrPaul supervisorUid="drpaul-1" />);

    expect(screen.queryByText('✅ Grant Final Approval')).not.toBeInTheDocument();
    expect(screen.getByText('Waiting for approval')).toBeInTheDocument();
  });

  it('lets Dr. Paul approve once both assigned supervisors have approved', () => {
    const rec = makeCase({
      supervisor2Uid: 'sup-2',
      supervisor2Name: 'Dr. Kyle',
      supervisor2Approval: { approved: true },
    });
    render(<CaseTable cases={[rec]} isDrPaul supervisorUid="drpaul-1" />);

    expect(screen.getByText('✅ Grant Final Approval')).toBeInTheDocument();
  });
});

describe('CaseTable reject flow', () => {
  it('submits a rejection reason for the assigned supervisor and stage', () => {
    const onReject = vi.fn();
    const rec = makeCase({
      approvalStage: 'supervisor1',
      supervisor1Approval: { approved: false },
    });
    render(
      <CaseTable
        cases={[rec]}
        isSupervisor
        supervisorUid="sup-1"
        supervisorName="Dr. Sally"
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
      'supervisor1',
      'Please expand the discussion section.'
    );
  });

  it('disables Confirm until a reason is entered', () => {
    const rec = makeCase({
      approvalStage: 'supervisor1',
      supervisor1Approval: { approved: false },
    });
    render(<CaseTable cases={[rec]} isSupervisor supervisorUid="sup-1" supervisorName="Dr. Sally" />);

    fireEvent.click(screen.getByText('Reject'));
    expect(screen.getByText('Confirm')).toBeDisabled();
  });
});
