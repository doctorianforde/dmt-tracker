'use client';

import { useState } from 'react';
import { URGENCY_STYLES } from '@/components/DeadlineCalendar';
import { daysUntil, deadlineUrgency, describeDaysLeft } from '@/lib/deadlines';

// Deadline editor, one per student row.

export default function DeadlineCell({
  value,
  disabled,
  onSave,
}: {
  value?: string;
  disabled?: boolean;
  onSave: (deadline: string | null) => Promise<boolean>;
}) {
  // Remounted (via key) whenever the saved value changes, so the draft always
  // starts from the latest saved deadline.
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const changed = draft !== (value ?? '');

  const save = async (next: string | null) => {
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  };

  const days = value ? daysUntil(value) : null;

  return (
    <div className="flex flex-col gap-1.5 min-w-[11rem]">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled || saving}
          className="input !py-1.5 !px-2.5 text-xs w-[9.5rem]"
          aria-label="Submission deadline"
        />
        {changed && draft && (
          <button onClick={() => save(draft)} disabled={saving} className="btn-primary !px-3 !py-1.5 text-xs">
            {saving ? '…' : 'Set'}
          </button>
        )}
        {changed && (
          <button onClick={() => setDraft(value ?? '')} disabled={saving} className="btn-ghost !px-2 !py-1.5 text-xs" aria-label="Undo change">
            ↺
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value && days !== null && !changed && (
          <span className={`chip !py-0.5 ${URGENCY_STYLES[deadlineUrgency(days)].pill}`}>{describeDaysLeft(days)}</span>
        )}
        {value && !changed && (
          <button onClick={() => save(null)} disabled={saving || disabled} className="text-[11px] text-muted hover:text-danger">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
