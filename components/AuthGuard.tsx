'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Where each role lands when it hits a route it's not allowed on. A role
// value outside this map (e.g. stale data from before a role migration)
// has no safe home to redirect to, so it's handled separately below.
const ROLE_HOME: Record<UserRole, string> = {
  student: '/student',
  supervisor: '/supervisor',
  drpaul: '/supervisor',
};

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (pathname !== '/') router.push('/');
      return;
    }
    if (!userProfile || allowedRoles.includes(userProfile.role)) return;

    const home = ROLE_HOME[userProfile.role];
    if (!home) {
      // Unrecognized role — there's no route to send them to, so sign out
      // rather than guess and risk redirecting back to this same page.
      signOut();
      return;
    }
    if (home !== pathname) router.push(home);
  }, [user, userProfile, loading, router, pathname, allowedRoles, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile || !allowedRoles.includes(userProfile.role)) return null;

  return <>{children}</>;
}
