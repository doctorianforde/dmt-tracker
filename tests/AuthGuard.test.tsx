import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';

vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('AuthGuard', () => {
  const push = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push });
  });

  it('shows a loading state while auth is loading', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      userProfile: null,
      loading: true,
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
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(push).toHaveBeenCalledWith('/');
  });

  it('renders children for allowed roles', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: '123' } as unknown as ReturnType<typeof useAuth>['user'],
      userProfile: { role: 'student' } as UserProfile,
      loading: false,
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
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: '123' } as unknown as ReturnType<typeof useAuth>['user'],
      userProfile: { role: 'supervisor' } as UserProfile,
      loading: false,
    });

    render(
      <AuthGuard allowedRoles={['student']}>
        <div data-testid="protected">Protected</div>
      </AuthGuard>
    );

    expect(push).toHaveBeenCalledWith('/supervisor');
  });
});
