import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Always redirect from root based on auth state
  if (pathname === '/') {
    const destination = user ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from the login page
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static   (Next.js static files)
     * - _next/image    (Next.js image optimisation)
     * - favicon.ico
     * - /auth/*        ← CRITICAL: excluded so the OAuth /auth/callback route handler
     *                    can run before a session exists (PKCE code exchange happens here)
     * - public assets  (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
