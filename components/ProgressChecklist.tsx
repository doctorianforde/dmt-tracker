'use client';

import type { CaseSections, ThemeMarkers } from '@/types';

interface Props {
  sections: CaseSections;
  onChange?: (sections: CaseSections) => void;
  readOnly?: boolean;
  markers?: ThemeMarkers;
}

const SECTIONS = [
  { key: 'intro' as keyof CaseSections, label: 'Introduction', description: 'Background & context of the case' },
  { key: 'caseReport' as keyof CaseSections, label: 'Case Report', description: 'Clinical findings & patient timeline' },
  { key: 'discussion' as keyof CaseSections, label: 'Discussion', description: 'Analysis & differential diagnosis' },
  { key: 'conclusion' as keyof CaseSections, label: 'Conclusion', description: 'Summary & learning outcomes' },
  { key: 'references' as keyof CaseSections, label: 'References', description: 'Citations & bibliography' },
];

const TOTAL = SECTIONS.length;

export default function ProgressChecklist({ sections, onChange, readOnly = false, markers }: Props) {
  const completedCount = Object.values(sections).filter(Boolean).length;
  const progress = (completedCount / TOTAL) * 100;

  return (
    <div className="space-y-5">
      {/* Segmented progress bar — one segment per section. */}
      <div>
        <div className="flex justify-between text-xs mb-2 text-muted">
          <span>{completedCount} of {TOTAL} sections complete</span>
          <span className="font-semibold text-ink tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {SECTIONS.map(({ key }) => (
            <div key={key} className={`h-2 rounded-full transition-colors duration-500 ${sections[key] ? 'bg-accent' : 'bg-ink/10'}`} />
          ))}
        </div>
      </div>

      <ol className="divide-y divide-line border-y border-line">
        {SECTIONS.map(({ key, label, description }, i) => {
          const checked = sections[key];
          return (
            <li key={key}>
              <label
                className={`flex items-center gap-4 py-3.5 px-1 select-none transition-colors
                  ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-ink/[0.03]'}`}
              >
                <span className="display text-lg w-7 text-muted tabular-nums" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={checked}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : () => onChange?.({ ...sections, [key]: !checked })}
                />
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-semibold ${checked ? 'text-ink' : 'text-ink/80'}`}>{label}</span>
                  <span className="block text-xs text-muted mt-0.5">{description}</span>
                </span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                    peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60
                    ${checked ? 'bg-accent border-accent text-on-accent scale-100' : 'border-line text-transparent'}`}
                  aria-hidden
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {markers && (
                  <span className="w-6 text-center text-base" aria-hidden>
                    {checked ? markers.completed : markers.pending}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
