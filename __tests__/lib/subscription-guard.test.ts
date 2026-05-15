import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- Module mocks ----

const mockGetUserById = vi.hoisted(() => vi.fn());
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { admin: { getUserById: mockGetUserById } },
    from: vi.fn().mockReturnThis(),
  }),
}));

const mockGetUserSubscription = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/subscriptions', () => ({
  getUserSubscription: mockGetUserSubscription,
  incrementRequestsUsed: vi.fn(),
}));

import { canAnalyze } from '@/lib/subscription-guard';

// ---- Helpers ----

const FUTURE_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
const PAST_DATE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);   // 30 days ago

// ---- Setup ----

beforeEach(() => {
  vi.clearAllMocks();
  // Default: not a superadmin
  mockGetUserById.mockResolvedValue({
    data: { user: { email: 'regular@example.com' } },
    error: null,
  });
  // Default: superadmin env not set
  delete process.env.SUPERADMIN_EMAILS;
});

// ---- Tests ----

describe('canAnalyze', () => {
  it('T1: no subscription row → { allowed: false, reason: "no-subscription" }', async () => {
    mockGetUserSubscription.mockResolvedValue(null);

    const result = await canAnalyze('user-1');

    expect(result).toEqual({ allowed: false, reason: 'no-subscription' });
  });

  it('T2: active subscription, quota not exhausted → { allowed: true, remaining, resetAt }', async () => {
    mockGetUserSubscription.mockResolvedValue({
      userId: 'user-1',
      planId: 'plan-basic',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'active',
      requestsUsed: 5,
      requestQuota: 100,
      currentPeriodStart: PAST_DATE,
      currentPeriodEnd: FUTURE_DATE,
    });

    const result = await canAnalyze('user-1');

    expect(result).toEqual({ allowed: true, remaining: 95, resetAt: FUTURE_DATE });
  });

  it('T3: active subscription, requestsUsed === requestQuota → { allowed: false, reason: "quota-exhausted", resetAt }', async () => {
    mockGetUserSubscription.mockResolvedValue({
      userId: 'user-1',
      planId: 'plan-basic',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'active',
      requestsUsed: 100,
      requestQuota: 100,
      currentPeriodStart: PAST_DATE,
      currentPeriodEnd: FUTURE_DATE,
    });

    const result = await canAnalyze('user-1');

    expect(result).toEqual({ allowed: false, reason: 'quota-exhausted', resetAt: FUTURE_DATE });
  });

  it('T4: status "past_due", currentPeriodEnd in future → { allowed: true } (retry window)', async () => {
    mockGetUserSubscription.mockResolvedValue({
      userId: 'user-1',
      planId: 'plan-basic',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'past_due',
      requestsUsed: 10,
      requestQuota: 100,
      currentPeriodStart: PAST_DATE,
      currentPeriodEnd: FUTURE_DATE,
    });

    const result = await canAnalyze('user-1');

    expect(result).toMatchObject({ allowed: true, remaining: 90, resetAt: FUTURE_DATE });
  });

  it('T5: status "canceled", currentPeriodEnd in past → { allowed: false, reason: "no-subscription" }', async () => {
    mockGetUserSubscription.mockResolvedValue({
      userId: 'user-1',
      planId: 'plan-basic',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'canceled',
      requestsUsed: 10,
      requestQuota: 100,
      currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: PAST_DATE,
    });

    const result = await canAnalyze('user-1');

    expect(result).toEqual({ allowed: false, reason: 'no-subscription' });
  });

  it('T6: status "canceled", currentPeriodEnd in future → { allowed: true } (paid-through)', async () => {
    mockGetUserSubscription.mockResolvedValue({
      userId: 'user-1',
      planId: 'plan-basic',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'canceled',
      requestsUsed: 10,
      requestQuota: 100,
      currentPeriodStart: PAST_DATE,
      currentPeriodEnd: FUTURE_DATE,
    });

    const result = await canAnalyze('user-1');

    expect(result).toMatchObject({ allowed: true, remaining: 90, resetAt: FUTURE_DATE });
  });

  it('T7: email in SUPERADMIN_EMAILS → { allowed: true, remaining: Infinity, resetAt: null }, does NOT call getUserSubscription', async () => {
    process.env.SUPERADMIN_EMAILS = 'admin@example.com, superuser@example.com';
    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'admin@example.com' } },
      error: null,
    });

    const result = await canAnalyze('user-admin');

    expect(result).toEqual({ allowed: true, remaining: Infinity, resetAt: null });
    expect(mockGetUserSubscription).not.toHaveBeenCalled();
  });
});
