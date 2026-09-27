import type { ApprovalStage } from '@/types';

export const STAGE_INFO: Record<ApprovalStage, { label: string; step: number }> = {
  pending: { label: 'Draft — not yet submitted', step: 0 },
  supervisor: { label: 'With your supervisor', step: 1 },
  lecturer: { label: 'With the Lecturer', step: 2 },
  approved: { label: 'Approved', step: 3 },
};

const PIPELINE_STEPS: { stage: ApprovalStage; label: string; dot: string }[] = [
  { stage: 'pending', label: 'Draft', dot: 'bg-ink' },
  { stage: 'supervisor', label: 'Supervisor', dot: 'bg-warn' },
  { stage: 'lecturer', label: 'Lecturer', dot: 'bg-gold' },
  { stage: 'approved', label: 'Approved', dot: 'bg-ok' },
];

// The four-step pipeline, plus the submit prompt while the case is a draft.
export default function ApprovalPipeline({
  stage,
  supervisorName,
  canSubmit,
  hasSupervisor,
  supervisorSignedUp,
  busy,
  submitting,
  onSubmit,
}: {
  stage: ApprovalStage;
  supervisorName?: string;
  // The case exists and is still a draft.
  canSubmit: boolean;
  hasSupervisor: boolean;
  supervisorSignedUp: boolean;
  busy: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const currentStep = STAGE_INFO[stage].step;

  return (
    <div className="card p-6 sm:p-8">
      <ol className="grid grid-cols-4">
        {PIPELINE_STEPS.map((step, i) => {
          const reached = currentStep >= i;
          const current = currentStep === i;
          return (
            <li key={step.stage} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span
                  className={`absolute top-4 right-1/2 w-full h-1 -z-0 rounded-full ${currentStep >= i ? step.dot : 'bg-ink/10'}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition
                  ${reached ? `${step.dot} text-white` : 'bg-surface2 text-muted'}
                  ${current ? 'ring-4 ring-accent/25 scale-110' : ''}`}
              >
                {reached ? '✓' : i + 1}
              </span>
              <span className={`text-xs sm:text-sm mt-2 font-semibold ${current ? 'text-ink' : 'text-muted'}`}>
                {step.stage === 'supervisor' && supervisorName ? supervisorName : step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {canSubmit && (
        <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-ink">Ready for review?</p>
            <p className="text-sm text-muted mt-0.5">
              {!hasSupervisor
                ? 'Choose your supervisor in your profile below before you submit.'
                : supervisorSignedUp
                ? `Send your case to ${supervisorName} when you’re ready for feedback.`
                : `${supervisorName} hasn’t joined VIS yet — your case will be waiting for them when they sign up.`}
            </p>
          </div>
          <button
            onClick={onSubmit}
            disabled={busy || !hasSupervisor}
            className="btn-primary whitespace-nowrap"
          >
            {submitting ? 'Submitting…' : 'Submit for review →'}
          </button>
        </div>
      )}
    </div>
  );
}
