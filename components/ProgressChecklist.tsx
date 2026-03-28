'use client';

import type { CaseSections } from '@/types';
import type { ThemeConfig } from '@/lib/themes';

interface Props {
  sections: CaseSections;
  onChange?: (sections: CaseSections) => void;
  readOnly?: boolean;
  theme?: ThemeConfig;
}

const SECTIONS = [
  {
    key: 'intro' as keyof CaseSections,
    label: 'Introduction',
    description: 'Background & context of the case',
    emoji: '📖',
  },
  {
    key: 'caseReport' as keyof CaseSections,
    label: 'Case Report',
    description: 'Clinical findings & patient timeline',
    emoji: '🩺',
  },
  {
    key: 'discussion' as keyof CaseSections,
    label: 'Discussion',
    description: 'Analysis & differential diagnosis',
    emoji: '💬',
  },
  {
    key: 'conclusion' as keyof CaseSections,
    label: 'Conclusion',
    description: 'Summary & learning outcomes',
    emoji: '🎯',
  },
  {
    key: 'references' as keyof CaseSections,
    label: 'References',
    description: 'Citations & bibliography',
    emoji: '📚',
  },
];

const TOTAL = SECTIONS.length;

export default function ProgressChecklist({ sections, onChange, readOnly = false, theme }: Props) {
  const completedCount = Object.values(sections).filter(Boolean).length;
  const progress = (completedCount / TOTAL) * 100;

  const progressGradient = theme?.progressGradient ?? 'from-sky-400 to-sky-600';
  const checkedBg = theme?.sectionCheckedBg ?? 'bg-sky-50';
  const checkedBorder = theme?.sectionCheckedBorder ?? 'border-sky-300';
  const checkedText = theme?.sectionCheckedText ?? 'text-sky-900';
  const checkboxBg = theme?.checkboxActiveBg ?? 'bg-sky-500';
  const checkboxBorder = theme?.checkboxActiveBorder ?? 'border-sky-500';
  const cardBg = theme?.cardBg ?? 'bg-white';
  const bodyText = theme?.bodyText ?? 'text-slate-700';

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-2" style={{ color: 'inherit' }}>
          <span className={theme?.mutedText ?? 'text-slate-500'}>{completedCount} of {TOTAL} sections completed</span>
          <span className={`font-medium ${theme?.mutedText ?? 'text-slate-500'}`}>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${progressGradient} rounded-full transition-all duration-700`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTIONS.map(({ key, label, description, emoji }) => {
          const checked = sections[key];
          return (
            <label
              key={key}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all select-none
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${checked
                  ? `${checkedBg} ${checkedBorder} shadow-sm`
                  : `${cardBg} border-slate-200 hover:border-slate-300`
                }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all
                  ${checked ? `${checkboxBg} ${checkboxBorder}` : 'border-slate-300 bg-white'}`}
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
                <p className={`text-sm font-semibold ${checked ? checkedText : bodyText}`}>
                  <span className="mr-1.5">{emoji}</span>{label}
                </p>
                <p className={`text-xs mt-0.5 ${theme?.mutedText ?? 'text-slate-400'}`}>{description}</p>
              </div>
              {checked && (
                <span className="text-xs font-medium flex-shrink-0" style={{ color: 'inherit' }}>✓</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
