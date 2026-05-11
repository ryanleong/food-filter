'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">FoodFilter</h1>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            type="button"
            onClick={() => {
              setTab('password');
              setMlError(null);
              setMlSent(false);
            }}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('magic-link');
              clearMessages();
            }}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === 'magic-link'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Magic link
          </button>
        </div>

        {tab === 'password' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === 'create-account' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p role="status" className="text-sm font-medium text-green-600">
                {success}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Loading…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>

            {mode === 'sign-in' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="self-start text-sm text-muted-foreground hover:underline"
              >
                Forgot password?
              </button>
            )}

            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:underline"
            >
              {mode === 'sign-in'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </form>
        )}

        {tab === 'magic-link' && (
          mlSent ? (
            <p role="status" className="text-sm font-medium text-green-600">
              Check your inbox for a sign-in link
            </p>
          ) : (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ml-email">Email</Label>
                <Input
                  id="ml-email"
                  type="email"
                  autoComplete="email"
                  value={mlEmail}
                  onChange={(e) => setMlEmail(e.target.value)}
                  required
                />
              </div>

              {mlError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {mlError}
                </p>
              )}

              <Button type="submit" disabled={mlLoading} className="w-full">
                {mlLoading ? 'Loading…' : 'Send sign-in link'}
              </Button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
