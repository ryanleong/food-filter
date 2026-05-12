import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopBar from '@/components/TopBar';

const mockSignOut = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUsePathname = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/lib/actions/deleteAccount', () => ({
  deleteAccount: vi.fn().mockResolvedValue({}),
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
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
      // The dropdown "Signed in as" section renders email in a <p>; the button
      // trigger also shows it in a <span>, so be specific about the element.
      expect(await screen.findByText('test@example.com', { selector: 'p' })).toBeInTheDocument();
    });

    it('calls signOut when "Sign out" is clicked', async () => {
      render(<TopBar />);
      await userEvent.click(screen.getByRole('button', { name: /account/i }));
      await userEvent.click(await screen.findByText('Sign out'));
      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });

  describe('desktop navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, signOut: mockSignOut });
    });

    it('renders all four nav links', () => {
      mockUsePathname.mockReturnValue('/');
      render(<TopBar />);
      // Nav links are in the desktop nav (hidden via CSS, still in DOM)
      const nav = screen.getByRole('navigation', { name: /desktop navigation/i });
      expect(nav).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^scan$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^history$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^ingredients$/i })).toBeInTheDocument();
    });

    it('sets aria-current="page" on the Home link when on /', () => {
      mockUsePathname.mockReturnValue('/');
      render(<TopBar />);
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not set aria-current on Home when on /scan', () => {
      mockUsePathname.mockReturnValue('/scan');
      render(<TopBar />);
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).not.toHaveAttribute('aria-current');
    });

    it('sets aria-current="page" on Scan link when on /scan', () => {
      mockUsePathname.mockReturnValue('/scan');
      render(<TopBar />);
      const scanLink = screen.getByRole('link', { name: /^scan$/i });
      expect(scanLink).toHaveAttribute('aria-current', 'page');
    });

    it('sets aria-current="page" on History link when on /history/some-id', () => {
      mockUsePathname.mockReturnValue('/history/abc-123');
      render(<TopBar />);
      const historyLink = screen.getByRole('link', { name: /^history$/i });
      expect(historyLink).toHaveAttribute('aria-current', 'page');
    });

    it('applies pill class to the active nav link', () => {
      mockUsePathname.mockReturnValue('/ingredients');
      render(<TopBar />);
      const ingredientsLink = screen.getByRole('link', { name: /^ingredients$/i });
      expect(ingredientsLink).toHaveClass('bg-secondary');
    });

    it('does not apply pill class to inactive nav links', () => {
      mockUsePathname.mockReturnValue('/ingredients');
      render(<TopBar />);
      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).not.toHaveClass('bg-secondary');
    });
  });
});

