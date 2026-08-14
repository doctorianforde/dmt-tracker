'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import CaseTable from '@/components/CaseTable';
import {
  getAllCases,
  getCasesForSupervisor,
  getUsersByRole,
  assignSupervisor,
  approveCase,
  rejectCase,
  revokeApproval,
  logAccess,
  getAccessLogs,
} from '@/lib/firestore';
import type { CaseRecord, ApprovalStage, UserRole, UserProfile, AccessLogEntry } from '@/types';

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

function ManageStudents() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [supervisors, setSupervisors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentList, supervisorList] = await Promise.all([
        getUsersByRole('student'),
        getUsersByRole('supervisor'),
      ]);
      setStudents(studentList);
      setSupervisors(supervisorList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load students: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (student: UserProfile, supervisorUid: string) => {
    const supervisor = supervisors.find((s) => s.uid === supervisorUid);
    if (!supervisor) return;
    setSavingUid(student.uid);
    try {
      await assignSupervisor(student.uid, supervisor.uid, supervisor.name, student.caseNumber);
      setStudents((prev) =>
        prev.map((s) =>
          s.uid === student.uid
            ? { ...s, assignedSupervisorUid: supervisor.uid, assignedSupervisorName: supervisor.name }
            : s
        )
      );
      if (userProfile) {
        logAccess({
          actorUid: userProfile.uid,
          actorName: userProfile.name,
          actorRole: userProfile.role,
          action: 'assign_supervisor',
          targetId: student.uid,
          targetLabel: `${student.name} → ${supervisor.name}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to assign supervisor: ' + msg);
    } finally {
      setSavingUid(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
        Loading students...
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
        <p className="text-sm font-semibold text-slate-700">Manage Students</p>
        <p className="text-xs text-slate-500 mt-0.5">Assign or reassign each student to a supervisor</p>
      </div>
      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-xs text-red-700">{error}</div>
      )}
      {students.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">No students yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Case #</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Assigned Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.uid}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {student.caseNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={student.assignedSupervisorUid ?? ''}
                      disabled={savingUid === student.uid}
                      onChange={(e) => handleAssign(student, e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                    >
                      <option value="">— Unassigned —</option>
                      {supervisors.map((s) => (
                        <option key={s.uid} value={s.uid}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Signed in',
  view_cases: 'Viewed case list',
  approve: 'Approved case',
  reject: 'Rejected case',
  revoke: 'Revoked approval',
  assign_supervisor: 'Assigned supervisor',
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
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load access log: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Access Log</p>
          <p className="text-xs text-slate-500 mt-0.5">Who accessed what, and when — logins, case views, and approval actions</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-xs text-red-700">{error}</div>
      )}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">No activity recorded yet</div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Who</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-slate-900">{log.actorName}</p>
                    <p className="text-xs text-slate-400 capitalize">{log.actorRole}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{log.targetLabel ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isLecturer = userProfile?.role === 'lecturer';
  const isSupervisor = userProfile?.role === 'supervisor';

  const loadCases = useCallback(async () => {
    if (!userProfile) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = isLecturer
        ? await getAllCases()
        : await getCasesForSupervisor(userProfile.uid);
      const sorted = data.sort((a, b) => a.studentName.localeCompare(b.studentName));
      setCases(sorted);
      setLastRefresh(new Date());
      if (sorted.length > 0) {
        logAccess({
          actorUid: userProfile.uid,
          actorName: userProfile.name,
          actorRole: userProfile.role,
          action: 'view_cases',
          targetLabel: sorted.map((c) => c.caseNumber).join(', '),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLoadError('Failed to load cases: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [userProfile, isLecturer]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const logCaseAction = (action: 'approve' | 'reject' | 'revoke', caseNumber: string) => {
    if (!userProfile) return;
    const studentName = cases.find((c) => c.caseNumber === caseNumber)?.studentName;
    logAccess({
      actorUid: userProfile.uid,
      actorName: userProfile.name,
      actorRole: userProfile.role,
      action,
      targetId: caseNumber,
      targetLabel: studentName ? `${studentName} (${caseNumber})` : caseNumber,
    });
  };

  const handleApprove = async (
    caseNumber: string,
    role: 'supervisor' | 'lecturer',
    nextStage: ApprovalStage
  ) => {
    await approveCase(caseNumber, role, nextStage);
    setCases((prev) =>
      prev.map((c) =>
        c.caseNumber === caseNumber
          ? {
              ...c,
              approvalStage: nextStage,
              greenLight: nextStage === 'approved',
              [role === 'supervisor' ? 'supervisorApproval' : 'lecturerApproval']: { approved: true },
            }
          : c
      )
    );
    logCaseAction('approve', caseNumber);
  };

  const handleReject = async (
    caseNumber: string,
    role: 'supervisor' | 'lecturer',
    reason: string
  ) => {
    await rejectCase(caseNumber, role, reason);
    setCases((prev) =>
      prev.map((c) =>
        c.caseNumber === caseNumber
          ? {
              ...c,
              [role === 'supervisor' ? 'supervisorApproval' : 'lecturerApproval']: { approved: false, rejectionReason: reason },
            }
          : c
      )
    );
    logCaseAction('reject', caseNumber);
  };

  const handleRevoke = async (caseNumber: string) => {
    await revokeApproval(caseNumber);
    setCases((prev) =>
      prev.map((c) => (c.caseNumber === caseNumber ? { ...c, greenLight: false, approvalStage: 'lecturer' } : c))
    );
    logCaseAction('revoke', caseNumber);
  };

  const ROLE_TITLE: Record<string, string> = {
    supervisor: 'Supervisor',
    lecturer: 'Lecturer',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isLecturer ? 'Lecturer Dashboard' : 'Supervisor Dashboard'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {ROLE_TITLE[userProfile?.role ?? 'supervisor']} ·{' '}
              {isLecturer ? 'All student case records' : 'Your assigned students'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {lastRefresh && (
              <p className="text-xs text-slate-400 hidden sm:block">
                Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={loadCases}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-4 py-2 border border-slate-200 rounded-xl hover:bg-white transition-colors bg-white/50 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Role info banners */}
        {isLecturer && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 text-lg">✅</span>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Lecturer</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  You provide final approval for all case reports, and assign each student to a supervisor below.
                </p>
              </div>
            </div>
          </div>
        )}
        {isSupervisor && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-5 py-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-violet-600 text-lg">👨‍⚕️</span>
              <div>
                <p className="text-sm font-semibold text-violet-900">Supervisor Review Panel</p>
                <p className="text-sm text-violet-700 mt-0.5">
                  You review case submissions for students assigned to you by the Lecturer.
                </p>
                <ul className="text-sm text-violet-700 mt-2 ml-4 space-y-1 list-disc">
                  <li>Review assigned case completeness and quality</li>
                  <li>Approve cases to move them forward in the pipeline</li>
                  <li>Provide feedback for improvements when needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {isLecturer && <ManageStudents />}
        {isLecturer && <AccessLog />}

        {/* Approval stage legend */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Approval Pipeline</p>
          <div className="space-y-2">
            {[
              { color: 'bg-slate-300', label: 'Pending', desc: 'Awaiting submission & Supervisor review' },
              { color: 'bg-orange-400', label: 'Supervisor', desc: 'Awaiting the assigned Supervisor’s approval' },
              { color: 'bg-yellow-300', label: 'Lecturer', desc: 'Supervisor approved, awaiting the Lecturer' },
              { color: 'bg-emerald-500', label: 'Approved', desc: 'Final approval granted by the Lecturer' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <span className={`w-3 h-3 rounded-full ${color} flex-shrink-0 mt-1`} />
                <div>
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <p className="text-sm font-semibold text-red-700">{loadError}</p>
            <button
              onClick={loadCases}
              className="mt-3 px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading case records...</p>
            </div>
          </div>
        ) : (
          <CaseTable
            cases={cases}
            isLecturer={isLecturer}
            isSupervisor={isSupervisor}
            onApprove={handleApprove}
            onReject={handleReject}
            onRevoke={handleRevoke}
          />
        )}
      </main>
    </div>
  );
}
