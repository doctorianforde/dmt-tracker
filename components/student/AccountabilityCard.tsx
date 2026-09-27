'use client';

import { useState } from 'react';
import { ACCOUNTABILITY_WINDOW_DAYS } from '@/lib/config';

// Shown once the deadline is close (or on request): asks the student whether
// they're on track and lets them give a reason for an extension.
export default function AccountabilityCard({
  daysLeft,
  extensionReason,
  onExtensionReasonChange,
}: {
  // Infinity when no deadline is set.
  daysLeft: number;
  extensionReason: string;
  onExtensionReasonChange: (value: string) => void;
}) {
  const [requested, setRequested] = useState(false);
  const deadlineClose = daysLeft <= ACCOUNTABILITY_WINDOW_DAYS;

  if (!deadlineClose && !requested && !extensionReason) {
    return (
      <button onClick={() => setRequested(true)} className="text-sm text-on-canvas-muted hover:underline mt-4">
        Won’t make your deadline? Request an extension →
      </button>
    );
  }

  return (
    <div className="card p-6 mt-4 border-warn/50">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-warn/15 text-warn flex items-center justify-center flex-shrink-0 font-bold" aria-hidden>!</span>
        <div className="flex-1">
          <p className="font-bold text-ink">Accountability check</p>
          <p className="text-sm text-muted mt-0.5">
            {!deadlineClose
              ? 'Tell your supervisors early if you think you won’t make your deadline.'
              : daysLeft < 0
              ? 'Your deadline has passed. Let your supervisors know what’s happening.'
              : daysLeft <= 14
              ? `Your deadline is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Are you on track?`
              : `Your deadline is approaching (${daysLeft} days). Let us know if you need an extension.`}
          </p>
        </div>
      </div>
      <label className="field-label mt-5" htmlFor="extension-reason">Extension reason (if you can’t meet the deadline)</label>
      <textarea
        id="extension-reason"
        value={extensionReason}
        onChange={(e) => onExtensionReasonChange(e.target.value)}
        placeholder="Explain why you need more time so your supervisors are informed…"
        rows={3}
        className="input resize-none"
      />
      <p className="text-xs text-muted mt-1.5">Saved with your case and visible to your supervisor and Lecturer. Only they can change your deadline.</p>
    </div>
  );
}
