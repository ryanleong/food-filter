import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Must use vi.hoisted for variables referenced inside vi.mock factories
const mockGetUser = vi.hoisted(() => vi.fn());
const mockCreateMiddlewareClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/middleware', () => ({
  createMiddlewareClient: mockCreateMiddlewareClient,
}));

import { middleware } from '../middleware';

describe('middleware', () => {
  beforeEach(() => {
    // Return a plain pass-through response (no location header) for non-redirected requests
    mockCreateMiddlewareClient.mockReturnValue({
      supabase: { auth: { getUser: mockGetUser } },
      response: new Response(null, { status: 200 }),
    });
  });

  it('redirects unauthenticated request to /dashboard to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/dashboard');
    const res = await middleware(req);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('redirects authenticated request to /login to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const req = new NextRequest('http://localhost/login');
    const res = await middleware(req);
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('passes through unauthenticated request to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/login');
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('passes through authenticated request to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const req = new NextRequest('http://localhost/dashboard');
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });
});
