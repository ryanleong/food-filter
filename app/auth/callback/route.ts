import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback route — handles PKCE code exchange for:
 * - Google OAuth sign-in
 * - Email confirmation links (after sign-up)
 * - Magic link sign-ins
 * - Password reset links
 *
 * Supabase redirects here with ?code=... after the user completes any auth flow.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    // No code means the OAuth flow didn't complete — redirect with an explanatory error.
    console.error('[auth/callback] No code parameter in callback URL. Supabase may have rejected the redirectTo URL. Check Supabase Authentication → URL Configuration and ensure the exact URL is in the Redirect URLs list.');
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Log the full error so the developer can diagnose in the terminal.
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message, '| status:', error.status);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

