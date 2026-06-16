'use client';

import { useState } from 'react';
import type { CaseRecord, ApprovalStage } from '@/types';

interface Props {
  cases: CaseRecord[];
  isDrPaul?: boolean;
  isSupervisor?: boolean;
  supervisorName?: string;
  onGreenLight?: (caseNumber: string, value: boolean) => void;
  onStageAdvance?: (caseNumber: string, stage: ApprovalStage) => void;
}

const SECTION_KEYS = ['intro', 'caseReport', 'discussion', 'conclusion', 'references'] as const;
const SECTION_LABELS: Record<string, string> = {
  intro: 'Intro',
  caseReport: 'Report',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
  references: 'References',
};

const STAGE_CONFIG: Record<ApprovalStage, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300' },
  supervisor1: { label: 'Sup. 1', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  supervisor2: { label: 'Sup. 2', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  drpaul: { label: 'Dr. Paul', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

function getNextStage(
  current: ApprovalStage,
  isSupervisor: boolean,
  isDrPaul: boolean,
  supervisorName: string | undefined,
  record: CaseRecord
): ApprovalStage | null {
  // Check if supervisor is assigned to this case
  if (isSupervisor && supervisorName) {
    const isSupervisor1 = record.supervisor1Name === supervisorName;
    const isSupervisor2 = record.supervisor2Name === supervisorName;

    if (isSupervisor1 && current === 'supervisor1' && !record.supervisor1Approval?.approved) {
      return 'supervisor2';
    }
    if (isSupervisor2 && current === 'supervisor2' && !record.supervisor2Approval?.approved && record.supervisor1Approval?.approved) {
      return 'drpaul';
    }
  }

  if (isDrPaul && current === 'drpaul' && record.supervisor1Approval?.approved && record.supervisor2Approval?.approved) {
    return 'approved';
  }

  return null;
}

function canApprove(
  stage: ApprovalStage,
  isSupervisor: boolean,
  isDrPaul: boolean,
  supervisorName: string | undefined,
  record: CaseRecord
): boolean {
  if (isSupervisor && supervisorName) {
    const isSupervisor1 = record.supervisor1Name === supervisorName;
    const isSupervisor2 = record.supervisor2Name === supervisorName;

    if (isSupervisor1 && stage === 'supervisor1' && !record.supervisor1Approval?.approved) return true;
    if (isSupervisor2 && stage === 'supervisor2' && !record.supervisor2Approval?.approved && record.supervisor1Approval?.approved) return true;
  }

  if (isDrPaul && stage === 'drpaul' && !record.drpaulApproval?.approved && record.supervisor1Approval?.approved && record.supervisor2Approval?.approved) {
    return true;
  }

  return false;
}

function getStageButtonLabel(next: ApprovalStage, supervisorName: string | undefined, record: CaseRecord): string {
  const isSupervisor1 = record.supervisor1Name === supervisorName;
  const isSupervisor2 = record.supervisor2Name === supervisorName;

  if (isSupervisor1) {
    if (next === 'supervisor2') return '✅ Approve & Send to Sup. 2';
  }
  if (isSupervisor2) {
    if (next === 'drpaul') return '🟡 Approve & Send to Dr. Paul';
  }
  if (next === 'approved') {
    return '✅ Grant Final Approval';
  }
  return 'Advance';
}

export default function CaseTable({ cases, isDrPaul = false, isSupervisor = false, supervisorName, onGreenLight, onStageAdvance }: Props) {
  const [search, setSearch] = useState('');

  const filtered = cases.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalComplete = cases.filter((c) =>
    Object.values(c.sections).every(Boolean)
  ).length;
  const totalSubmitted = cases.filter((c) => c.submitted).length;
  const totalGreenLights = cases.filter((c) => c.greenLight).length;

  if (cases.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl text-center py-20">
        <p className="text-5xl mb-4">📋</p>
        <p className="font-semibold text-slate-700">No case records yet</p>
        <p className="text-sm text-slate-400 mt-1">Student submissions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-slate-900">{cases.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Cases</p>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <p className="text-3xl font-bold text-violet-700">{totalComplete}</p>
          <p className="text-xs text-violet-500 mt-1">All Sections Done</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-3xl font-bold text-amber-700">{totalSubmitted}</p>
          <p className="text-xs text-amber-500 mt-1">Documents Linked</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-3xl font-bold text-emerald-700">{totalGreenLights}</p>
          <p className="text-xs text-emerald-500 mt-1">Approvals Given</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or case number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Case #</th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden sm:table-cell">Year</th>
                <th className="text-center px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Sections</th>
                <th className="text-center px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Stage</th>
                {(isSupervisor || isDrPaul) && (
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rec) => {
                const completedCount = Object.values(rec.sections).filter(Boolean).length;
                const stage: ApprovalStage = rec.approvalStage ?? (rec.greenLight ? 'approved' : 'pending');
                const stageStyle = STAGE_CONFIG[stage];
                const nextStage = getNextStage(stage, isSupervisor, isDrPaul, supervisorName, rec);
                const canApproveCase = canApprove(stage, isSupervisor, isDrPaul, supervisorName, rec);

                return (
                  <tr key={rec.caseNumber} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{rec.studentName}</p>
                      {(rec.supervisor1Name || rec.supervisor2Name) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[rec.supervisor1Name, rec.supervisor2Name].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {rec.caseNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs text-slate-500">
                        Y{rec.classYear} · {rec.startYear}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {SECTION_KEYS.map((key) => (
                            <div
                              key={key}
                              title={SECTION_LABELS[key]}
                              className={`w-2 h-2 rounded-full ${
                                rec.sections[key] ? 'bg-sky-500' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{completedCount}/5</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${stageStyle.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot}`} />
                        {stage === 'supervisor1' && rec.supervisor1Name
                          ? rec.supervisor1Name
                          : stage === 'supervisor2' && rec.supervisor2Name
                          ? rec.supervisor2Name
                          : stageStyle.label}
                      </span>
                    </td>
                    {(isSupervisor || isDrPaul) && (
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {stage === 'supervisor1' && rec.supervisor1Approval?.approved && (
                            <span className="text-xs text-emerald-600 font-semibold">✅ Approved by Sup. 1</span>
                          )}
                          {stage === 'supervisor2' && rec.supervisor2Approval?.approved && (
                            <span className="text-xs text-emerald-600 font-semibold">✅ Approved by Sup. 2</span>
                          )}
                          {stage === 'drpaul' && rec.drpaulApproval?.approved && (
                            <span className="text-xs text-emerald-600 font-semibold">✅ Approved by Dr. Paul</span>
                          )}
                          {canApproveCase && nextStage && (
                            <button
                              onClick={() => onStageAdvance?.(rec.caseNumber, nextStage)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 whitespace-nowrap"
                            >
                              {getStageButtonLabel(nextStage, supervisorName, rec)}
                            </button>
                          )}
                          {!canApproveCase && stage !== 'pending' && stage !== 'approved' && (
                            <span className="text-xs text-slate-400">Waiting for approval</span>
                          )}
                          {isDrPaul && stage === 'approved' && (
                            <button
                              onClick={() => onGreenLight?.(rec.caseNumber, false)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            >
                              Revoke
                            </button>
                          )}
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
          <div className="text-center py-10 text-slate-400 text-sm">
            No results match your search
          </div>
        )}
      </div>
    </div>
  );
}
