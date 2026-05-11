import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

// --- Mocks ---

const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() => vi.fn());
const mockResetPasswordForEmail = vi.hoisted(() => vi.fn());
const mockSignInWithOtp = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

const mockPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- Helpers ---

function setup() {
  const user = userEvent.setup();
  render(<LoginPage />);
  return { user };
}

async function fillSignInForm(user: ReturnType<typeof userEvent.setup>, email = 'test@example.com', password = 'password123') {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
}

// --- Tests ---

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Renders email and password fields in sign-in mode by default
  it('renders email and password fields in sign-in mode by default', () => {
    setup();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // 2. Submitting valid credentials calls signInWithPassword and redirects
  it('calls signInWithPassword and redirects to /dashboard on success', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    const { user } = setup();

    await fillSignInForm(user);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  // 3. Supabase error shows inline error message
  it('shows inline error when signInWithPassword returns an error', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    const { user } = setup();

    await fillSignInForm(user);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials');
    expect(mockPush).not.toHaveBeenCalled();
  });

  // 4. "Create account" toggle shows confirm-password field
  it('shows confirm-password field after toggling to create-account mode', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /don't have an account/i }));

    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // 5. Mismatched passwords shows validation error without calling Supabase
  it('shows validation error for mismatched passwords without calling Supabase', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /don't have an account/i }));
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/passwords do not match/i);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  // 6. Successful sign-up shows "Check your email" message without redirecting
  it('shows check-your-email message on successful sign-up without redirecting', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /don't have an account/i }));
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/check your email/i);
    expect(mockPush).not.toHaveBeenCalled();
  });

  // 7. "Forgot password?" triggers resetPasswordForEmail and shows confirmation
  it('calls resetPasswordForEmail and shows confirmation on forgot password', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /forgot password/i }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/login') }),
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/password reset email sent/i);
  });
});

describe('Magic link tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Clicking "Magic link" tab shows email field and submit button
  it('shows email field and "Send sign-in link" button when Magic link tab is selected', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /magic link/i }));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send sign-in link/i })).toBeInTheDocument();
  });

  // 2. Submitting calls signInWithOtp with shouldCreateUser: true
  it('calls signInWithOtp with shouldCreateUser: true on submit', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /magic link/i }));
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { shouldCreateUser: true },
      });
    });
  });

  // 3. Successful submission shows "Check your inbox" confirmation
  it('shows "Check your inbox" confirmation on success', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /magic link/i }));
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send sign-in link/i }));

    expect(await screen.findByText(/check your inbox for a sign-in link/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send sign-in link/i })).not.toBeInTheDocument();
  });

  // 4. Error from Supabase shows inline error message
  it('shows inline error message on Supabase error', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { message: 'Email not allowed' } });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /magic link/i }));
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send sign-in link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email not allowed');
  });

  // 5. Switching to Password tab and back clears magic link confirmation/error state
  it('clears magic link state when switching to Password tab and back', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null });
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /magic link/i }));
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send sign-in link/i }));
    await screen.findByText(/check your inbox for a sign-in link/i);

    await user.click(screen.getByRole('button', { name: /^password$/i }));
    await user.click(screen.getByRole('button', { name: /magic link/i }));

    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send sign-in link/i })).toBeInTheDocument();
  });
});
