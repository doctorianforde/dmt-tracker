'use client';

import { useState } from 'react';
import { submitBugReport, type BugReportResult } from '@/lib/api-client';

// Lengths match LIMITS in lib/bug-report-server.ts.
const SUMMARY_MAX = 120;
const DESCRIPTION_MAX = 5000;
const STEPS_MAX = 3000;

export default function BugReportForm({ email, onDone }: { email: string; onDone?: () => void }) {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<BugReportResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!summary.trim() || !description.trim()) return setError('Please fill in the summary and what went wrong.');

    setBusy(true);
    try {
      setSent(await submitBugReport({ summary, description, steps }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4" role="status">
        <div className="rounded-control px-4 py-4 bg-ok/10 text-ok">
          <p className="text-sm">Your report has been sent to the developers.</p>
          <p className="display text-2xl mt-1">Issue {sent.issueNumber}</p>
        </div>
        <p className="text-sm text-muted">
          {sent.confirmationSent
            ? <>A confirmation with your issue number has been emailed to <strong className="text-ink">{email}</strong>.</>
            : <>We couldn’t email you a confirmation, so please note your issue number: <strong className="text-ink">{sent.issueNumber}</strong>.</>}
        </p>
        {onDone && <button type="button" onClick={onDone} className="btn-primary">Done</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="bug-summary">Summary</label>
        <input id="bug-summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="input"
          maxLength={SUMMARY_MAX} placeholder="e.g. Save button does nothing on my case" required />
      </div>
      <div>
        <label className="field-label" htmlFor="bug-description">What went wrong?</label>
        <textarea id="bug-description" value={description} onChange={(e) => setDescription(e.target.value)}
          className="input resize-y" rows={4} maxLength={DESCRIPTION_MAX}
          placeholder="What did you expect to happen, and what happened instead?" required />
      </div>
      <div>
        <label className="field-label" htmlFor="bug-steps">Steps to reproduce <span className="text-muted font-normal">(optional)</span></label>
        <textarea id="bug-steps" value={steps} onChange={(e) => setSteps(e.target.value)}
          className="input resize-y" rows={3} maxLength={STEPS_MAX} placeholder={'1. Go to…\n2. Click…'} />
      </div>
      {error && (
        <p className="text-sm rounded-control px-4 py-3 bg-danger/10 text-danger" role="alert">{error}</p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Send report'}</button>
        {onDone && <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>}
      </div>
      <p className="text-xs text-muted">
        You’ll get an issue number, and a confirmation will be emailed to {email}. The page you’re on and your browser are included to help us find the problem.
      </p>
    </form>
  );
}
