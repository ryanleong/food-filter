import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HomeClient from '@/app/components/HomeClient';
import * as blacklistDb from '@/lib/db/blacklist';
import * as historyDb from '@/lib/db/history';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/lib/db/blacklist', () => ({
  getBlacklist: vi.fn(),
}));

vi.mock('@/lib/db/history', () => ({
  getHistory: vi.fn(),
}));

describe('HomeClient', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-123' }, signOut: vi.fn() });
    vi.mocked(blacklistDb.getBlacklist).mockResolvedValue([]);
    vi.mocked(historyDb.getHistory).mockResolvedValue([]);
  });

  it('renders dynamic content after effects flush', async () => {
    render(<HomeClient />);
    // After effects flush, the nudge appears (blacklist empty)
    expect(await screen.findByText(/start by adding ingredients/i)).toBeInTheDocument();
  });

  it('shows the blacklist nudge when blacklist is empty', async () => {
    render(<HomeClient />);
    // Wait for useEffect to set `loaded = true`
    expect(
      await screen.findByText(/start by adding ingredients/i)
    ).toBeInTheDocument();
  });

  it('does not show the nudge when blacklist is non-empty', async () => {
    vi.mocked(blacklistDb.getBlacklist).mockResolvedValue(['peanuts']);
    vi.mocked(historyDb.getHistory).mockResolvedValue([]);
    render(<HomeClient />);
    // Wait for effects to flush, then assert nudge is absent
    await waitFor(() => {
      expect(screen.queryByText(/start by adding ingredients/i)).not.toBeInTheDocument();
    });
  });

  it('shows a recent scan card when history is non-empty', async () => {
    vi.mocked(blacklistDb.getBlacklist).mockResolvedValue(['peanuts']);
    vi.mocked(historyDb.getHistory).mockResolvedValue([
      {
        id: 'abc-123',
        createdAt: '2026-04-25T14:32:00.000Z',
        dishes: [
          { name: 'Pad Thai', riskLevel: 'high', blacklistedFound: ['peanuts'], allIngredients: ['peanuts'], source: 'menu' },
          { name: 'Rice', riskLevel: 'low', blacklistedFound: [], allIngredients: ['rice'], source: 'menu' },
        ],
        blacklistSnapshot: ['peanuts'],
      },
    ]);
    render(<HomeClient />);
    expect(await screen.findByText(/recent scan/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute('href', '/history/abc-123');
  });

  it('does not show recent scan card when history is empty', async () => {
    vi.mocked(blacklistDb.getBlacklist).mockResolvedValue(['peanuts']);
    render(<HomeClient />);
    await waitFor(() => {
      expect(screen.queryByText(/recent scan/i)).not.toBeInTheDocument();
    });
  });

  it('renders nothing when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() });
    const { container } = render(<HomeClient />);
    expect(container.firstChild).toBeNull();
  });
});
