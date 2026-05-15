import type Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import {
  upsertSubscription,
  updateSubscriptionByStripeId,
  getActivePlan,
} from '@/lib/db/subscriptions';

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id!;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      const plan = await getActivePlan();

      await upsertSubscription({
        userId,
        planId: plan?.id,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'active',
        requestsUsed: 0,
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const stripeSubscriptionId = invoice.subscription as string;
      const periodStart = new Date((invoice.period_start as number) * 1000);
      const periodEnd = new Date((invoice.period_end as number) * 1000);

      await updateSubscriptionByStripeId(stripeSubscriptionId, {
        status: 'active',
        requestsUsed: 0,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
      break;
    }

    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      await updateSubscriptionByStripeId(invoice.subscription as string, {
        status: 'past_due',
      });
      break;
    }

    case 'customer.subscription.deleted': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any;
      await updateSubscriptionByStripeId(sub.id, {
        status: 'canceled',
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
      break;
    }

    case 'customer.subscription.updated': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any;
      await updateSubscriptionByStripeId(sub.id, {
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return Response.json({ received: true });
}
