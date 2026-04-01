'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/types';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'supervisor1', label: 'Supervisor 1' },
  { value: 'supervisor2', label: 'Supervisor 2' },
  { value: 'drpaul', label: 'Dr. Paul (Lead Supervisor)' },
];

const ROLE_CODES: Record<string, string | undefined> = {
  supervisor1: process.env.NEXT_PUBLIC_CODE_SUPERVISOR1,
  supervisor2: process.env.NEXT_PUBLIC_CODE_SUPERVISOR2,
  drpaul: process.env.NEXT_PUBLIC_CODE_DRPAUL,
};

export default function SupervisorSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('supervisor1');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, userProfile, signUpWithRole } = useAuth();
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

    // Validate invite code
    const expectedCode = ROLE_CODES[role];
    if (!expectedCode) {
      setError('Invite codes are not configured. Contact the administrator.');
      return;
    }
    if (code.trim() !== expectedCode.trim()) {
      setError('Incorrect invite code for this role. Please check with your administrator.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithRole(email, password, name.trim(), role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-up failed';
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists. Try signing in.');
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels: Record<UserRole, { color: string; badge: string }> = {
    student: { color: 'sky', badge: 'bg-sky-100 text-sky-800' },
    supervisor1: { color: 'violet', badge: 'bg-violet-100 text-violet-800' },
    supervisor2: { color: 'indigo', badge: 'bg-indigo-100 text-indigo-800' },
    drpaul: { color: 'emerald', badge: 'bg-emerald-100 text-emerald-800' },
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-700 via-violet-800 to-slate-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">VIS</span>
            </div>
            <span className="text-white/90 font-semibold text-lg">VIS</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-5">
            Supervisor &amp;
            <br />
            Lecturer
            <br />
            <span className="text-violet-300">Account Setup</span>
          </h2>
          <p className="text-violet-200 text-base leading-relaxed max-w-sm">
            Register your supervisor account using the invite code provided by your administrator.
            You will have access to all student case records.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { icon: '👁️', text: 'View all student case records' },
            { icon: '📊', text: 'Track progress across the entire cohort' },
            { icon: '✅', text: 'Dr. Paul can issue Green Light approvals' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-violet-100/80">
              <span>{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
          <p className="text-violet-300/60 text-xs pt-2">
            Student accounts use the main sign-up page
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">VIS</span>
            </div>
            <span className="font-semibold text-slate-800">VIS</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900">Supervisor sign up</h1>
              <p className="text-slate-500 text-sm mt-1">
                You need an invite code for your role
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Your Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
                        role === opt.value
                          ? 'border-violet-500 bg-violet-50 text-violet-800'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected role badge */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleLabels[role].badge}`}>
                  {ROLE_OPTIONS.find((o) => o.value === role)?.label}
                </span>
                <span className="text-xs text-slate-400">selected</span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              {/* Invite code */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your role invite code"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono tracking-widest"
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Each role has a unique code — contact the administrator if you don&apos;t have yours
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
              >
                {submitting ? 'Creating account...' : 'Create Supervisor Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/" className="text-violet-600 hover:text-violet-800 font-semibold">
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Students register on the{' '}
                <Link href="/" className="text-sky-600 hover:text-sky-800">
                  main sign-up page
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
