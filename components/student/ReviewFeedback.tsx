import type { ReviewFeedback as Feedback } from '@/lib/case-state';

// Banners above the student's dashboard: changes requested (with a resubmit
// button), resubmitted, or approved.
export default function ReviewFeedback({
  feedback,
  busy,
  submitting,
  onResubmit,
  onStartNewCase,
}: {
  feedback: Feedback;
  busy: boolean;
  submitting: boolean;
  onResubmit: () => void;
  // Offered once the case is approved.
  onStartNewCase?: () => void;
}) {
  const { stage, rejectionReason, resubmitted } = feedback;

  return (
    <>
      {rejectionReason && !resubmitted && (
        <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-danger/40">
          <span className="w-11 h-11 rounded-full bg-danger/15 text-danger flex items-center justify-center text-lg flex-shrink-0" aria-hidden>✕</span>
          <div className="flex-1">
            <p className="font-bold text-ink">Changes requested</p>
            <p className="text-sm text-ink/80 mt-0.5">“{rejectionReason}”</p>
            <p className="text-xs text-muted mt-1.5">Make the changes, then let your reviewer know it’s ready for another look.</p>
          </div>
          <button onClick={onResubmit} disabled={busy} className="btn-primary whitespace-nowrap">
            {submitting ? 'Sending…' : 'Mark as ready for re-review'}
          </button>
        </div>
      )}
      {resubmitted && (
        <div className="card p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-full bg-info/15 text-info flex items-center justify-center text-lg flex-shrink-0" aria-hidden>↻</span>
          <div>
            <p className="font-bold text-ink">Resubmitted for re-review</p>
            <p className="text-sm text-muted mt-0.5">Your reviewer can see you’ve addressed their feedback: “{rejectionReason}”</p>
          </div>
        </div>
      )}
      {stage === 'approved' && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-11 h-11 rounded-full bg-ok/15 text-ok flex items-center justify-center text-xl flex-shrink-0" aria-hidden>✓</span>
          <div>
            <p className="font-bold text-ink">Case approved 🎉</p>
            <p className="text-sm text-muted mt-0.5">Your Lecturer has given your case report final approval.</p>
          </div>
          {onStartNewCase && (
            <button onClick={onStartNewCase} className="btn-primary whitespace-nowrap sm:ml-auto">
              Start your next case →
            </button>
          )}
        </div>
      )}
    </>
  );
}
