'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BrandMark } from '@/components/Navbar';

const NOT_ON_LIST = '__not_on_list__';

type StaffRole = 'supervisor' | 'lecturer';

const ROLE_COPY: Record<StaffRole, { title: string; blurb: string; codeLabel: string }> = {
  supervisor: {
    title: 'Supervisor sign up',
    blurb: 'Review your students’ case reports. You need the supervisor invite code.',
    codeLabel: 'Supervisor invite code',
  },
  lecturer: {
    title: 'Lecturer sign up',
    blurb: 'Oversee every student, assign supervisors and give final approval. You need the lecturer invite code.',
    codeLabel: 'Lecturer invite code',
  },
};

// useSearchParams needs a Suspense boundary on a statically rendered page.
export default function SupervisorSignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<StaffRole>(searchParams.get('role') === 'lecturer' ? 'lecturer' : 'supervisor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  // '' = not chosen yet, NOT_ON_LIST, or a staff directory entry id.
  const [directoryChoice, setDirectoryChoice] = useState('');
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[] | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, userProfile, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.role === 'student') router.push('/student');
      else router.push('/supervisor');
    }
  }, [user, userProfile, router]);

  useEffect(() => {
    fetch('/api/staff-directory')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('unavailable'))))
      .then((data: { staff?: { id: string; name: string }[] }) => setStaffOptions(data.staff ?? []))
      // If the list can't load, staff can still sign up as "not on the list".
      .catch(() => setStaffOptions([]));
  }, []);

  const chooseDirectoryEntry = (value: string) => {
    setDirectoryChoice(value);
    const entry = staffOptions?.find((s) => s.id === value);
    // Pre-fill the listed name; they can still edit it below.
    setName(entry ? entry.name : '');
  };

  // Lecturers only need the staff list if they also supervise students.
  const effectiveChoice = directoryChoice || (role === 'lecturer' ? NOT_ON_LIST : '');
  const copy = ROLE_COPY[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!effectiveChoice) {
      setError('Please choose your name from the staff list, or “I’m not on this list yet”.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/supervisor-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email,
          password,
          code: code.trim(),
          role,
          ...(effectiveChoice !== NOT_ON_LIST ? { directoryId: effectiveChoice } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Sign-up failed');
        return;
      }
      await signIn(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-up failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
        <BrandMark className="text-on-canvas" />

        <div>
          <p className="eyebrow text-on-canvas-muted">Staff accounts</p>
          <h2 className="display text-6xl xl:text-7xl leading-[0.92] text-on-canvas on-canvas-text mt-4 max-w-xl">
            Guide every case to the finish line.
          </h2>
          <ol className="mt-12 space-y-4 max-w-md">
            {[
              'Review your assigned students’ case records',
              'Set each student’s submission deadline',
              'See every deadline on one calendar',
              'Lecturers give final approval',
            ].map((text, i) => (
              <li key={text} className="flex items-baseline gap-4 border-t border-on-canvas/15 pt-4">
                <span className="display text-2xl text-accent on-canvas-text tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-on-canvas text-base">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-on-canvas-muted max-w-md">
          Supervisors review their students’ cases. Lecturers oversee everyone and give final approval.
        </p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <BrandMark className="text-on-canvas mb-8 lg:hidden" />

          <div className="card p-7 sm:p-9">
            <p className="eyebrow text-muted">Staff accounts</p>
            <h1 className="display text-4xl text-ink mt-2">{copy.title}</h1>
            <p className="text-muted text-sm mt-2 mb-6">{copy.blurb}</p>

            <div role="radiogroup" aria-label="I’m signing up as" className="grid grid-cols-2 gap-1 p-1 rounded-control bg-ink/5 mb-6">
              {(['supervisor', 'lecturer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => {
                    setRole(r);
                    setError('');
                  }}
                  className={`rounded-control py-2.5 text-sm font-semibold transition ${
                    role === r ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {r === 'supervisor' ? 'Supervisor' : 'Lecturer'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="directory">
                  {role === 'lecturer' ? 'Do you also supervise students?' : 'Are you on our staff list?'}
                </label>
                <select
                  id="directory"
                  value={effectiveChoice}
                  onChange={(e) => chooseDirectoryEntry(e.target.value)}
                  className="input"
                  disabled={staffOptions === null}
                  required
                >
                  {role === 'supervisor' && (
                    <option value="" disabled>{staffOptions === null ? 'Loading staff list…' : 'Select your name…'}</option>
                  )}
                  {role === 'lecturer' && <option value={NOT_ON_LIST}>No — I don’t supervise students</option>}
                  {staffOptions?.map((s) => (
                    <option key={s.id} value={s.id}>{role === 'lecturer' ? `Yes — I’m ${s.name}` : s.name}</option>
                  ))}
                  {role === 'supervisor' && <option value={NOT_ON_LIST}>I’m not on this list yet</option>}
                </select>
                <p className="text-xs text-muted mt-1.5">
                  {role === 'lecturer'
                    ? 'If you’re on the supervisor list, pick your name so students who chose you are linked to you.'
                    : 'Students may already have chosen you as their supervisor. Picking your name links them to you.'}
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="name">
                  {effectiveChoice && effectiveChoice !== NOT_ON_LIST ? 'Your name as it should appear' : 'Full name'}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="input"
                  autoComplete="name"
                  required
                />
                {effectiveChoice && effectiveChoice !== NOT_ON_LIST && (
                  <p className="text-xs text-muted mt-1.5">Edit this if you’d like it written differently, e.g. with your full first name.</p>
                )}
              </div>

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
                <label className="field-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="code">{copy.codeLabel}</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your invite code"
                  className="input font-mono tracking-widest"
                  required
                />
                <p className="text-xs text-muted mt-1.5">
                  Contact your administrator if you don&apos;t have your invite code
                </p>
              </div>

              {error && (
                <div className="rounded-control bg-danger/10 px-4 py-3 text-danger text-sm flex items-start gap-2" role="alert">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5 mt-2">
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-line text-center space-y-2">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link href="/" className="text-accent font-semibold hover:underline">Sign in</Link>
              </p>
              <p className="text-xs text-muted">
                Students register on the{' '}
                <Link href="/" className="text-accent hover:underline">main sign-up page</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
