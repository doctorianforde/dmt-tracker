'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, userProfile, signIn, signUp } = useAuth();
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

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-700 via-sky-800 to-slate-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">DMT</span>
            </div>
            <span className="text-white/90 font-semibold text-lg">Case Tracker</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-5">
            DM Emergency
            <br />
            Medicine
            <br />
            <span className="text-sky-300">Case Report Portal</span>
          </h2>
          <p className="text-sky-200 text-base leading-relaxed max-w-sm">
            Track your DM case report progress, collaborate with supervisors, and manage
            submissions — all in one place.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { icon: '📋', text: 'Track all four case report sections' },
            { icon: '📎', text: 'Upload and manage your case document' },
            { icon: '✅', text: 'Receive Dr. Paul\'s green light approval' },
            { icon: '📅', text: 'Submission deadline: June 2026' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sky-100/80">
              <span>{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DMT</span>
            </div>
            <span className="font-semibold text-slate-800">Case Tracker</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {isSignUp
                  ? 'Register as a new DMT student'
                  : 'Sign in to your portal account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow"
                  required
                  minLength={6}
                />
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
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
              >
                {submitting
                  ? 'Please wait...'
                  : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-center">
              <p className="text-sm text-slate-500">
                {isSignUp ? 'Already have an account?' : 'New student?'}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sky-600 hover:text-sky-800 font-semibold"
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </button>
              </p>
              {!isSignUp && (
                <p className="text-xs text-slate-400">
                  Supervisor or lecturer?{' '}
                  <a href="/supervisor-signup" className="text-violet-600 hover:text-violet-800 font-semibold">
                    Create supervisor account →
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
