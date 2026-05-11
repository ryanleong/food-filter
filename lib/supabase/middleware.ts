import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Middleware Supabase client.
 * Must be used inside middleware.ts — returns both the client and the
 * response object (which may have refreshed session cookies written into it).
 */
export function createMiddlewareClient(request: NextRequest) {
  // Start with a pass-through response that forwards the request headers.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto the request so downstream server code can read them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Recreate the response so the updated request headers are forwarded.
          response = NextResponse.next({ request });
          // Write cookies onto the response so the browser persists them.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, response };
}
