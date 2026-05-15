# ADR 0001 — Quota resets on billing anniversary, not calendar month

**Status:** Accepted  
**Date:** 2026-05-15

## Context

Each Plan includes a monthly Quota of Analyze Requests. We needed to decide when that Quota resets: on the 1st of each calendar month (same day for all users), or on the anniversary of each User's subscription start date.

## Decision

Quota resets on the billing anniversary — the same day-of-month the User first subscribed — matching Stripe's natural billing cycle.

## Rationale

- **Fairness**: A User subscribing on the 28th gets a full month of Quota before reset, not 3 days.
- **Stripe alignment**: Stripe renews subscriptions on the billing anniversary by default. Using the same anchor means the Quota reset and the payment event are always in sync — no off-by-one edge cases.
- **Simpler implementation**: The Quota reset can be derived from the Stripe subscription's `current_period_start` field on each renewal webhook, with no separate reset job needed.

## Alternatives considered

**Calendar month reset**: Simpler mental model for users ("resets on the 1st"). Rejected because it creates an unfair experience for mid-month subscribers and requires a separate mechanism to track reset dates independently of the Stripe billing cycle.

## Consequences

- The Quota reset is triggered by the Stripe `invoice.payment_succeeded` webhook, which fires at the start of each new Billing Period.
- The UI must display the reset date (derived from `current_period_end`), not a generic "resets on the 1st".
