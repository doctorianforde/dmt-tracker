'use client';

import { useState } from 'react';
import type { CaseRecord, ApprovalStage } from '@/types';
import { daysUntil, deadlineUrgency, describeDaysLeft, formatDeadline } from '@/lib/deadlines';
import { URGENCY_STYLES } from '@/components/DeadlineCalendar';

// Handlers may return false to signal the action failed (the dashboard shows
// the error); the table then keeps e.g. a typed rejection reason in place.
type ActionResult = Promise<boolean | void> | boolean | void;

interface Props {
  cases: CaseRecord[];
  isLecturer?: boolean;
  isSupervisor?: boolean;
  // The signed-in reviewer's uid. Lets a Lecturer who is also a student's
  // chosen supervisor review at the supervisor stage.
  currentUid?: string;
  // Effective deadline per studentUid, for the Deadline column.
  deadlines?: Record<string, string | undefined>;
  onApprove?: (caseNumber: string, role: 'supervisor' | 'lecturer', nextStage: ApprovalStage) => ActionResult;
  onReject?: (caseNumber: string, role: 'supervisor' | 'lecturer', reason: string) => ActionResult;
  onRevoke?: (caseNumber: string) => ActionResult;
}

// Who is acting depends on the stage being reviewed, not on the viewer's
// account role (a Lecturer can also be a student's supervisor).
function reviewerRole(stage: ApprovalStage): 'supervisor' | 'lecturer' {
  return stage === 'supervisor' ? 'supervisor' : 'lecturer';
}

function currentStageApproval(record: CaseRecord, stage: ApprovalStage) {
  if (stage === 'supervisor') return record.supervisorApproval;
  if (stage === 'lecturer') return record.lecturerApproval;
  return undefined;
}

// True when the student flagged the case as ready after the current
// reviewer's most recent rejection.
function isResubmitted(record: CaseRecord, stage: ApprovalStage): boolean {
  const approval = currentStageApproval(record, stage);
  if (!approval?.rejectionReason || approval.approved || !record.resubmittedAt) return false;
  return !approval.rejectedAt || record.resubmittedAt.getTime() > approval.rejectedAt.getTime();
}

const SECTION_KEYS = ['intro', 'caseReport', 'discussion', 'conclusion', 'references'] as const;
const SECTION_LABELS: Record<string, string> = {
  intro: 'Intro',
  caseReport: 'Report',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
  references: 'References',
};

export const STAGE_STYLES: Record<ApprovalStage, { label: string; pill: string; dot: string }> = {
  pending: { label: 'Draft', pill: 'bg-ink/5 text-muted', dot: 'bg-muted' },
  supervisor: { label: 'Supervisor', pill: 'bg-warn/15 text-warn', dot: 'bg-warn' },
  lecturer: { label: 'Lecturer', pill: 'bg-gold/15 text-gold', dot: 'bg-gold' },
  approved: { label: 'Approved', pill: 'bg-ok/15 text-ok', dot: 'bg-ok' },
};

interface Viewer {
  isSupervisor: boolean;
  isLecturer: boolean;
  uid?: string;
}

// Supervisors only ever load their own students' cases (enforced in
// firestore.rules); a Lecturer acts at the supervisor stage only on cases
// where they are the assigned supervisor.
function actsAsSupervisor(viewer: Viewer, record: CaseRecord): boolean {
  return viewer.isSupervisor || (!!viewer.uid && record.supervisorUid === viewer.uid);
}

function getNextStage(current: ApprovalStage, viewer: Viewer, record: CaseRecord): ApprovalStage | null {
  if (current === 'supervisor' && actsAsSupervisor(viewer, record) && !record.supervisorApproval?.approved) {
    return 'lecturer';
  }
  if (viewer.isLecturer && current === 'lecturer' && record.supervisorApproval?.approved) {
    return 'approved';
  }
  return null;
}

export function canApprove(stage: ApprovalStage, viewer: Viewer, record: CaseRecord): boolean {
  if (stage === 'supervisor' && actsAsSupervisor(viewer, record) && !record.supervisorApproval?.approved) return true;
  if (viewer.isLecturer && stage === 'lecturer' && !record.lecturerApproval?.approved && record.supervisorApproval?.approved) return true;
  return false;
}

export function stageOf(record: CaseRecord): ApprovalStage {
  return record.approvalStage ?? (record.greenLight ? 'approved' : 'pending');
}

function getStageButtonLabel(next: ApprovalStage): string {
  if (next === 'lecturer') return '✅ Approve & Send to Lecturer';
  if (next === 'approved') return '✅ Grant Final Approval';
  return 'Advance';
}

export default function CaseTable({ cases, isLecturer = false, isSupervisor = false, currentUid, deadlines, onApprove, onReject, onRevoke }: Props) {
  const [search, setSearch] = useState('');
  const [rejectingCase, setRejectingCase] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyCase, setBusyCase] = useState<string | null>(null);

  const startReject = (caseNumber: string) => {
    setRejectingCase(caseNumber);
    setRejectReason('');
  };

  const cancelReject = () => {
    setRejectingCase(null);
    setRejectReason('');
  };

  // Runs an action for one case, disabling that row's buttons meanwhile.
  const run = async (caseNumber: string, action: () => ActionResult): Promise<boolean> => {
    setBusyCase(caseNumber);
    try {
      return (await action()) !== false;
    } finally {
      setBusyCase(null);
    }
  };

  const confirmReject = async (record: CaseRecord) => {
    if (!rejectReason.trim()) return;
    const role = reviewerRole(stageOf(record));
    const reason = rejectReason.trim();
    const ok = await run(record.caseNumber, () => onReject?.(record.caseNumber, role, reason));
    if (ok) cancelReject();
  };

  const filtered = cases.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (cases.length === 0) {
    return (
      <div className="card text-center py-16 px-6">
        <p className="display text-2xl text-ink">No case records yet</p>
        <p className="text-sm text-muted mt-1">
          {isSupervisor && !isLecturer
            ? 'Cases for your assigned students will appear here once they start.'
            : 'Student submissions will appear here.'}
        </p>
      </div>
    );
  }

  const th = 'text-left px-4 py-3 eyebrow text-muted';

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-line">
        <label htmlFor="case-search" className="sr-only">Search by name or case number</label>
        <div className="relative max-w-sm">
          <input
            id="case-search"
            type="text"
            placeholder="Search by name or case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input !py-2.5 pl-10"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface2/50">
              <th className={`${th} pl-5`}>Student</th>
              <th className={th}>Case #</th>
              <th className={`${th} text-center`}>Sections</th>
              <th className={`${th} hidden md:table-cell`}>Deadline</th>
              <th className={`${th} text-center`}>Stage</th>
              {(isSupervisor || isLecturer) && <th className={`${th} text-center`}>Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((rec) => {
              const completedCount = SECTION_KEYS.filter((k) => rec.sections?.[k]).length;
              const stage = stageOf(rec);
              const stageStyle = STAGE_STYLES[stage];
              const viewer = { isSupervisor, isLecturer, uid: currentUid };
              const nextStage = getNextStage(stage, viewer, rec);
              const canApproveCase = canApprove(stage, viewer, rec);
              const busy = busyCase === rec.caseNumber;
              const approval = currentStageApproval(rec, stage);
              const resubmitted = isResubmitted(rec, stage);
              const deadline = deadlines?.[rec.studentUid] ?? rec.customDeadline;
              const days = deadline ? daysUntil(deadline) : null;

              return (
                <tr key={rec.caseNumber} className="hover:bg-ink/[0.02] transition-colors align-top">
                  <td className="pl-5 pr-4 py-4">
                    <p className="font-semibold text-ink">{rec.studentName}</p>
                    <p className="text-xs text-muted mt-0.5">Y{rec.classYear} · {rec.startYear}{rec.supervisorName ? ` · ${rec.supervisorName}` : ''}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs bg-ink/5 text-ink px-2 py-1 rounded">{rec.caseNumber}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {SECTION_KEYS.map((key) => (
                          <div
                            key={key}
                            title={SECTION_LABELS[key]}
                            className={`w-2.5 h-2.5 rounded-full ${rec.sections?.[key] ? 'bg-accent' : 'bg-ink/10'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted tabular-nums">{completedCount}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {deadline && days !== null ? (
                      <>
                        <p className="text-xs font-semibold text-ink whitespace-nowrap">{formatDeadline(deadline, 'short')}</p>
                        <span className={`chip mt-1 !py-0.5 ${URGENCY_STYLES[deadlineUrgency(days)].pill}`}>
                          {describeDaysLeft(days)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted">Not set</span>
                    )}
                    {rec.extensionReason && (
                      <p className="text-xs text-warn mt-1 max-w-[12rem] truncate" title={rec.extensionReason}>
                        Extension asked: {rec.extensionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`chip ${stageStyle.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot}`} />
                      {stage === 'supervisor' && rec.supervisorName ? rec.supervisorName : stageStyle.label}
                    </span>
                  </td>
                  {(isSupervisor || isLecturer) && (
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {stage === 'supervisor' && rec.supervisorApproval?.approved && (
                          <span className="text-xs text-ok font-semibold">✅ Approved by Supervisor</span>
                        )}
                        {stage === 'lecturer' && rec.lecturerApproval?.approved && (
                          <span className="text-xs text-ok font-semibold">✅ Approved by Lecturer</span>
                        )}
                        {resubmitted && (
                          <span className="chip bg-info/15 text-info">↻ Resubmitted — ready for re-review</span>
                        )}
                        {canApproveCase && nextStage && rejectingCase !== rec.caseNumber && (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => run(rec.caseNumber, () => onApprove?.(rec.caseNumber, reviewerRole(stage), nextStage))}
                              disabled={busy}
                              className="btn !px-3 !py-1.5 text-xs bg-ok/15 text-ok hover:bg-ok/25 whitespace-nowrap"
                            >
                              {getStageButtonLabel(nextStage)}
                            </button>
                            <button
                              onClick={() => startReject(rec.caseNumber)}
                              disabled={busy}
                              className="btn !px-3 !py-1 text-xs text-danger hover:bg-danger/10 whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {canApproveCase && rejectingCase === rec.caseNumber && (
                          <div className="flex flex-col items-stretch gap-1.5 w-52">
                            <textarea
                              autoFocus
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              rows={2}
                              className="input !px-2.5 !py-2 text-xs resize-none"
                            />
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => confirmReject(rec)}
                                disabled={!rejectReason.trim() || busy}
                                className="btn !px-3 !py-1 text-xs bg-danger text-white hover:brightness-95"
                              >
                                Confirm
                              </button>
                              <button onClick={cancelReject} disabled={busy} className="btn-ghost !px-3 !py-1 text-xs">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {!canApproveCase && stage !== 'pending' && stage !== 'approved' && (
                          <span className="text-xs text-muted">Waiting for approval</span>
                        )}
                        {approval?.rejectionReason && !approval.approved && (
                          <span className="text-xs text-danger max-w-[11rem] truncate" title={approval.rejectionReason}>
                            ❌ Rejected: {approval.rejectionReason}
                          </span>
                        )}
                        {isLecturer && stage === 'approved' && (
                          <button
                            onClick={() => run(rec.caseNumber, () => onRevoke?.(rec.caseNumber))}
                            disabled={busy}
                            className="btn !px-3 !py-1.5 text-xs bg-danger/10 text-danger hover:bg-danger/20"
                          >
                            Revoke
                          </button>
                        )}
                        {busy && <span className="text-xs text-muted">Saving…</span>}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">No results match your search</div>
      )}
    </div>
  );
}
