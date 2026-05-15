import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---- Hoisted mocks ----

const mockConstructWebhookEvent = vi.hoisted(() => vi.fn());
const mockUpsertSubscription = vi.hoisted(() => vi.fn());
const mockUpdateSubscriptionByStripeId = vi.hoisted(() => vi.fn());
const mockGetActivePlan = vi.hoisted(() => vi.fn());

vi.mock('@/lib/stripe', () => ({
  constructWebhookEvent: mockConstructWebhookEvent,
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
}));

vi.mock('@/lib/db/subscriptions', () => ({
  getUserSubscription: vi.fn(),
  incrementRequestsUsed: vi.fn(),
  upsertSubscription: mockUpsertSubscription,
  updateSubscriptionByStripeId: mockUpdateSubscriptionByStripeId,
  getActivePlan: mockGetActivePlan,
}));

// ---- Import after mocks ----

import { POST } from '@/app/api/stripe/webhook/route';

// ---- Helpers ----

function makeWebhookRequest(body: string, signature = 'valid-sig') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': signature },
  });
}

// ---- Setup ----

beforeEach(() => {
  vi.clearAllMocks();
  mockUpsertSubscription.mockResolvedValue(undefined);
  mockUpdateSubscriptionByStripeId.mockResolvedValue(undefined);
  mockGetActivePlan.mockResolvedValue({ id: 'plan-1', stripe_price_id: 'price_abc' });
});

// ---- Tests ----

describe('POST /api/stripe/webhook', () => {
  it('T1: invalid signature → 400, no DB writes', async () => {
    mockConstructWebhookEvent.mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    const res = await POST(makeWebhookRequest('{}', 'bad-sig'));

    expect(res.status).toBe(400);
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('T2: unknown event type → 200, no DB writes', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'some.unknown.event',
      data: { object: {} },
    });

    const res = await POST(makeWebhookRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockUpdateSubscriptionByStripeId).not.toHaveBeenCalled();
  });

  it('T3: checkout.session.completed → upsertSubscription called', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'user-123',
          customer: 'cus_abc',
          subscription: 'sub_abc',
        },
      },
    });

    const res = await POST(makeWebhookRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        stripeCustomerId: 'cus_abc',
        stripeSubscriptionId: 'sub_abc',
        status: 'active',
        requestsUsed: 0,
      }),
    );
  });

  it('T4: invoice.payment_succeeded → updateSubscriptionByStripeId called with requestsUsed: 0', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_abc',
          period_start: 1700000000,
          period_end: 1702592000,
        },
      },
    });

    const res = await POST(makeWebhookRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockUpdateSubscriptionByStripeId).toHaveBeenCalledWith(
      'sub_abc',
      expect.objectContaining({
        status: 'active',
        requestsUsed: 0,
      }),
    );
  });

  it('T5: invoice.payment_failed → status set to past_due', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'invoice.payment_failed',
      data: { object: { subscription: 'sub_abc' } },
    });

    const res = await POST(makeWebhookRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockUpdateSubscriptionByStripeId).toHaveBeenCalledWith('sub_abc', { status: 'past_due' });
  });

  it('T6: customer.subscription.deleted → status set to canceled', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_abc',
          current_period_end: 1702592000,
        },
      },
    });

    const res = await POST(makeWebhookRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockUpdateSubscriptionByStripeId).toHaveBeenCalledWith(
      'sub_abc',
      expect.objectContaining({
        status: 'canceled',
      }),
    );
  });

  it('T7: customer.subscription.updated → updateSubscriptionByStripeId called with status and period dates', async () => {
    mockConstructWebhookEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_abc',
          status: 'active',
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        },
      },
    });

    const res = await POST(makeWebhookRequest('{}'));

    expect(res.status).toBe(200);
    expect(mockUpdateSubscriptionByStripeId).toHaveBeenCalledWith(
      'sub_abc',
      expect.objectContaining({
        status: 'active',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702592000 * 1000),
      }),
    );
  });
});
