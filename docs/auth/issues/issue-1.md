# Issue 1: Supabase client foundation

## Parent

None

## What to build

Set up the Supabase client layer that every other auth and data slice will import. Create three factory functions — a browser-side singleton client, a server-side client that reads cookies from `next/headers`, and a middleware client that can both read and write cookies on the `NextResponse`. Add the two required environment variables to the project config. No business logic lives here — this is pure plumbing.

## Acceptance criteria

- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are documented in `.env.local.example` (or equivalent)
- [ ] A browser Supabase client factory is available for use in Client Components
- [ ] A server Supabase client factory is available for use in Server Components and Server Actions (reads cookies via `next/headers`)
- [ ] A middleware Supabase client factory is available for use in `middleware.ts` (reads and writes cookies on `NextRequest`/`NextResponse`)
- [ ] `@supabase/ssr` and `@supabase/supabase-js` are installed as runtime dependencies
- [ ] TypeScript types compile without errors across all three client factories
- [ ] No business logic, auth checks, or DB queries exist in this module

## Blocked by

None — can start immediately.
