import { STAGE_STYLES } from '@/components/CaseTable';
import { SECTION_KEYS, stageOf } from '@/lib/case-state';
import type { CaseRecord } from '@/types';

// The student's earlier cases, newest first.
export default function CaseHistory({ cases }: { cases: CaseRecord[] }) {
  const sorted = [...cases].sort(
    (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
  );

  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-line">
        {sorted.map((c) => {
          const stage = stageOf(c);
          const style = STAGE_STYLES[stage];
          const done = SECTION_KEYS.filter((k) => c.sections?.[k]).length;
          const approvedAt = c.lecturerApproval?.approvedAt;
          return (
            <li key={c.caseNumber} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <span className="font-mono text-xs bg-ink/5 text-ink px-2 py-1 rounded">{c.caseNumber}</span>
                <span className="text-xs text-muted ml-3">
                  {done}/5 sections{c.supervisorName ? ` · ${c.supervisorName}` : ''}
                  {stage === 'approved' && approvedAt ? ` · approved ${approvedAt.toLocaleDateString('en-GB')}` : ''}
                </span>
              </div>
              <span className={`chip ${style.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
