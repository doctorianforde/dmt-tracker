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

export default function Navbar() {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">VIS</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-none">VIS System</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Verified Insight System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userProfile && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{userProfile.name}</p>
                <p className="text-xs text-slate-400 leading-none mt-0.5">{userProfile.email}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[userProfile.role]}`}>
                {ROLE_LABELS[userProfile.role]}
              </span>
            </>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
