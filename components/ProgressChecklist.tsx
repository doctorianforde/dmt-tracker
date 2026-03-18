'use client';

import type { CaseSections } from '@/types';

interface Props {
  sections: CaseSections;
  onChange?: (sections: CaseSections) => void;
  readOnly?: boolean;
}

const SECTIONS = [
  {
    key: 'intro' as keyof CaseSections,
    label: 'Introduction',
    description: 'Background & context of the case',
  },
  {
    key: 'caseReport' as keyof CaseSections,
    label: 'Case Report',
    description: 'Clinical findings & patient timeline',
  },
  {
    key: 'discussion' as keyof CaseSections,
    label: 'Discussion',
    description: 'Analysis & differential diagnosis',
  },
  {
    key: 'conclusion' as keyof CaseSections,
    label: 'Conclusion',
    description: 'Summary & learning outcomes',
  },
];

export default function ProgressChecklist({ sections, onChange, readOnly = false }: Props) {
  const completedCount = Object.values(sections).filter(Boolean).length;
  const progress = (completedCount / 4) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{completedCount} of 4 sections completed</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTIONS.map(({ key, label, description }) => {
          const checked = sections[key];
          return (
            <label
              key={key}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all select-none
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${checked
                  ? 'bg-sky-50 border-sky-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all
                  ${checked ? 'bg-sky-500 border-sky-500' : 'border-slate-300 bg-white'}`}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={readOnly}
                onChange={
                  readOnly ? undefined : () => onChange?.({ ...sections, [key]: !checked })
                }
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${checked ? 'text-sky-900' : 'text-slate-700'}`}>
                  {label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              </div>
              {checked && (
                <span className="text-xs font-medium text-sky-500 flex-shrink-0">✓</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
