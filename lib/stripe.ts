import 'server-only';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Creates a Stripe Checkout Session for a new subscription.
 * Returns the session URL to redirect the user to.
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  returnUrl,
}: {
  userId: string;
  userEmail: string;
  returnUrl: string;
}): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('plans')
    .select('stripe_price_id')
    .eq('active', true)
    .eq('name', 'Starter')
    .single();

  if (error || !data) {
    throw new Error('No active Starter plan found');
  }

  const plan = data as { stripe_price_id: string };

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    client_reference_id: userId,
    customer_email: userEmail,
    success_url: returnUrl + '/scan?checkout=success',
    cancel_url: returnUrl + '/scan',
  });

  if (!session.url) {
    throw new Error('Stripe did not return a session URL');
  }

  return session.url;
}

/**
 * Creates a Stripe Billing Portal session.
 * Returns the portal URL to redirect the user to.
 */
export async function createPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Verifies a Stripe webhook signature and returns the event.
 * Throws if signature is invalid.
 */
export function constructWebhookEvent(
  rawBody: Buffer | string,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
