import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopBar from '@/components/TopBar';

// useAuth mock — hoisted so it's available inside the vi.mock() factory
const mockSignOut = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// deleteAccount server action mock
vi.mock('@/lib/actions/deleteAccount', () => ({
  deleteAccount: vi.fn().mockResolvedValue({}),
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated (no user)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, signOut: mockSignOut });
    });

    it('renders the FoodFilter wordmark linking to /', () => {
      render(<TopBar />);
      const link = screen.getByRole('link', { name: /foodfilter/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('renders the ThemeSwitcher', () => {
      render(<TopBar />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render the account dropdown trigger when user is null', () => {
      render(<TopBar />);
      expect(screen.queryByRole('button', { name: /account/i })).not.toBeInTheDocument();
    });
  });

  describe('authenticated (user signed in)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { email: 'test@example.com' },
        signOut: mockSignOut,
      });
    });

    it('renders the FoodFilter wordmark', () => {
      render(<TopBar />);
      expect(screen.getByRole('link', { name: /foodfilter/i })).toHaveAttribute('href', '/');
    });

    it('shows the account dropdown trigger', () => {
      render(<TopBar />);
      expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
    });

    it('shows user email in the dropdown', async () => {
      render(<TopBar />);
      await userEvent.click(screen.getByRole('button', { name: /account/i }));
      expect(await screen.findByText('test@example.com')).toBeInTheDocument();
    });

    it('calls signOut when "Sign out" is clicked', async () => {
      render(<TopBar />);
      await userEvent.click(screen.getByRole('button', { name: /account/i }));
      await userEvent.click(await screen.findByText('Sign out'));
      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });
});

