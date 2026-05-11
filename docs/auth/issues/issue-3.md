# Issue 3: Auth middleware & `/dashboard` route

## Parent

None

## What to build

Protect every app route except `/` and `/login` by adding Next.js middleware that checks for a valid Supabase session before the page renders. Move the current home page content from `/` to `/dashboard`. The `/` route becomes a simple redirect — unauthenticated users go to `/login`, authenticated users go to `/dashboard`. Existing tests for the home page must be updated to point at `/dashboard`.

## Acceptance criteria

- [ ] `middleware.ts` exists at the project root and runs on all routes except `/login` and `/`
- [ ] Unauthenticated request to any protected route (e.g. `/dashboard`, `/scan`, `/ingredients`, `/history`) redirects to `/login`
- [ ] Authenticated request to `/login` redirects to `/dashboard`
- [ ] Unauthenticated request to `/` redirects to `/login`
- [ ] Authenticated request to `/` redirects to `/dashboard`
- [ ] The current home page UI (CTAs, branding) is served at `/dashboard` — no visible change to the page content itself
- [ ] `/` no longer renders any page content of its own
- [ ] Tests cover: unauthenticated → protected route → redirect to `/login`; authenticated → `/login` → redirect to `/dashboard`; `/login` passes through unauthenticated; `/dashboard` passes through authenticated
- [ ] All existing `__tests__/app/home/` tests are updated to reference `/dashboard`
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #1 (requires Supabase middleware client factory)
