import { createClient } from '@supabase/supabase-js';
import { getUserSubscription } from '@/lib/db/subscriptions';

export type CanAnalyzeResult =
  | { allowed: true; remaining: number; resetAt: Date | null }
  | { allowed: false; reason: 'no-subscription' | 'quota-exhausted'; resetAt?: Date };

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function canAnalyze(userId: string): Promise<CanAnalyzeResult> {
  // 1. Superadmin check
  const superadminEmails = process.env.SUPERADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  if (superadminEmails.length > 0) {
    const supabase = getServiceClient();
    const { data } = await supabase.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (email && superadminEmails.includes(email)) {
      return { allowed: true, remaining: Infinity, resetAt: null };
    }
  }

  // 2. Get subscription
  const subscription = await getUserSubscription(userId);

  // 3. No subscription
  if (!subscription) {
    return { allowed: false, reason: 'no-subscription' };
  }

  const { status, currentPeriodEnd, requestsUsed, requestQuota } = subscription;

  // 4. Canceled and period expired (or null) → no subscription
  if (status === 'canceled') {
    const periodExpired = !currentPeriodEnd || currentPeriodEnd <= new Date();
    if (periodExpired) {
      return { allowed: false, reason: 'no-subscription' };
    }
    // else: canceled but still in paid period → fall through to quota check
  }

  // 7. Incomplete (never completed checkout)
  if (status === 'incomplete') {
    return { allowed: false, reason: 'no-subscription' };
  }

  // 8. Quota exhausted
  if (requestsUsed >= requestQuota) {
    return {
      allowed: false,
      reason: 'quota-exhausted',
      resetAt: currentPeriodEnd ?? undefined,
    };
  }

  // 9. Allowed
  return {
    allowed: true,
    remaining: requestQuota - requestsUsed,
    resetAt: currentPeriodEnd,
  };
}
