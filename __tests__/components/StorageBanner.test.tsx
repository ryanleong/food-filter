import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageBanner } from '@/components/StorageBanner';

// Hoist the mock so vi.mock can access it
const mockIsStorageAvailable = vi.hoisted(() => vi.fn());

vi.mock('@/lib/storage', () => ({
  isStorageAvailable: mockIsStorageAvailable,
}));

describe('StorageBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when localStorage is available', () => {
    mockIsStorageAvailable.mockReturnValue(true);
    const { container } = render(<StorageBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows banner when localStorage is unavailable', () => {
    mockIsStorageAvailable.mockReturnValue(false);
    render(<StorageBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/cannot be saved/i)).toBeInTheDocument();
  });

  it('shows banner when foodfilter:storage-error event fires', async () => {
    mockIsStorageAvailable.mockReturnValue(true);
    render(<StorageBanner />);
    // Banner is hidden initially
    expect(screen.queryByRole('alert')).toBeNull();
    // Fire the custom event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('foodfilter:storage-error'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dismisses banner when × button is clicked', async () => {
    mockIsStorageAvailable.mockReturnValue(false);
    const user = userEvent.setup();
    render(<StorageBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
