import { createClient } from '@/lib/supabase/server';
import { canAnalyze } from '@/lib/subscription-guard';
import { getUserSubscription } from '@/lib/db/subscriptions';
import TopBar, { type UsageProps } from '@/components/TopBar';

export async function TopBarWithUsage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let usageProps: UsageProps = { type: 'none' };

  if (user) {
    const [guardResult, subscription] = await Promise.all([
      canAnalyze(user.id),
      getUserSubscription(user.id),
    ]);

    if (guardResult.allowed && guardResult.remaining === Infinity) {
      usageProps = { type: 'superadmin' };
    } else if (guardResult.allowed) {
      usageProps = {
        type: 'subscribed',
        remaining: guardResult.remaining,
        resetAt: guardResult.resetAt,
        hasStripeCustomer: !!subscription?.stripeCustomerId,
      };
    } else if (!guardResult.allowed && guardResult.reason === 'quota-exhausted') {
      usageProps = {
        type: 'exhausted',
        resetAt: guardResult.resetAt ?? null,
        hasStripeCustomer: !!subscription?.stripeCustomerId,
      };
    }
  }

  return <TopBar usageProps={usageProps} />;
}
