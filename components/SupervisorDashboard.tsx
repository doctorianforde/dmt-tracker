'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import SiteFooter from '@/components/SiteFooter';
import Navbar from '@/components/Navbar';
import CaseTable, { canApprove, stageOf } from '@/components/CaseTable';
import DeadlineCalendar, { URGENCY_STYLES, type CalendarEvent } from '@/components/DeadlineCalendar';
import Avatar from '@/components/ui/Avatar';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  getAllCases,
  getCasesForSupervisor,
  getUsersByRole,
  getStudentsForSupervisor,
  getStaffDirectory,
  setSupervisorChoice,
  setStudentDeadline,
  approveCase,
  rejectCase,
  revokeApproval,
  logAccess,
  getAccessLogs,
} from '@/lib/firestore';
import { daysUntil, deadlineUrgency, describeDaysLeft, effectiveDeadline } from '@/lib/deadlines';
import { ACCOUNTABILITY_WINDOW_DAYS } from '@/lib/config';
import { getUnassignedStudents, updateMyStudents, type UnassignedStudent } from '@/lib/api-client';
import type { CaseRecord, ApprovalStage, UserRole, UserProfile, AccessLogEntry, AccessLogAction, StaffDirectoryEntry } from '@/types';

// Defined once at module scope — AuthGuard's redirect effect depends on this
// array by reference, so recreating it on every render would retrigger the
// effect continuously.
const SUPERVISOR_ROLES: UserRole[] = ['supervisor', 'lecturer'];

export default function SupervisorDashboard() {
  return (
    <AuthGuard allowedRoles={SUPERVISOR_ROLES}>
      <Dashboard />
    </AuthGuard>
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

// ── Deadline editor (one per student row) ─────────────────────────────────

function DeadlineCell({
  value,
  disabled,
  onSave,
}: {
  value?: string;
  disabled?: boolean;
  onSave: (deadline: string | null) => Promise<boolean>;
}) {
  // Remounted (via key) whenever the saved value changes, so the draft always
  // starts from the latest saved deadline.
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const changed = draft !== (value ?? '');

  const save = async (next: string | null) => {
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  };

  const days = value ? daysUntil(value) : null;

  return (
    <div className="flex flex-col gap-1.5 min-w-[11rem]">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled || saving}
          className="input !py-1.5 !px-2.5 text-xs w-[9.5rem]"
          aria-label="Submission deadline"
        />
        {changed && draft && (
          <button onClick={() => save(draft)} disabled={saving} className="btn-primary !px-3 !py-1.5 text-xs">
            {saving ? '…' : 'Set'}
          </button>
        )}
        {changed && (
          <button onClick={() => setDraft(value ?? '')} disabled={saving} className="btn-ghost !px-2 !py-1.5 text-xs" aria-label="Undo change">
            ↺
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value && days !== null && !changed && (
          <span className={`chip !py-0.5 ${URGENCY_STYLES[deadlineUrgency(days)].pill}`}>{describeDaysLeft(days)}</span>
        )}
        {value && !changed && (
          <button onClick={() => save(null)} disabled={saving || disabled} className="text-[11px] text-muted hover:text-danger">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Supervisor: add students who have no supervisor yet ───────────────────

function AddStudentsPanel({ onAdded }: { onAdded: (student: UnassignedStudent) => void }) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<UnassignedStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingUid, setAddingUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setError(null);
    setStudents(null);
    getUnassignedStudents()
      .then(setStudents)
      .catch((err: unknown) => setError(errorMessage(err)));
  };

  const add = async (student: UnassignedStudent) => {
    setAddingUid(student.uid);
    setError(null);
    try {
      await updateMyStudents(student.uid, 'add');
      setStudents((prev) => prev?.filter((s) => s.uid !== student.uid) ?? null);
      onAdded(student);
    } catch (err: unknown) {
      setError(`Couldn’t add ${student.name}: ${errorMessage(err)}`);
    } finally {
      setAddingUid(null);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          load();
        }}
        className="btn-primary"
      >
        + Add students
      </button>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = students?.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || (s.caseNumber ?? '').toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q)
  );

  return (
    <div className="card p-5 sm:p-6 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-bold text-ink">Students without a supervisor</p>
          <p className="text-sm text-muted mt-0.5">Add a student to your list. You can remove them again until they submit their case.</p>
        </div>
        <button onClick={() => setOpen(false)} className="btn-ghost !px-3 !py-1.5 text-xs">Close</button>
      </div>
      {error && <p className="text-sm text-danger mb-3" role="alert">{error}</p>}
      {students === null && !error ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : students && students.length === 0 ? (
        <p className="text-sm text-muted">Every student already has a supervisor.</p>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or case number…"
            className="input !py-2.5 mb-3 max-w-sm"
            aria-label="Search students"
          />
          <ul className="divide-y divide-line border-y border-line max-h-80 overflow-y-auto">
            {shown?.map((s) => (
              <li key={s.uid} className="flex items-center gap-3 py-3">
                <Avatar name={s.name} photoURL={s.photoURL} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-xs text-muted truncate">
                    {[s.caseNumber, s.email].filter(Boolean).join(' · ') || 'No case yet'}
                  </p>
                </div>
                <button onClick={() => add(s)} disabled={addingUid !== null} className="btn-secondary !px-3 !py-1.5 text-xs">
                  {addingUid === s.uid ? 'Adding…' : 'Add'}
                </button>
              </li>
            ))}
            {shown?.length === 0 && <li className="py-3 text-sm text-muted">No students match your search.</li>}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Student roster: supervisor assignment (Lecturer) and deadlines ────────

function StudentRoster({
  students,
  staff,
  casesByStudent,
  isLecturer,
  onAssign,
  onSetDeadline,
  onRemove,
}: {
  students: UserProfile[];
  staff: StaffDirectoryEntry[];
  casesByStudent: Map<string, CaseRecord>;
  isLecturer: boolean;
  onAssign: (student: UserProfile, directoryId: string) => Promise<boolean>;
  onSetDeadline: (student: UserProfile, deadline: string | null) => Promise<boolean>;
  // Supervisor only: release a student they added (draft cases only).
  onRemove?: (student: UserProfile) => Promise<boolean>;
}) {
  const [savingUid, setSavingUid] = useState<string | null>(null);

  if (students.length === 0) {
    return (
      <div className="card text-center py-14 px-6">
        <p className="display text-2xl text-ink">No students yet</p>
        <p className="text-sm text-muted mt-1">
          {isLecturer ? 'Students appear here once they register.' : 'Add students with the button above, or they’ll appear here when they choose you.'}
        </p>
      </div>
    );
  }

  const th = 'text-left px-4 py-3 eyebrow text-muted';

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface2/50">
              <th className={`${th} pl-5`}>Student</th>
              <th className={th}>Case #</th>
              {isLecturer && <th className={th}>Supervisor</th>}
              <th className={th}>Deadline</th>
              <th className={th}>Extension request</th>
              {onRemove && <th className={th}><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((student) => {
              const rec = casesByStudent.get(student.uid);
              const deadline = effectiveDeadline(student, rec);
              return (
                <tr key={student.uid} className="align-top">
                  <td className="pl-5 pr-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} photoURL={student.photoURL || undefined} size={36} />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{student.name}</p>
                        <p className="text-xs text-muted truncate">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted font-mono whitespace-nowrap">{student.caseNumber ?? '—'}</td>
                  {isLecturer && (
                    <td className="px-4 py-4">
                      <select
                        value={student.supervisorDirectoryId ?? ''}
                        disabled={savingUid === student.uid}
                        onChange={async (e) => {
                          setSavingUid(student.uid);
                          await onAssign(student, e.target.value);
                          setSavingUid(null);
                        }}
                        className="input !py-1.5 !px-2.5 text-xs min-w-[11rem]"
                        aria-label={`Supervisor for ${student.name}`}
                      >
                        <option value="">— Unassigned —</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}{s.uid ? '' : ' (not signed up yet)'}</option>
                        ))}
                        {/* Legacy assignment made before the directory existed. */}
                        {!student.supervisorDirectoryId && student.assignedSupervisorName && (
                          <option value="" disabled>{student.assignedSupervisorName} (legacy)</option>
                        )}
                      </select>
                      {student.supervisorDirectoryId && !student.assignedSupervisorUid && (
                        <p className="text-[11px] text-muted mt-1">Links automatically when they sign up</p>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <DeadlineCell
                      key={deadline ?? 'none'}
                      value={deadline}
                      onSave={(d) => onSetDeadline(student, d)}
                    />
                    {!student.deadline && rec?.customDeadline && (
                      <p className="text-[11px] text-muted mt-1 max-w-[12rem]">Set by the student before deadlines moved to staff — set it here to confirm.</p>
                    )}
                    {student.deadline && student.deadlineSetByName && (
                      <p className="text-[11px] text-muted mt-1">by {student.deadlineSetByName}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 max-w-[16rem]">
                    {rec?.extensionReason ? (
                      <p className="text-xs text-ink/80 line-clamp-3" title={rec.extensionReason}>“{rec.extensionReason}”</p>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  {onRemove && (
                    <td className="px-4 py-4 text-right">
                      {(!rec || stageOf(rec) === 'pending') && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Remove ${student.name} from your students?`)) return;
                            setSavingUid(student.uid);
                            await onRemove(student);
                            setSavingUid(null);
                          }}
                          disabled={savingUid === student.uid}
                          className="text-xs text-muted hover:text-danger whitespace-nowrap"
                        >
                          {savingUid === student.uid ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Access log (Lecturer) ─────────────────────────────────────────────────

const ACTION_LABELS: Record<AccessLogAction, string> = {
  login: 'Signed in',
  view_cases: 'Viewed case list',
  approve: 'Approved case',
  reject: 'Rejected case',
  revoke: 'Revoked approval',
  assign_supervisor: 'Assigned supervisor',
  set_deadline: 'Set deadline',
};

function AccessLog() {
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(await getAccessLogs());
    } catch (err: unknown) {
      setError('Failed to load access log: ' + errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const th = 'text-left px-4 py-3 eyebrow text-muted';

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-line flex items-center justify-between">
        <p className="text-sm text-muted">Logins, case views, approvals and deadline changes</p>
        <button onClick={load} disabled={loading} className="btn-secondary !px-3 !py-1.5 text-xs">Refresh</button>
      </div>
      {error && <div className="px-5 py-3 bg-danger/10 text-xs text-danger">{error}</div>}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-muted">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted">No activity recorded yet</div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line">
                <th className={`${th} pl-5`}>Time</th>
                <th className={th}>Who</th>
                <th className={th}>Action</th>
                <th className={th}>Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="pl-5 pr-4 py-2.5 text-xs text-muted whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-ink">{log.actorName}</p>
                    <p className="text-xs text-muted capitalize">{log.actorRole}</p>
                  </td>
                  <td className="px-4 py-2.5 text-ink/80">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{log.targetLabel ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function Dashboard() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<StaffDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isLecturer = userProfile?.role === 'lecturer';
  const isSupervisor = userProfile?.role === 'supervisor';

  const log = useCallback(
    (action: AccessLogAction, targetId?: string, targetLabel?: string) => {
      if (!userProfile) return;
      logAccess({
        actorUid: userProfile.uid,
        actorName: userProfile.name,
        actorRole: userProfile.role,
        action,
        ...(targetId ? { targetId } : {}),
        ...(targetLabel ? { targetLabel } : {}),
      });
    },
    [userProfile]
  );

  // Cases and the roster load independently so one failing doesn't hide
  // the other.
  const fetchAll = useCallback(async () => {
    if (!userProfile) return null;
    return Promise.allSettled([
      isLecturer ? getAllCases() : getCasesForSupervisor(userProfile.uid),
      isLecturer ? getUsersByRole('student') : getStudentsForSupervisor(userProfile.uid),
      isLecturer ? getStaffDirectory() : Promise.resolve([] as StaffDirectoryEntry[]),
    ] as const);
  }, [userProfile, isLecturer]);

  const applyResults = useCallback(
    (results: Awaited<ReturnType<typeof fetchAll>>) => {
      if (!results) return;
      const [caseResult, studentResult, staffResult] = results;
      const errors: string[] = [];
      if (caseResult.status === 'fulfilled') {
        const sorted = [...caseResult.value].sort((a, b) => a.studentName.localeCompare(b.studentName));
        setCases(sorted);
        if (sorted.length > 0) log('view_cases', undefined, sorted.map((c) => c.caseNumber).join(', '));
      } else {
        errors.push('cases: ' + errorMessage(caseResult.reason));
      }
      if (studentResult.status === 'fulfilled') setStudents(studentResult.value);
      else errors.push('students: ' + errorMessage(studentResult.reason));
      if (staffResult.status === 'fulfilled') setStaff(staffResult.value);
      else errors.push('staff list: ' + errorMessage(staffResult.reason));

      setLoadError(errors.length ? `Failed to load ${errors.join('; ')}` : null);
      setLastRefresh(new Date());
      setLoading(false);
    },
    [log]
  );

  useEffect(() => {
    let cancelled = false;
    fetchAll().then((results) => {
      if (!cancelled) applyResults(results);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAll, applyResults]);

  const refresh = () => {
    setLoading(true);
    fetchAll().then(applyResults);
  };


  const casesByStudent = useMemo(() => new Map(cases.map((c) => [c.studentUid, c])), [cases]);

  const deadlines = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const s of students) map[s.uid] = effectiveDeadline(s, casesByStudent.get(s.uid));
    return map;
  }, [students, casesByStudent]);

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      students.flatMap((s) => {
        const date = deadlines[s.uid];
        if (!date) return [];
        return [{
          id: s.uid,
          date,
          label: s.name,
          sublabel: isLecturer ? s.supervisorDirectoryName ?? s.assignedSupervisorName ?? 'Unassigned' : s.caseNumber,
          photoURL: s.photoURL || undefined,
        }];
      }),
    [students, deadlines, isLecturer]
  );

  // Wraps a staff action: surfaces failures in a banner instead of letting
  // them fail silently, and reports success back to the caller.
  const attempt = async (what: string, action: () => Promise<void>): Promise<boolean> => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (err: unknown) {
      setActionError(`Couldn’t ${what}: ${errorMessage(err)}`);
      return false;
    }
  };

  const caseLabel = (caseNumber: string) => {
    const studentName = cases.find((c) => c.caseNumber === caseNumber)?.studentName;
    return studentName ? `${studentName} (${caseNumber})` : caseNumber;
  };

  const handleApprove = (caseNumber: string, role: 'supervisor' | 'lecturer', nextStage: ApprovalStage) =>
    attempt('approve this case', async () => {
      await approveCase(caseNumber, role, nextStage);
      setCases((prev) =>
        prev.map((c) =>
          c.caseNumber === caseNumber
            ? {
                ...c,
                approvalStage: nextStage,
                greenLight: nextStage === 'approved',
                [role === 'supervisor' ? 'supervisorApproval' : 'lecturerApproval']: { approved: true, approvedAt: new Date() },
              }
            : c
        )
      );
      log('approve', caseNumber, caseLabel(caseNumber));
    });

  const handleReject = (caseNumber: string, role: 'supervisor' | 'lecturer', reason: string) =>
    attempt('reject this case', async () => {
      await rejectCase(caseNumber, role, reason);
      setCases((prev) =>
        prev.map((c) =>
          c.caseNumber === caseNumber
            ? {
                ...c,
                [role === 'supervisor' ? 'supervisorApproval' : 'lecturerApproval']: {
                  approved: false,
                  rejectionReason: reason,
                  rejectedAt: new Date(),
                },
              }
            : c
        )
      );
      log('reject', caseNumber, caseLabel(caseNumber));
    });

  const handleRevoke = (caseNumber: string) =>
    attempt('revoke approval', async () => {
      await revokeApproval(caseNumber);
      setCases((prev) =>
        prev.map((c) => (c.caseNumber === caseNumber ? { ...c, greenLight: false, approvalStage: 'lecturer' } : c))
      );
      log('revoke', caseNumber, caseLabel(caseNumber));
    });

  const handleAssign = (student: UserProfile, directoryId: string) =>
    attempt(`update ${student.name}’s supervisor`, async () => {
      const entry = staff.find((s) => s.id === directoryId) ?? null;
      await setSupervisorChoice(student.uid, entry, student.caseNumber);
      const accountUid = entry?.uid;
      const accountName = entry?.uid ? entry.name : undefined;
      setStudents((prev) =>
        prev.map((s) =>
          s.uid === student.uid
            ? {
                ...s,
                supervisorDirectoryId: entry?.id,
                supervisorDirectoryName: entry?.name,
                assignedSupervisorUid: accountUid,
                assignedSupervisorName: accountName,
              }
            : s
        )
      );
      if (student.caseNumber) {
        setCases((prev) =>
          prev.map((c) =>
            c.caseNumber === student.caseNumber
              ? { ...c, supervisorUid: accountUid, supervisorName: accountName }
              : c
          )
        );
      }
      log('assign_supervisor', student.uid, `${student.name} → ${entry?.name ?? 'unassigned'}`);
    });

  const handleStudentAdded = (student: UnassignedStudent) => {
    log('assign_supervisor', student.uid, `${student.name} → ${userProfile?.name ?? 'supervisor'} (self-selected)`);
    refresh();
  };

  const handleRemoveStudent = (student: UserProfile) =>
    attempt(`remove ${student.name}`, async () => {
      await updateMyStudents(student.uid, 'remove');
      setStudents((prev) => prev.filter((s) => s.uid !== student.uid));
      setCases((prev) => prev.filter((c) => c.studentUid !== student.uid));
      log('assign_supervisor', student.uid, `${student.name} → unassigned (removed by supervisor)`);
    });

  const handleSetDeadline = (student: UserProfile, deadline: string | null) =>
    attempt(`set ${student.name}’s deadline`, async () => {
      if (!userProfile) return;
      await setStudentDeadline(student.uid, deadline, userProfile.name);
      setStudents((prev) =>
        prev.map((s) =>
          s.uid === student.uid
            ? { ...s, deadline: deadline ?? undefined, deadlineSetByName: deadline ? userProfile.name : undefined }
            : s
        )
      );
      log('set_deadline', student.uid, `${student.name}: ${deadline ?? 'cleared'}`);
    });

  // ── Stats ──
  const awaitingYou = cases.filter((c) =>
    canApprove(stageOf(c), { isSupervisor, isLecturer, uid: userProfile?.uid }, c)
  ).length;
  const approvedCount = cases.filter((c) => stageOf(c) === 'approved').length;
  const dueSoon = Object.values(deadlines).filter((d) => {
    if (!d) return false;
    const days = daysUntil(d);
    return days >= 0 && days <= ACCOUNTABILITY_WINDOW_DAYS;
  }).length;
  const overdue = Object.values(deadlines).filter((d) => d && daysUntil(d) < 0).length;

  const stats = [
    { label: isLecturer ? 'Students' : 'Your students', value: students.length, tone: 'text-ink' },
    { label: 'Awaiting your review', value: awaitingYou, tone: awaitingYou ? 'text-accent' : 'text-ink' },
    { label: `Due in ${ACCOUNTABILITY_WINDOW_DAYS} days`, value: dueSoon, tone: dueSoon ? 'text-warn' : 'text-ink' },
    { label: overdue ? 'Overdue' : 'Approved', value: overdue || approvedCount, tone: overdue ? 'text-danger' : 'text-ok' },
  ];

  const displayName = userProfile?.name ?? '';

  return (
    <div className="min-h-screen pb-6">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-14">

        <header>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-on-canvas-muted">
                {isLecturer ? 'Lecturer · All students' : 'Supervisor · Your assigned students'}
              </p>
              <h1 className="display text-5xl sm:text-6xl leading-[0.95] text-on-canvas on-canvas-text mt-3">
                {greeting()}, {displayName}.
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <p className="text-xs text-on-canvas-muted hidden sm:block">Updated {lastRefresh.toLocaleTimeString()}</p>
              )}
              <button onClick={refresh} disabled={loading} className="btn-secondary">
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
            {stats.map((s) => (
              <div key={s.label} className="card p-5">
                <p className={`display text-5xl leading-none tabular-nums ${s.tone}`}>{s.value}</p>
                <p className="text-xs font-semibold text-muted mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </header>

        {(loadError || actionError) && (
          <div className="card p-4 border-danger/40 flex items-start justify-between gap-4" role="alert">
            <p className="text-sm font-semibold text-danger">{actionError ?? loadError}</p>
            {actionError ? (
              <button onClick={() => setActionError(null)} className="btn-ghost !px-2 !py-1 text-xs">Dismiss</button>
            ) : (
              <button onClick={refresh} className="btn-secondary !px-3 !py-1.5 text-xs">Retry</button>
            )}
          </div>
        )}

        {loading && cases.length === 0 && students.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-on-canvas-muted text-sm">Loading…</p>
            </div>
          </div>
        ) : (
          <>
            <section>
              <SectionHeader
                index={1}
                eyebrow="Review"
                title="Case reviews"
                description={
                  isLecturer
                    ? 'Grant final approval once the supervisor has approved. Students who chose you as their supervisor also appear here for the first review.'
                    : 'Approve to send a case on to the Lecturer, or request changes.'
                }
              />
              <CaseTable
                cases={cases}
                isLecturer={isLecturer}
                isSupervisor={isSupervisor}
                currentUid={userProfile?.uid}
                deadlines={deadlines}
                onApprove={handleApprove}
                onReject={handleReject}
                onRevoke={handleRevoke}
              />
            </section>

            <section>
              <SectionHeader
                index={2}
                eyebrow="Timeline"
                title="Deadline calendar"
                description={isLecturer ? 'Every student’s submission deadline.' : 'Submission deadlines for your students.'}
              />
              <div className="card p-6 sm:p-8">
                <DeadlineCalendar
                  events={calendarEvents}
                  emptyMessage="No upcoming deadlines. Set them in the student list below."
                />
              </div>
            </section>

            <section>
              <SectionHeader
                index={3}
                eyebrow="Students"
                title={isLecturer ? 'Students & supervisors' : 'Your students'}
                description={
                  isLecturer
                    ? 'Assign each student a supervisor and set their submission deadline.'
                    : 'Add students to your list and set each one’s submission deadline.'
                }
              />
              {isSupervisor && <AddStudentsPanel onAdded={handleStudentAdded} />}
              <StudentRoster
                students={students}
                staff={staff}
                casesByStudent={casesByStudent}
                isLecturer={isLecturer}
                onAssign={handleAssign}
                onSetDeadline={handleSetDeadline}
                onRemove={isSupervisor ? handleRemoveStudent : undefined}
              />
            </section>

            {isLecturer && (
              <section>
                <SectionHeader index={4} eyebrow="Audit" title="Access log" />
                <AccessLog />
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
