# FoodFilter — Domain Glossary

## Analyze Request
A single successful call to `analyzeMenu()` that returns a valid result from Gemini. Failed calls (API errors, invalid images, network timeouts) do not count as Analyze Requests. The unit of consumption tracked against a User's Quota.

## Billing Period
The monthly interval between Quota resets, anchored to the date the User's Subscription began. A User who subscribes on the 14th has their Quota reset on the 14th of each subsequent month. Does not align to calendar month boundaries.

## Plan
A billing configuration that defines a price and a request Quota. Plans are stored in the database (not hardcoded) to allow new tiers to be added without code changes. Each Plan has a corresponding Stripe Price ID. Tiers vary only on price and Quota.

## Quota
The number of Analyze Requests a User may make within a single Billing Period. Unused Quota does not carry forward — it resets to the Plan's full allowance at the start of each new Billing Period.

## Subscription
A paid relationship between a User and a Plan, managed via Stripe. A Subscription is active while Stripe considers it current (including during payment retry windows). A canceled Subscription remains active until the end of the current Billing Period.

## Subscription Gate
The UI shown at `/scan` to a User without an active Subscription. Blocks image upload entirely and presents a CTA to subscribe. Non-subscribers cannot reach the analyze flow.

## Superadmin
A User whose email address appears in the `SUPERADMIN_EMAILS` environment variable. Superadmins bypass Subscription requirements and have no Quota. Intended for the app owner only.
