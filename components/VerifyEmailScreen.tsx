'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { BrandMark } from '@/components/Navbar';

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('too-many-requests')) return 'We’ve sent a few already. Please wait a few minutes before asking for another.';
  return msg;
}

// Shown instead of any dashboard until the user clicks the confirmation link
// Firebase emailed them at sign-up.
export default function VerifyEmailScreen() {
  const { user, sendVerificationEmail, refreshVerification, signOut } = useAuth();
  const [busy, setBusy] = useState<'check' | 'resend' | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const check = async () => {
    setBusy('check');
    setMessage(null);
    try {
      const verified = await refreshVerification();
      if (!verified) setMessage({ text: 'We can’t see the confirmation yet. Click the link in the email, then try again.', ok: false });
    } catch (err) {
      setMessage({ text: friendly(err), ok: false });
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    setBusy('resend');
    setMessage(null);
    try {
      await sendVerificationEmail();
      setMessage({ text: 'Sent! Check your inbox (and spam folder).', ok: true });
    } catch (err) {
      setMessage({ text: friendly(err), ok: false });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <BrandMark className="text-on-canvas mb-8" />
        <div className="card p-7 sm:p-9">
          <p className="eyebrow text-muted">One more step</p>
          <h1 className="display text-4xl text-ink mt-2">Confirm your email</h1>
          <p className="text-sm text-ink mt-4">
            We sent a confirmation link to <strong>{user?.email}</strong>. Click it to activate your account, then come back here.
          </p>
          <p className="text-sm text-muted mt-2">
            It comes from noreply@…firebaseapp.com. Check your spam or junk folder if you can’t find it.
          </p>

          {message && (
            <p className={`text-sm mt-5 rounded-control px-4 py-3 ${message.ok ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`} role="status">
              {message.text}
            </p>
          )}

          <div className="mt-6 space-y-2">
            <button onClick={check} disabled={busy !== null} className="btn-primary w-full !py-3.5">
              {busy === 'check' ? 'Checking…' : 'I’ve confirmed — continue →'}
            </button>
            <button onClick={resend} disabled={busy !== null} className="btn-secondary w-full">
              {busy === 'resend' ? 'Sending…' : 'Resend email'}
            </button>
          </div>

          <div className="mt-7 pt-6 border-t border-line text-center">
            <button onClick={() => signOut()} className="text-sm text-muted hover:text-ink">
              Wrong email? Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
