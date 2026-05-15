-- Migration: Subscription schema for FoodFilter
-- Creates plans and user_subscriptions tables with RLS policies

-- ============================================================
-- plans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  price_cents      int         NOT NULL,
  request_quota    int         NOT NULL,
  stripe_price_id  text        UNIQUE NOT NULL,
  active           boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable"
  ON public.plans
  FOR SELECT
  USING (true);

-- Seed the default Starter plan
INSERT INTO public.plans (name, price_cents, request_quota, stripe_price_id)
VALUES ('Starter', 300, 200, 'price_placeholder');

-- ============================================================
-- user_subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                uuid        NOT NULL REFERENCES public.plans(id),
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text        NOT NULL DEFAULT 'incomplete',
  requests_used          int         NOT NULL DEFAULT 0,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);
