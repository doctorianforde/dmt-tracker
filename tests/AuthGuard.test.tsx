import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/types';

vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe('AuthGuard', () => {
  const push = vi.fn();
  const signOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push });
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/supervisor');
  });

  it('shows a loading state while auth is loading', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      userProfile: null,
      loading: true,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to home', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(push).toHaveBeenCalledWith('/');
  });

  it('does not re-push to home when already there', () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(push).not.toHaveBeenCalled();
  });

  it('renders children for allowed roles', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: '123' } as unknown as ReturnType<typeof useAuth>['user'],
      userProfile: { role: 'student' } as UserProfile,
      loading: false,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('redirects users with the wrong role to their dashboard', () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/student');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: '123' } as unknown as ReturnType<typeof useAuth>['user'],
      userProfile: { role: 'supervisor' } as UserProfile,
      loading: false,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(push).toHaveBeenCalledWith('/supervisor');
  });

  it('does not re-push when the wrong-role redirect target is the current page', () => {
    // Regression test: this exact scenario (home === current pathname) caused an
    // infinite redirect loop in production — see AuthGuard.tsx's ROLE_HOME check.
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/supervisor');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: '123' } as unknown as ReturnType<typeof useAuth>['user'],
      userProfile: { role: 'supervisor' } as UserProfile,
      loading: false,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(push).not.toHaveBeenCalled();
  });

  it('signs out users with an unrecognized role instead of guessing a redirect', () => {
    // Regression test: a stale/invalid role value (e.g. from before a role-model
    // migration) has no safe ROLE_HOME entry. Guessing "/supervisor" here is what
    // caused the original infinite-loop bug when that guess matched the current page.
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: '123' } as unknown as ReturnType<typeof useAuth>['user'],
      userProfile: { role: 'drpaul' } as unknown as UserProfile,
      loading: false,
      signOut,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(signOut).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
