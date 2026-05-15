# ADR 0002 — Only successful analyses consume Quota

**Status:** Accepted  
**Date:** 2026-05-15

## Context

Each call to `analyzeMenu()` hits the Gemini API and costs money. We needed to decide whether a failed call (Gemini error, invalid image, network timeout) counts against the User's Quota.

## Decision

Only successful analyses — where Gemini returns a valid result — consume one unit of Quota. Calls that fail for any reason do not decrement the counter.

## Rationale

- **User trust**: Charging a Quota slot for a server-side error the User did not cause is punitive and generates support requests.
- **Simplicity**: Success is already a clear signal — `analyzeMenu()` either returns a `ScanRecord` or throws. The increment happens only on the happy path, in the same transaction as persisting the `scan_record`.

## Alternatives considered

**Count all attempts**: Prevents abuse where a User could hammer the endpoint with deliberately malformed images. Rejected because the 200/month limit is already low enough that abuse at this scale is not a meaningful cost risk, and the fairness argument outweighs it.

**Distinguish by fault**: User errors (bad format, oversized image) count; server errors (Gemini down) don't. Rejected as too complex to implement and communicate — the boundary between "user fault" and "server fault" is ambiguous for partial Gemini failures.

## Consequences

- The Quota increment must be placed after a confirmed successful response from Gemini, not at the start of the request.
- If a `scan_record` is persisted but the Quota increment fails (rare race), the record exists without consuming Quota — acceptable; the alternative (increment first, then fail) would charge without delivering value.
