'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  supervisor1: 'Supervisor 1',
  supervisor2: 'Supervisor 2',
  drpaul: 'Dr. Paul',
};

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-sky-100 text-sky-800',
  supervisor1: 'bg-violet-100 text-violet-800',
  supervisor2: 'bg-indigo-100 text-indigo-800',
  drpaul: 'bg-emerald-100 text-emerald-800',
};

const ROLE_BADGE_DARK: Record<string, string> = {
  student: 'bg-sky-900 text-sky-300',
  supervisor1: 'bg-violet-900 text-violet-300',
  supervisor2: 'bg-indigo-900 text-indigo-300',
  drpaul: 'bg-emerald-900 text-emerald-300',
};

interface NavbarProps {
  variant?: 'light' | 'dark';
}

export default function Navbar({ variant = 'light' }: NavbarProps) {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();
  const isDark = variant === 'dark';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900 border-b border-slate-700' : 'bg-white border-b border-slate-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">VIS</span>
          </div>
          <div>
            <p className={`font-semibold text-sm leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>VIS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userProfile && (
            <>
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-medium leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{userProfile.name}</p>
                <p className={`text-xs leading-none mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{userProfile.email}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? ROLE_BADGE_DARK[userProfile.role] : ROLE_BADGE[userProfile.role]}`}>
                {ROLE_LABELS[userProfile.role]}
              </span>
            </>
          )}
          <button
            onClick={handleSignOut}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
