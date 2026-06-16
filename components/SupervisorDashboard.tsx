'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import CaseTable from '@/components/CaseTable';
import { getAllCases, updateGreenLight, updateApprovalStage } from '@/lib/firestore';
import type { CaseRecord, ApprovalStage } from '@/types';

const SUPERVISOR_ROLES = ['supervisor1', 'supervisor2', 'drpaul'] as const;

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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCases();
      setCases(data.sort((a, b) => a.studentName.localeCompare(b.studentName)));
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const handleGreenLight = async (caseNumber: string, value: boolean) => {
    await updateGreenLight(caseNumber, value);
    setCases((prev) =>
      prev.map((c) => (c.caseNumber === caseNumber ? { ...c, greenLight: value, approvalStage: value ? 'approved' : 'drpaul' } : c))
    );
  };

  const handleStageAdvance = async (caseNumber: string, stage: ApprovalStage) => {
    await updateApprovalStage(caseNumber, stage);
    setCases((prev) =>
      prev.map((c) => (c.caseNumber === caseNumber
        ? { ...c, approvalStage: stage, greenLight: stage === 'approved' }
        : c))
    );
  };

  const ROLE_TITLE: Record<string, string> = {
    supervisor1: 'Supervisor 1',
    supervisor2: 'Supervisor 2',
    drpaul: 'Dr. Paul — Lead Supervisor',
  };

  const isDrPaul = userProfile?.role === 'drpaul';
  const supervisorRole = (userProfile?.role === 'supervisor1' || userProfile?.role === 'supervisor2')
    ? userProfile.role
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Supervisor Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              {ROLE_TITLE[userProfile?.role ?? 'supervisor1']} · All student case records
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
        {userProfile?.role === 'supervisor1' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-orange-500 text-lg">🟠</span>
              <div>
                <p className="text-sm font-semibold text-orange-800">Supervisor 1 — Primary Reviewer</p>
                <p className="text-sm text-orange-700 mt-0.5">
                  You are the first reviewer for all cases. You must approve each case before it can proceed to Supervisor 2. You can also assign a second supervisor if needed.
                </p>
                <ul className="text-sm text-orange-700 mt-2 ml-4 space-y-1 list-disc">
                  <li>Review case completeness and quality</li>
                  <li>Approve cases and forward to Supervisor 2</li>
                  <li>Provide feedback for improvements</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {userProfile?.role === 'supervisor2' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-amber-500 text-lg">🟡</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Supervisor 2 — Secondary Reviewer</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  You review cases that have already been approved by Supervisor 1. Both supervisors must approve before the case moves to Dr. Paul.
                </p>
                <ul className="text-sm text-amber-700 mt-2 ml-4 space-y-1 list-disc">
                  <li>Review cases already approved by Supervisor 1</li>
                  <li>Provide additional feedback and suggestions</li>
                  <li>Approve and forward to Dr. Paul for final approval</li>
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
            supervisorRole={supervisorRole}
            onGreenLight={handleGreenLight}
            onStageAdvance={handleStageAdvance}
          />
        )}
      </main>
    </div>
  );
}
