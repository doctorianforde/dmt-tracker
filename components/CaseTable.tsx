'use client';

import { useState } from 'react';
import type { CaseRecord } from '@/types';

interface Props {
  cases: CaseRecord[];
  isDrPaul?: boolean;
  onGreenLight?: (caseNumber: string, value: boolean) => void;
}

const SECTION_KEYS = ['intro', 'caseReport', 'discussion', 'conclusion'] as const;
const SECTION_LABELS: Record<string, string> = {
  intro: 'Intro',
  caseReport: 'Report',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
};

export default function CaseTable({ cases, isDrPaul = false, onGreenLight }: Props) {
  const [search, setSearch] = useState('');

  const filtered = cases.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalComplete = cases.filter((c) => Object.values(c.sections).every(Boolean)).length;
  const totalSubmitted = cases.filter((c) => c.documentLink).length;
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
          <p className="text-xs text-emerald-500 mt-1">Green Lights Given</p>
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
                <th className="text-center px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Document</th>
                <th className="text-center px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                {isDrPaul && (
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rec) => {
                const completedCount = Object.values(rec.sections).filter(Boolean).length;
                return (
                  <tr key={rec.caseNumber} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{rec.studentName}</p>
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
                        <div className="flex items-center gap-1">
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
                        <span className="text-xs text-slate-400">{completedCount}/4</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center hidden md:table-cell">
                      {rec.documentLink ? (
                        <a
                          href={rec.documentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {rec.greenLight ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          Pending
                        </span>
                      )}
                    </td>
                    {isDrPaul && (
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => onGreenLight?.(rec.caseNumber, !rec.greenLight)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            rec.greenLight
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {rec.greenLight ? 'Revoke' : '✅ Green Light'}
                        </button>
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
