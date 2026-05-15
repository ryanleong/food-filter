import { createClient } from '@supabase/supabase-js';

export interface SubscriptionWithPlan {
  userId: string;
  planId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  requestsUsed: number;
  requestQuota: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Returns the user's subscription row joined with plan data, or null if not found.
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*, plans(request_quota)')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as {
    user_id: string;
    plan_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    status: string;
    requests_used: number;
    current_period_start: string | null;
    current_period_end: string | null;
    plans: { request_quota: number };
  };

  return {
    userId: row.user_id,
    planId: row.plan_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    requestsUsed: row.requests_used,
    requestQuota: row.plans.request_quota,
    currentPeriodStart: row.current_period_start ? new Date(row.current_period_start) : null,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
  };
}

export interface UpsertSubscriptionData {
  userId: string;
  planId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: string;
  requestsUsed?: number;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}

/**
 * Creates or updates a subscription row by user_id.
 */
export async function upsertSubscription(data: UpsertSubscriptionData): Promise<void> {
  const supabase = getServiceClient();

  const row: Record<string, unknown> = {
    user_id: data.userId,
    status: data.status,
    updated_at: new Date().toISOString(),
  };

  if (data.planId !== undefined) row.plan_id = data.planId;
  if (data.stripeCustomerId !== undefined) row.stripe_customer_id = data.stripeCustomerId;
  if (data.stripeSubscriptionId !== undefined) row.stripe_subscription_id = data.stripeSubscriptionId;
  if (data.requestsUsed !== undefined) row.requests_used = data.requestsUsed;
  if (data.currentPeriodStart !== undefined)
    row.current_period_start = data.currentPeriodStart ? data.currentPeriodStart.toISOString() : null;
  if (data.currentPeriodEnd !== undefined)
    row.current_period_end = data.currentPeriodEnd ? data.currentPeriodEnd.toISOString() : null;

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(row, { onConflict: 'user_id' });

  if (error) throw new Error(error.message);
}

/**
 * Updates a subscription row by stripe_subscription_id.
 */
export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: Partial<Omit<UpsertSubscriptionData, 'userId' | 'planId'>>,
): Promise<void> {
  const supabase = getServiceClient();

  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.stripeCustomerId !== undefined) row.stripe_customer_id = data.stripeCustomerId;
  if (data.stripeSubscriptionId !== undefined) row.stripe_subscription_id = data.stripeSubscriptionId;
  if (data.status !== undefined) row.status = data.status;
  if (data.requestsUsed !== undefined) row.requests_used = data.requestsUsed;
  if (data.currentPeriodStart !== undefined)
    row.current_period_start = data.currentPeriodStart ? data.currentPeriodStart.toISOString() : null;
  if (data.currentPeriodEnd !== undefined)
    row.current_period_end = data.currentPeriodEnd ? data.currentPeriodEnd.toISOString() : null;

  const { error } = await supabase
    .from('user_subscriptions')
    .update(row)
    .eq('stripe_subscription_id', stripeSubscriptionId);

  if (error) throw new Error(error.message);
}

/**
 * Returns the active plan, or null if none found.
 */
export async function getActivePlan(): Promise<{ id: string; stripe_price_id: string } | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('plans')
    .select('id, stripe_price_id')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return data as { id: string; stripe_price_id: string };
}

/**
 * Atomically increments requests_used by 1 for the given user.
 * Reads current value, increments in JS, writes back.
 */
export async function incrementRequestsUsed(userId: string): Promise<void> {
  const supabase = getServiceClient();

  const { data, error: readError } = await supabase
    .from('user_subscriptions')
    .select('requests_used')
    .eq('user_id', userId)
    .single();

  if (readError) throw new Error(readError.message);

  const current = (data as { requests_used: number }).requests_used;

  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({ requests_used: current + 1, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateError) throw new Error(updateError.message);
}
