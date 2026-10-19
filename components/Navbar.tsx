'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import ThemePicker from '@/components/ThemePicker';
import Avatar from '@/components/ui/Avatar';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import BugReportForm from '@/components/BugReportForm';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  supervisor: 'Supervisor',
  lecturer: 'Lecturer',
};

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="w-9 h-9 rounded-control bg-accent text-on-accent flex items-center justify-center display text-sm">
        V
      </span>
      <span className="leading-none">
        <span className="display block text-lg">VIS</span>
        <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] opacity-60 mt-0.5">Verified Insight</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<'password' | 'bug' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !dialog) return;
    const onDown = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setDialog(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, dialog]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-20 px-3 sm:px-6 pt-3">
      <div className="card max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 backdrop-blur">
        <BrandMark className="text-ink" />

        <div className="flex items-center gap-1 sm:gap-2">
          {userProfile && (
            <button
              onClick={() => setDialog('bug')}
              aria-label="Report a bug"
              title="Report a bug"
              className="btn-ghost !px-2.5 sm:!px-3 !py-2 whitespace-nowrap"
            >
              <span aria-hidden>🐞</span>
              <span className="hidden md:inline ml-1.5">Report a bug</span>
            </button>
          )}
          <ThemePicker />
          {userProfile && (
            <div className="relative pl-2 sm:pl-3 ml-1 border-l border-line" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 rounded-control px-1.5 py-1 hover:bg-ink/5 text-left"
              >
                <Avatar name={userProfile.name} photoURL={userProfile.photoURL || undefined} size={34} />
                <span className="hidden sm:block leading-tight">
                  <span className="block text-sm font-semibold text-ink">{userProfile.name}</span>
                  <span className="block text-[11px] text-muted">{ROLE_LABELS[userProfile.role] ?? userProfile.role}</span>
                </span>
              </button>
              {menuOpen && (
                <div role="menu" className="card absolute right-0 mt-2 w-56 p-1.5 z-30">
                  <p className="px-3 pt-2 pb-1.5 text-xs text-muted truncate">{userProfile.email}</p>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setDialog('password');
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-ink hover:bg-ink/5"
                  >
                    Change password
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setDialog('bug');
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-ink hover:bg-ink/5"
                  >
                    Report a bug
                  </button>
                  <button role="menuitem" onClick={handleSignOut} className="w-full text-left rounded-lg px-3 py-2 text-sm text-ink hover:bg-ink/5">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={handleSignOut} className="btn-ghost !px-3 !py-2 whitespace-nowrap">
            Sign out
          </button>
        </div>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="navbar-dialog-title" className="card w-full max-w-lg p-6 sm:p-8 mt-16 sm:mt-0">
            {dialog === 'password' ? (
              <>
                <h2 id="navbar-dialog-title" className="display text-3xl text-ink mb-5">Change password</h2>
                <ChangePasswordForm onDone={() => setDialog(null)} />
              </>
            ) : (
              <>
                <h2 id="navbar-dialog-title" className="display text-3xl text-ink mb-1">Report a bug</h2>
                <p className="text-sm text-muted mb-5">Tell us what went wrong and we’ll pass it to the developers.</p>
                <BugReportForm email={userProfile?.email ?? 'your email'} onDone={() => setDialog(null)} />
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
