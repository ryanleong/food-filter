'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Tab = 'password' | 'magic-link';
type Mode = 'sign-in' | 'create-account';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('password');
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Magic link tab state
  const [mlEmail, setMlEmail] = useState('');
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlSent, setMlSent] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (mode === 'create-account') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/auth/callback' },
      });
      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Check your email to confirm your account');
      }
    } else {
      setLoading(true);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/dashboard');
      }
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/callback?next=/login',
    });
    setSuccess('Password reset email sent');
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMlError(null);
    setMlLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: mlEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });
    setMlLoading(false);
    if (otpError) {
      setMlError(otpError.message);
    } else {
      setMlSent(true);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'sign-in' ? 'create-account' : 'sign-in'));
    clearMessages();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-semibold text-primary tracking-tight">FoodFilter</h1>
        <p className="mt-2 text-sm text-muted-foreground">Filter menus. Eat safely.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-border">
          {(['password', 'magic-link'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                if (id === 'magic-link') { setMlError(null); setMlSent(false); }
                else clearMessages();
              }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                tab === id
                  ? 'text-primary border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {id === 'password' ? 'Password' : 'Magic Link'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'password' ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
                />
              </div>

              {mode === 'create-account' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirm password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">{error}</p>
              )}
              {success && (
                <p role="status" className="text-sm font-medium text-green-600">{success}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading…' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>

              {mode === 'sign-in' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="self-start text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === 'sign-in'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <span className="text-primary font-medium hover:underline">
                  {mode === 'sign-in' ? 'Create one' : 'Sign in'}
                </span>
              </button>
            </form>
          ) : (
            mlSent ? (
              <div className="text-center py-4 space-y-2">
                <p className="font-display text-lg font-semibold text-foreground">Check your inbox</p>
                <p className="text-sm text-muted-foreground">
                  We sent a magic link to <strong>{mlEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => { setMlSent(false); setMlEmail(''); }}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-4" noValidate>
                <p className="text-sm text-muted-foreground text-center">
                  We'll send a one-click sign-in link to your email.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ml-email" className="text-sm font-medium text-foreground">Email</label>
                  <input
                    id="ml-email"
                    type="email"
                    autoComplete="email"
                    value={mlEmail}
                    onChange={(e) => setMlEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
                  />
                </div>
                {mlError && (
                  <p role="alert" className="text-sm font-medium text-destructive">{mlError}</p>
                )}
                <button
                  type="submit"
                  disabled={mlLoading}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {mlLoading ? 'Sending…' : 'Send Magic Link'}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
