'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('invalid-credential') || msg.includes('wrong-password')) return 'Your current password is incorrect.';
  if (msg.includes('weak-password')) return 'Choose a stronger new password (at least 6 characters).';
  if (msg.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes and try again.';
  if (msg.includes('requires-recent-login')) return 'Please sign out and back in, then try again.';
  return msg;
}

export default function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (next.length < 6) return setMessage({ text: 'Your new password must be at least 6 characters.', ok: false });
    if (next !== confirm) return setMessage({ text: 'The new passwords don’t match.', ok: false });
    if (next === current) return setMessage({ text: 'Your new password must be different from the current one.', ok: false });

    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setMessage({ text: 'Password changed. Use it next time you sign in.', ok: true });
    } catch (err) {
      setMessage({ text: friendly(err), ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="current-password">Current password</label>
        <input id="current-password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
          className="input" autoComplete="current-password" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="new-password">New password</label>
          <input id="new-password" type="password" value={next} onChange={(e) => setNext(e.target.value)}
            className="input" autoComplete="new-password" minLength={6} required />
        </div>
        <div>
          <label className="field-label" htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="input" autoComplete="new-password" minLength={6} required />
        </div>
      </div>
      {message && (
        <p className={`text-sm rounded-control px-4 py-3 ${message.ok ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`} role="status">
          {message.text}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Changing…' : 'Change password'}</button>
        {onDone && (
          <button type="button" onClick={onDone} className="btn-ghost">{message?.ok ? 'Done' : 'Cancel'}</button>
        )}
      </div>
      <p className="text-xs text-muted">Forgot your current password? Sign out and use “Forgot password?” on the sign-in page.</p>
    </form>
  );
}
