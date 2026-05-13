import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginClient from '@/app/(auth)/login/LoginClient';

// --- Mocks ---

const mockSignInWithOAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

const mockSearchParamsGet = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

// --- Helpers ---

function setup() {
  const user = userEvent.setup();
  render(<LoginClient />);
  return { user };
}

// --- Tests ---

describe('LoginClient (Google Sign-In)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

  // Cycle 1: button renders
  it('renders a "Continue with Google" button', () => {
    setup();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  // Cycle 2: brand header
  it('renders the FoodFilter brand header and tagline', () => {
    setup();
    expect(screen.getByText('FoodFilter')).toBeInTheDocument();
    expect(screen.getByText(/filter menus\. eat safely\./i)).toBeInTheDocument();
  });

  // Cycle 3: click calls signInWithOAuth with correct provider and redirectTo
  it('calls signInWithOAuth with google provider and /auth/callback redirectTo on click', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: {}, error: null });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expect.stringContaining('/auth/callback') },
      });
    });
  });

  // Cycle 4: error banner visible for known error codes
  it('shows error banner when URL contains ?error=auth_callback_failed', () => {
    mockSearchParamsGet.mockReturnValue('auth_callback_failed');
    setup();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows error banner when URL contains ?error=oauth_failed', () => {
    mockSearchParamsGet.mockReturnValue('oauth_failed');
    setup();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // Cycle 5: no error banner when no error param
  it('shows no error banner when URL has no error param', () => {
    mockSearchParamsGet.mockReturnValue(null);
    setup();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
