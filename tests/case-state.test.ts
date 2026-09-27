import { describe, it, expect } from 'vitest';
import {
  deadlineCounts,
  formSnapshot,
  reviewFeedback,
  stageOf,
  withApproval,
  withCaseSupervisor,
  withDeadline,
  withRejection,
  withRevoke,
  withStudentSupervisor,
  DEFAULT_SECTIONS,
} from '@/lib/case-state';
import { toISODate } from '@/lib/deadlines';
import type { CaseRecord, UserProfile } from '@/types';

function makeCase(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    studentUid: 'student-1',
    studentName: 'Jane Student',
    caseNumber: 'C1',
    startYear: 2024,
    classYear: 2,
    sections: DEFAULT_SECTIONS,
    greenLight: false,
    approvalStage: 'supervisor',
    supervisorUid: 'sup-1',
    ...overrides,
  };
}

const other = makeCase({ caseNumber: 'C2', studentUid: 'student-2' });

describe('stageOf', () => {
  it('falls back for cases saved before approvalStage existed', () => {
    expect(stageOf(makeCase({ approvalStage: undefined }))).toBe('pending');
    expect(stageOf(makeCase({ approvalStage: undefined, greenLight: true }))).toBe('approved');
  });
});

describe('staff case updates', () => {
  it('a supervisor approval moves the case on without the green light', () => {
    const [c, untouched] = withApproval([makeCase(), other], 'C1', 'supervisor', 'lecturer');
    expect(c.approvalStage).toBe('lecturer');
    expect(c.greenLight).toBe(false);
    expect(c.supervisorApproval?.approved).toBe(true);
    expect(untouched).toBe(other);
  });

  it('final approval turns on the green light', () => {
    const [c] = withApproval([makeCase({ approvalStage: 'lecturer' })], 'C1', 'lecturer', 'approved');
    expect(c.greenLight).toBe(true);
    expect(c.lecturerApproval?.approved).toBe(true);
  });

  it('a rejection keeps the stage and records the reason', () => {
    const [c] = withRejection([makeCase()], 'C1', 'supervisor', 'Needs references');
    expect(c.approvalStage).toBe('supervisor');
    expect(c.supervisorApproval).toMatchObject({ approved: false, rejectionReason: 'Needs references' });
  });

  it('revoking clears the Lecturer’s approval so they can act again', () => {
    const approved = makeCase({ approvalStage: 'approved', greenLight: true, lecturerApproval: { approved: true } });
    const [c] = withRevoke([approved], 'C1');
    expect(c.approvalStage).toBe('lecturer');
    expect(c.greenLight).toBe(false);
    expect(c.lecturerApproval).toBeUndefined();
  });
});

describe('supervisor choice', () => {
  const student: UserProfile = { uid: 'student-1', name: 'Jane', email: 'j@x', role: 'student', caseNumber: 'C1' };

  it('links a signed-up supervisor to the student and their case', () => {
    const entry = { id: 'd1', name: 'Dr A', uid: 'sup-a' };
    const [s] = withStudentSupervisor([student], 'student-1', entry);
    expect(s).toMatchObject({ supervisorDirectoryId: 'd1', supervisorDirectoryName: 'Dr A', assignedSupervisorUid: 'sup-a', assignedSupervisorName: 'Dr A' });
    const [c] = withCaseSupervisor([makeCase()], 'C1', entry);
    expect(c).toMatchObject({ supervisorUid: 'sup-a', supervisorName: 'Dr A' });
  });

  it('records the pick but no account for someone not signed up yet', () => {
    const entry = { id: 'd2', name: 'Dr B' };
    const [s] = withStudentSupervisor([student], 'student-1', entry);
    expect(s.supervisorDirectoryName).toBe('Dr B');
    expect(s.assignedSupervisorUid).toBeUndefined();
    expect(s.assignedSupervisorName).toBeUndefined();
    const [c] = withCaseSupervisor([makeCase()], 'C1', entry);
    expect(c.supervisorUid).toBeUndefined();
  });

  it('clears the supervisor', () => {
    const [s] = withStudentSupervisor([{ ...student, supervisorDirectoryId: 'd1', assignedSupervisorUid: 'sup-a' }], 'student-1', null);
    expect(s.supervisorDirectoryId).toBeUndefined();
    expect(s.assignedSupervisorUid).toBeUndefined();
  });
});

describe('deadlines', () => {
  const student: UserProfile = { uid: 's', name: 'S', email: 's@x', role: 'student' };

  it('sets and clears a deadline with who set it', () => {
    const [set] = withDeadline([student], 's', '2030-01-01', 'Dr A');
    expect(set).toMatchObject({ deadline: '2030-01-01', deadlineSetByName: 'Dr A' });
    const [cleared] = withDeadline([set], 's', null, 'Dr A');
    expect(cleared.deadline).toBeUndefined();
    expect(cleared.deadlineSetByName).toBeUndefined();
  });

  it('counts deadlines due soon and overdue', () => {
    const now = new Date(2026, 0, 10).getTime();
    const day = (offset: number) => toISODate(new Date(2026, 0, 10 + offset));
    expect(deadlineCounts([day(-1), day(0), day(5), day(40), undefined], 30, now)).toEqual({ dueSoon: 2, overdue: 1 });
  });
});

describe('reviewFeedback', () => {
  it('is a draft with no case yet', () => {
    expect(reviewFeedback(null)).toEqual({ stage: 'pending', resubmitted: false });
  });

  it('shows the current reviewer’s rejection', () => {
    const rec = makeCase({ supervisorApproval: { approved: false, rejectionReason: 'Fix intro', rejectedAt: new Date(2026, 0, 1) } });
    expect(reviewFeedback(rec)).toEqual({ stage: 'supervisor', rejectionReason: 'Fix intro', resubmitted: false });
  });

  it('notices a resubmission after the rejection, but not one from before it', () => {
    const rejectedAt = new Date(2026, 0, 5);
    const rejected = { approved: false, rejectionReason: 'Fix intro', rejectedAt };
    expect(reviewFeedback(makeCase({ supervisorApproval: rejected, resubmittedAt: new Date(2026, 0, 6) })).resubmitted).toBe(true);
    expect(reviewFeedback(makeCase({ supervisorApproval: rejected, resubmittedAt: new Date(2026, 0, 4) })).resubmitted).toBe(false);
  });

  it('ignores an earlier reviewer’s rejection once the case has moved on', () => {
    const rec = makeCase({ approvalStage: 'lecturer', supervisorApproval: { approved: true, rejectionReason: 'old' } });
    expect(reviewFeedback(rec).rejectionReason).toBeUndefined();
  });
});

describe('formSnapshot', () => {
  const base = { caseNumber: 'C1', startYear: 2024, classYear: 2, sections: DEFAULT_SECTIONS, extensionReason: '' };

  it('ignores surrounding whitespace', () => {
    expect(formSnapshot({ ...base, caseNumber: ' C1 ', extensionReason: '  ' })).toBe(formSnapshot(base));
  });

  it('changes when a section is ticked', () => {
    expect(formSnapshot({ ...base, sections: { ...DEFAULT_SECTIONS, intro: true } })).not.toBe(formSnapshot(base));
  });
});
