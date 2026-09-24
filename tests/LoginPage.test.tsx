import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const resetPassword = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null, userProfile: null, signIn: vi.fn(), signUp: vi.fn(), resetPassword }),
}));
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ activeQuote: 'Keep going.' }) }));
vi.mock('@/components/Navbar', () => ({ BrandMark: () => null }));

import LoginPage from '@/app/page';

describe('Forgot password', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends a reset link and confirms without revealing whether the account exists', async () => {
    resetPassword.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.click(screen.getByText('Forgot password?'));
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'jane@uwi.edu' } });
    fireEvent.click(screen.getByText('Send reset link'));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('If an account exists for jane@uwi.edu'));
    expect(resetPassword).toHaveBeenCalledWith('jane@uwi.edu');
  });

  it('shows the same confirmation when no account exists', async () => {
    resetPassword.mockRejectedValue(new Error('Firebase: Error (auth/user-not-found).'));
    render(<LoginPage />);

    fireEvent.click(screen.getByText('Forgot password?'));
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nobody@uwi.edu' } });
    fireEvent.click(screen.getByText('Send reset link'));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('If an account exists for nobody@uwi.edu'));
  });

  it('goes back to sign in', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Forgot password?'));
    fireEvent.click(screen.getByText('← Back to sign in'));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});
