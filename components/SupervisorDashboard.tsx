'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import CaseTable from '@/components/CaseTable';
import { getAllCases, approveCase, revokeApproval } from '@/lib/firestore';
import type { CaseRecord, ApprovalStage } from '@/types';

const SUPERVISOR_ROLES = ['supervisor', 'drpaul'] as const;

export default function SupervisorDashboard() {
  return (
    <AuthGuard allowedRoles={[...SUPERVISOR_ROLES]}>
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAllCases();
      setCases(data.sort((a, b) => a.studentName.localeCompare(b.studentName)));
      setLastRefresh(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLoadError('Failed to load cases: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const handleApprove = async (
    caseNumber: string,
    role: 'supervisor1' | 'supervisor2' | 'drpaul',
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
              [role === 'supervisor1'
                ? 'supervisor1Approval'
                : role === 'supervisor2'
                ? 'supervisor2Approval'
                : 'drpaulApproval']: { approved: true },
            }
          : c
      )
    );
  };

  const handleRevoke = async (caseNumber: string) => {
    await revokeApproval(caseNumber);
    setCases((prev) =>
      prev.map((c) => (c.caseNumber === caseNumber ? { ...c, greenLight: false, approvalStage: 'drpaul' } : c))
    );
  };

  const ROLE_TITLE: Record<string, string> = {
    supervisor: 'Supervisor',
    drpaul: 'Dr. Paul — Lead Supervisor',
  };

  const isDrPaul = userProfile?.role === 'drpaul';
  const isSupervisor = userProfile?.role === 'supervisor';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Supervisor Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              {ROLE_TITLE[userProfile?.role ?? 'supervisor']} · All student case records
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
        {isDrPaul && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 text-lg">✅</span>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Dr. Paul — Lead Supervisor</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  You provide final approval for all case reports. Cases must be approved by both Supervisor 1 and Supervisor 2 before reaching you.
                </p>
              </div>
            </div>
          </div>
        )}
        {isSupervisor && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-violet-600 text-lg">👨‍⚕️</span>
              <div>
                <p className="text-sm font-semibold text-violet-900">Supervisor Review Panel</p>
                <p className="text-sm text-violet-700 mt-0.5">
                  You review case submissions assigned to you by students. Your role depends on the case: you may be the primary reviewer, secondary reviewer, or both depending on student assignments.
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

        {/* Approval stage legend */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Approval Pipeline</p>
          <div className="space-y-2">
            {[
              { color: 'bg-slate-300', label: 'Pending', desc: 'Awaiting submission & Supervisor 1 review' },
              { color: 'bg-orange-400', label: 'Supervisor 1', desc: 'Awaiting Supervisor 1 approval' },
              { color: 'bg-amber-400', label: 'Supervisor 2', desc: 'Supervisor 1 approved, awaiting Supervisor 2' },
              { color: 'bg-yellow-300', label: 'Dr. Paul', desc: 'Both supervisors approved, awaiting Dr. Paul' },
              { color: 'bg-emerald-500', label: 'Approved', desc: 'Final approval granted by Dr. Paul' },
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
            isDrPaul={isDrPaul}
            isSupervisor={isSupervisor}
            supervisorName={userProfile?.name}
            onApprove={handleApprove}
            onRevoke={handleRevoke}
          />
        )}
      </main>
    </div>
  );
}
