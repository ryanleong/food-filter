# PRD: Supabase Authentication & Cloud Data Migration

**Version:** 1.0
**Status:** Draft
**Date:** May 11, 2026

---

## Problem Statement

FoodFilter currently stores all user data (ingredient blacklist, scan history) in the browser's `localStorage`. This means data is siloed to a single device and browser, is permanently lost if the user clears storage or switches browsers, and the app has no concept of identity. Anyone with access to the device can see and modify a user's dietary preferences. The Gemini API proxy is also open to abuse since it has no authentication gate.

---

## Solution

Introduce Supabase-backed authentication so each user has a persistent identity, and migrate the blacklist and scan history to Supabase's PostgreSQL database so data follows the user across devices. The `/api/analyze` route handler is replaced with a Next.js Server Action that verifies the user's session server-side before calling Gemini. All app routes except the home redirect page and the login page become protected, enforced at the middleware layer before any page renders.

---

## User Stories

### Authentication

1. As a new user, I want to sign up with my email address and password, so that I can create a personal account.
2. As a new user, I want to receive a confirmation email after signing up, so that my account is verified before I can access the app.
3. As a registered user, I want to sign in with my email and password, so that I can access my personal blacklist and scan history.
4. As a registered user, I want to sign in via a magic link sent to my email, so that I can log in without remembering a password.
5. As a user on the login page, I want to toggle between "Sign in" and "Sign up" modes, so that I can use one page for both flows without navigating away.
6. As a user on the login page, I want to toggle between "Password" and "Magic link" authentication methods, so that I can choose how I authenticate.
7. As a user who forgot their password, I want to request a password reset email, so that I can regain access to my account.
8. As a signed-in user, I want to sign out from the app, so that my account is no longer accessible on the current device.
9. As a signed-in user, I want to see my email address in the top bar, so that I know which account I am using.
10. As an unauthenticated user who tries to visit a protected route, I want to be redirected to the login page, so that my data remains private.
11. As a signed-in user who visits the login page, I want to be redirected to the dashboard, so that I am not shown a login form I don't need.
12. As a user, I want auth state to be resolved server-side before the page renders, so that I never see a flash of unauthenticated content.
13. As a user, I want my session to persist across browser restarts without needing to log in again, so that the app feels seamless.
14. As a user, I want to delete my account and all associated data, so that I can exercise my right to erasure.

### Blacklist (Cloud-backed)

15. As a signed-in user, I want my ingredient blacklist to be stored in the cloud, so that it is available on all my devices.
16. As a signed-in user, I want to add an ingredient to my blacklist, so that it is persisted immediately to my account.
17. As a signed-in user, I want to remove an ingredient from my blacklist, so that the change is reflected immediately across my devices.
18. As a signed-in user, I want to view my full blacklist at any time, so that I can review what I have blocked.

### Scan History (Cloud-backed)

19. As a signed-in user, I want my scan history to be stored in the cloud, so that I can view past scans on any device.
20. As a signed-in user, I want a scan result to be automatically saved to my history after a successful analysis, so that I do not need to manually save it.
21. As a signed-in user, I want to delete a single scan record from my history, so that I can remove scans I no longer care about.
22. As a signed-in user, I want to clear all my scan history at once, so that I can start fresh.
23. As a signed-in user viewing a past scan, I want to see the full dish results and blacklist snapshot from that scan, so that I can understand what was flagged.

### Menu Analysis (Server Action)

24. As a signed-in user, I want to upload a menu photo and have it analysed against my blacklist, so that I can identify risky dishes.
25. As a signed-in user, I want the menu analysis to only proceed if I am authenticated, so that the Gemini API is not abused by unauthenticated callers.
26. As a signed-in user, I want my compressed menu image to be analysed server-side, so that my Gemini API key is never exposed to the client.

### Account Management

27. As a signed-in user, I want access to an account menu in the top bar, so that I can sign out or delete my account without navigating to a separate settings page.
28. As a signed-in user who requests account deletion, I want to be shown a confirmation dialog, so that I do not accidentally delete my account.
29. As a user, I want account deletion to remove my blacklist, scan history, and account credentials, so that no personal data remains.

---

## Implementation Decisions

### Database Schema

**`blacklist_items` table**
- `id`: uuid, primary key, default `gen_random_uuid()`
- `user_id`: uuid, foreign key → `auth.users(id)`, not null
- `ingredient`: text, not null (stored lowercase + trimmed, as today)
- `created_at`: timestamptz, default `now()`
- Unique constraint on `(user_id, ingredient)`
- Row-Level Security: users can only read/write their own rows

**`scan_records` table**
- `id`: uuid, primary key, default `gen_random_uuid()`
- `user_id`: uuid, foreign key → `auth.users(id)`, not null
- `created_at`: timestamptz, default `now()`
- `dishes`: jsonb, not null — array of `DishResult` (matches existing `DishResult` type)
- `blacklist_snapshot`: text[], not null — copy of blacklist at scan time
- Row-Level Security: users can only read/write their own rows

### Routing

- `/` — public; immediately redirects to `/login` if unauthenticated, or `/dashboard` if authenticated
- `/login` — public; single page with tabs ("Password" / "Magic link") and a sign-in / sign-up toggle
- `/dashboard` — protected; current home page content moves here from `/`
- All other existing routes (`/scan`, `/results`, `/history`, `/history/[id]`, `/ingredients`) — protected
- Middleware enforces protection server-side before page renders

### Module Interfaces

**`lib/supabase/`** — three factory functions: browser client (singleton), server client (uses `cookies()` from `next/headers`), middleware client. No business logic.

**`lib/db/blacklist.ts`** — replaces `localStorage` blacklist calls. Functions: `getBlacklist(userId)`, `addItem(userId, ingredient)`, `removeItem(userId, ingredient)`. All inputs are normalized (lowercase + trimmed) before write.

**`lib/db/history.ts`** — replaces `localStorage` history calls. Functions: `getHistory(userId)`, `addRecord(userId, record)`, `deleteRecord(userId, recordId)`, `clearHistory(userId)`. Returns `ScanRecord[]` matching the existing type.

**`lib/actions/analyze.ts`** — Server Action (`"use server"`). Reads Supabase session from cookies, rejects if unauthenticated. Receives `FormData` (image blob + blacklist JSON). Calls Gemini (existing `lib/gemini.ts`). Saves the resulting `ScanRecord` via `lib/db/history.ts`. Writes result to session for the results page. Returns the record or an error.

**`middleware.ts`** — Uses `@supabase/ssr` middleware client. Checks for a valid session. Redirects unauthenticated requests to `/login`. Redirects authenticated requests to `/dashboard` if they hit `/login`. Allows `/` through.

**`lib/hooks/useAuth.ts`** — Exposes `{ user, signOut }` from `AuthProvider`. Thin wrapper; no direct Supabase calls.

**`app/providers.tsx`** — `AuthProvider` added alongside `BlacklistProvider`. Reads session from server component props (passed down) or subscribes to `onAuthStateChange`.

**`lib/hooks/useBlacklist.ts`** — Replaces `localStorage` calls with `lib/db/blacklist.ts` calls. Hydrates on mount by fetching from Supabase. `add()` and `remove()` call the DB layer directly (no optimistic local state; show loading state instead).

**`lib/hooks/useAnalyze.ts`** — Replaces `fetch('/api/analyze', ...)` with a direct call to the `analyze` Server Action.

**`lib/hooks/useHistory.ts`** — Replaces `localStorage` calls with `lib/db/history.ts` calls.

### Auth Page Design

- Single `/login` route; no `/signup` route
- Two tabs: **Password** (default) and **Magic link**
- Password tab: email field, password field, submit button; below the form a toggle link switches between "Sign in" and "Create account" mode; "Create account" mode shows a confirm-password field
- Magic link tab: email field, submit button; on success shows a "Check your inbox" confirmation message
- Password reset: "Forgot password?" link below password field triggers Supabase `resetPasswordForEmail()`
- On successful sign-in: redirect to `/dashboard`
- On successful sign-up: show "Check your email to confirm your account" message (no auto-redirect until confirmed)

### Deletions

- `app/api/analyze/route.ts` — deleted; replaced by Server Action
- `lib/storage.ts` — deleted; replaced by `lib/db/` layer

### Environment Variables

New required variables (in addition to existing `GEMINI_API_KEY`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Testing Decisions

### What makes a good test

Test external behaviour, not implementation details. A test should only break if the contract (inputs/outputs/side-effects) of a module changes — never because of an internal refactor. Prefer testing through the public interface (the function or component the rest of the app uses), not internal helpers.

### Modules to test

| Module | What to test |
|---|---|
| `lib/db/blacklist.ts` | `getBlacklist` returns items for correct user; `addItem` normalises input and inserts; `removeItem` deletes the correct row; duplicate add does not throw (upsert); functions reject with a meaningful error on Supabase failure |
| `lib/db/history.ts` | `getHistory` returns sorted records for correct user; `addRecord` inserts and returns the record; `deleteRecord` removes the correct row; `clearHistory` removes all rows for the user |
| `lib/actions/analyze.ts` | Unauthenticated call returns an auth error without calling Gemini; authenticated call with valid FormData calls Gemini and saves a record; Gemini failure returns an error and does not save a record |
| `middleware.ts` | Unauthenticated request to `/dashboard` redirects to `/login`; authenticated request to `/login` redirects to `/dashboard`; unauthenticated request to `/login` passes through; authenticated request to `/dashboard` passes through |
| `lib/hooks/useBlacklist.ts` | On mount, fetches blacklist from DB and sets state; `add()` calls `addItem` and updates state; `remove()` calls `removeItem` and updates state |
| `lib/hooks/useAnalyze.ts` | `analyze()` calls the Server Action with correct FormData; on success, navigates to `/results`; on error, exposes the error message |
| `lib/hooks/useHistory.ts` | On mount, fetches history from DB; `removeRecord()` calls `deleteRecord`; `removeAll()` calls `clearHistory` |
| `app/(auth)/login/page.tsx` | Password sign-in: submitting valid credentials calls Supabase sign-in and redirects; invalid credentials shows error message; Magic link: submitting email calls Supabase magic link and shows confirmation; Sign-up toggle shows confirm-password field; mismatched passwords shows validation error |

### Prior art

- Existing hook tests in `__tests__/lib/hooks/` use `vi.mock` + `vi.hoisted` to mock dependencies — follow the same pattern for Supabase client mocks.
- `vitest.setup.ts` installs a `PatchedRequest` shim for `FormData` — the Server Action tests must use this shim.
- `__mocks__/@google/genai.ts` shows the manual mock pattern — create `__mocks__/@supabase/` following the same structure.

---

## Out of Scope

- OAuth providers (Google, GitHub, Apple)
- Custom display name or avatar on sign-up
- A dedicated account settings / profile page
- Multi-device real-time sync (data is fetched fresh on mount, not subscribed)
- Offline support — if Supabase is unreachable, features that require data will show an error state; the app does not cache data locally
- Migration of existing `localStorage` data for existing users (there are no existing users)
- Two-factor authentication
- Team or shared accounts
- Rate limiting on the Server Action beyond Supabase's built-in RLS

---

## Further Notes

- `lib/scan-records.ts` (type guards and sort helpers) is unaffected — it operates on in-memory `ScanRecord` objects regardless of storage layer.
- The `sessionStorage` handoff key (`foodfilter_current_scan`) used to pass results to the results page can be retained as-is; it is not user-data and does not need cloud storage.
- Image data is never sent to or stored in Supabase, consistent with the existing PRD.
- The Server Action body size limit in Next.js defaults to 1 MB. Since images are already compressed client-side to ≤1 MB, this should be sufficient. If scans fail with large images, increase `serverActions.bodySizeLimit` in `next.config.ts`.
- RLS policies must be enabled on both tables. Without them, the Supabase anon key would allow any authenticated user to read another user's data.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose to the client — RLS is the security layer, not key secrecy.
