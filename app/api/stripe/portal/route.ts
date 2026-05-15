import { createClient } from '@/lib/supabase/server';
import { getUserSubscription } from '@/lib/db/subscriptions';
import { createPortalSession } from '@/lib/stripe';

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await getUserSubscription(user.id);

  if (!subscription || !subscription.stripeCustomerId) {
    return Response.json({ error: 'No active subscription' }, { status: 400 });
  }

  const returnUrl = new URL(request.url).origin + '/scan';

  const url = await createPortalSession({
    stripeCustomerId: subscription.stripeCustomerId,
    returnUrl,
  });

  return Response.json({ url });
}
