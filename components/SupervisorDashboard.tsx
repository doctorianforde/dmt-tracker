'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import SiteFooter from '@/components/SiteFooter';
import Navbar from '@/components/Navbar';
import CaseTable, { canApprove } from '@/components/CaseTable';
import DeadlineCalendar, { type CalendarEvent } from '@/components/DeadlineCalendar';
import SectionHeader from '@/components/ui/SectionHeader';
import AddStudentsPanel from '@/components/supervisor/AddStudentsPanel';
import StudentRoster from '@/components/supervisor/StudentRoster';
import AccessLog from '@/components/supervisor/AccessLog';
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
} from '@/lib/firestore';
import { effectiveDeadline } from '@/lib/deadlines';
import { ACCOUNTABILITY_WINDOW_DAYS } from '@/lib/config';
import { updateMyStudents, type UnassignedStudent } from '@/lib/api-client';
import {
  deadlineCounts,
  errorMessage,
  stageOf,
  withApproval,
  withCaseSupervisor,
  withDeadline,
  withRejection,
  withRevoke,
  withStudentSupervisor,
  type ReviewerRole,
} from '@/lib/case-state';
import type { CaseRecord, ApprovalStage, UserRole, UserProfile, AccessLogAction, StaffDirectoryEntry } from '@/types';

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

  const handleApprove = (caseNumber: string, role: ReviewerRole, nextStage: ApprovalStage) =>
    attempt('approve this case', async () => {
      await approveCase(caseNumber, role, nextStage);
      setCases((prev) => withApproval(prev, caseNumber, role, nextStage));
      log('approve', caseNumber, caseLabel(caseNumber));
    });

  const handleReject = (caseNumber: string, role: ReviewerRole, reason: string) =>
    attempt('reject this case', async () => {
      await rejectCase(caseNumber, role, reason);
      setCases((prev) => withRejection(prev, caseNumber, role, reason));
      log('reject', caseNumber, caseLabel(caseNumber));
    });

  const handleRevoke = (caseNumber: string) =>
    attempt('revoke approval', async () => {
      await revokeApproval(caseNumber);
      setCases((prev) => withRevoke(prev, caseNumber));
      log('revoke', caseNumber, caseLabel(caseNumber));
    });

  const handleAssign = (student: UserProfile, directoryId: string) =>
    attempt(`update ${student.name}’s supervisor`, async () => {
      const entry = staff.find((s) => s.id === directoryId) ?? null;
      await setSupervisorChoice(student.uid, entry, student.caseNumber);
      setStudents((prev) => withStudentSupervisor(prev, student.uid, entry));
      const { caseNumber } = student;
      if (caseNumber) setCases((prev) => withCaseSupervisor(prev, caseNumber, entry));
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
      setStudents((prev) => withDeadline(prev, student.uid, deadline, userProfile.name));
      log('set_deadline', student.uid, `${student.name}: ${deadline ?? 'cleared'}`);
    });

  // ── Stats ──
  const awaitingYou = cases.filter((c) =>
    canApprove(stageOf(c), { isSupervisor, isLecturer, uid: userProfile?.uid }, c)
  ).length;
  const approvedCount = cases.filter((c) => stageOf(c) === 'approved').length;
  const { dueSoon, overdue } = deadlineCounts(Object.values(deadlines), ACCOUNTABILITY_WINDOW_DAYS);

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
