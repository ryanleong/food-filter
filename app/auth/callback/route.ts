import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback route — handles PKCE code exchange for:
 * - Email confirmation links (after sign-up)
 * - Magic link sign-ins
 * - Password reset links
 *
 * Supabase redirects here with ?code=... after the user clicks any auth email link.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
