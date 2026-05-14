import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Must use vi.hoisted so these variables are available inside vi.mock factories
const mockGetUser = vi.hoisted(() => vi.fn());
const mockCreateMiddlewareClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/middleware', () => ({
  createMiddlewareClient: mockCreateMiddlewareClient,
}));

import { proxy } from '../proxy';

const PASS_THROUGH = new Response(null, { status: 200 });

describe('proxy routing', () => {
  beforeEach(() => {
    mockCreateMiddlewareClient.mockReturnValue({
      supabase: { auth: { getUser: mockGetUser } },
      response: PASS_THROUGH,
    });
  });

  // Scenario 1: unauthenticated → "/" → pass through (public landing page)
  it('passes through unauthenticated request to /', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/');
    const res = await proxy(req);
    expect(res.headers.get('location')).toBeNull();
    expect(res).toBe(PASS_THROUGH);
  });

  // Scenario 2: authenticated → "/" → redirect to /dashboard
  it('redirects authenticated request from / to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const req = new NextRequest('http://localhost/');
    const res = await proxy(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
  });

  // Scenario 3: unauthenticated → "/dashboard" → redirect to /login
  it('redirects unauthenticated request from /dashboard to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/dashboard');
    const res = await proxy(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  // Scenario 4: unauthenticated → "/scan" → redirect to /login
  it('redirects unauthenticated request from /scan to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/scan');
    const res = await proxy(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  // Scenario 5: authenticated → "/login" → redirect to /dashboard
  it('redirects authenticated request from /login to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const req = new NextRequest('http://localhost/login');
    const res = await proxy(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
  });

  // Scenario 6: authenticated → "/dashboard" → passes through
  it('passes through authenticated request to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const req = new NextRequest('http://localhost/dashboard');
    const res = await proxy(req);
    expect(res.headers.get('location')).toBeNull();
    expect(res).toBe(PASS_THROUGH);
  });
});
