'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import ThemePicker from '@/components/ThemePicker';
import Avatar from '@/components/ui/Avatar';

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

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-20 px-3 sm:px-6 pt-3">
      <div className="card max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 backdrop-blur">
        <BrandMark className="text-ink" />

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemePicker />
          {userProfile && (
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 ml-1 border-l border-line">
              <Avatar name={userProfile.name} photoURL={userProfile.photoURL || undefined} size={34} />
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-ink">{userProfile.name}</p>
                <p className="text-[11px] text-muted">{ROLE_LABELS[userProfile.role] ?? userProfile.role}</p>
              </div>
            </div>
          )}
          <button onClick={handleSignOut} className="btn-ghost !px-3 !py-2 whitespace-nowrap">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
