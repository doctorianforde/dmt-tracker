'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/contexts/ThemeContext';
import { BrandMark } from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  // The address a reset link was sent to, once sent.
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  const { user, userProfile, signIn, signUp, resetPassword } = useAuth();
  const { activeQuote } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.role === 'student') router.push('/student');
      else router.push('/supervisor');
    }
  }, [user, userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signUp(email, password, name.trim());
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      // Friendlier Firebase error messages
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password');
      } else if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists');
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openReset = () => {
    setResetting(true);
    setResetSentTo(null);
    setError('');
  };

  const closeReset = () => {
    setResetting(false);
    setResetSentTo(null);
    setError('');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResetSentTo(email.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Couldn’t send the reset email';
      if (msg.includes('invalid-email')) setError('That doesn’t look like a valid email address');
      else if (msg.includes('too-many-requests')) setError('Too many attempts. Please wait a few minutes and try again.');
      else if (msg.includes('user-not-found')) setResetSentTo(email.trim()); // don't reveal which emails have accounts
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Editorial brand panel */}
      <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
        <BrandMark className="text-on-canvas" />

        <div>
          <p className="eyebrow text-on-canvas-muted">DM Emergency Medicine · Case reports</p>
          <h2 className="display text-6xl xl:text-7xl leading-[0.92] text-on-canvas on-canvas-text mt-4 max-w-xl">
            From first draft to final approval.
          </h2>
          <ol className="mt-12 space-y-4 max-w-md">
            {[
              'Track all five case report sections',
              'See your deadline on a calendar',
              'Move through supervisor and Lecturer review',
              'Make it yours with six themes',
            ].map((text, i) => (
              <li key={text} className="flex items-baseline gap-4 border-t border-on-canvas/15 pt-4">
                <span className="display text-2xl text-accent on-canvas-text tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-on-canvas text-base">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-on-canvas-muted italic max-w-md" suppressHydrationWarning>“{activeQuote}”</p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <BrandMark className="text-on-canvas mb-8 lg:hidden" />

          {resetting ? (
          <div className="card p-7 sm:p-9">
            <p className="eyebrow text-muted">Account help</p>
            <h1 className="display text-4xl text-ink mt-2">Reset password</h1>
            {resetSentTo ? (
              <div className="mt-5 space-y-4" role="status">
                <p className="text-sm text-ink">
                  If an account exists for <strong>{resetSentTo}</strong>, we’ve sent it a link to choose a new password.
                </p>
                <p className="text-sm text-muted">
                  The email comes from Firebase (noreply@…firebaseapp.com). Check your spam or junk folder if it isn’t in your inbox within a few minutes.
                </p>
                <button onClick={closeReset} className="btn-primary w-full !py-3.5">Back to sign in</button>
                <button onClick={() => setResetSentTo(null)} className="btn-ghost w-full">Send to a different email</button>
              </div>
            ) : (
              <>
                <p className="text-muted text-sm mt-2 mb-7">Enter the email you signed up with and we’ll send you a reset link.</p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="field-label" htmlFor="reset-email">Email address</label>
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="input"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                  {error && (
                    <div className="rounded-control bg-danger/10 px-4 py-3 text-danger text-sm flex items-start gap-2" role="alert">
                      <span className="mt-0.5 flex-shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5 mt-2">
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
                <div className="mt-7 pt-6 border-t border-line text-center">
                  <button onClick={closeReset} className="text-sm text-accent font-semibold hover:underline">
                    ← Back to sign in
                  </button>
                </div>
              </>
            )}
          </div>
          ) : (
          <div className="card p-7 sm:p-9">
            <p className="eyebrow text-muted">{isSignUp ? 'New student' : 'Welcome back'}</p>
            <h1 className="display text-4xl text-ink mt-2">
              {isSignUp ? 'Create your account' : 'Sign in'}
            </h1>
            <p className="text-muted text-sm mt-2 mb-7">
              {isSignUp ? 'Register as a VIS student.' : 'Pick up where you left off.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="field-label" htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="input"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="password">Password</label>
                  {!isSignUp && (
                    <button type="button" onClick={openReset} className="text-xs text-accent font-semibold hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="rounded-control bg-danger/10 px-4 py-3 text-danger text-sm flex items-start gap-2" role="alert">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5 mt-2">
                {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in →'}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-line space-y-2 text-center">
              <p className="text-sm text-muted">
                {isSignUp ? 'Already have an account?' : 'New student?'}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-accent font-semibold hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Create an account'}
                </button>
              </p>
              {!isSignUp && (
                <p className="text-xs text-muted">
                  Staff?{' '}
                  <Link href="/supervisor-signup" className="text-accent font-semibold hover:underline">
                    Supervisor sign up
                  </Link>
                  {' · '}
                  <Link href="/supervisor-signup?role=lecturer" className="text-accent font-semibold hover:underline">
                    Lecturer sign up
                  </Link>
                </p>
              )}
              {isSignUp && (
                <p className="text-xs text-muted">
                  By creating an account you agree to the{' '}
                  <Link href="/tos" className="text-accent font-semibold hover:underline">Terms of Service</Link> and{' '}
                  <Link href="/privacy" className="text-accent font-semibold hover:underline">Privacy Policy</Link>.
                </p>
              )}
            </div>
          </div>
          )}
          <SiteFooter />
        </div>
      </section>
    </div>
  );
}
