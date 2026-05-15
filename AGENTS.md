# FoodFilter — AI Agent Instructions

A Next.js PWA that lets users maintain a personal ingredient blacklist and scan restaurant menus via Google Gemini Vision. Users must sign in before accessing any feature. See [docs/PRD.md](docs/PRD.md) and [docs/auth/PRD.md](docs/auth/PRD.md) for full product requirements.

## Commands

| Task         | Command              |
| ------------ | -------------------- |
| Dev server   | `npm run dev`        |
| Build        | `npm run build`      |
| Test (once)  | `npm test`           |
| Test (watch) | `npm run test:watch` |
| Lint         | `npm run lint`       |

**Required env vars** (copy `.env.local.example` → `.env.local`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (safe to expose) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose; RLS enforces security) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server-only**, never expose to client |
| `GEMINI_API_KEY` | Gemini API key — **server-only** |

## Architecture

```
app/                  Next.js App Router pages and Server Actions
  (auth)/login/       Public login page (email+password, magic link)
  auth/callback/      Supabase PKCE code-exchange route (email confirm, magic link)
  dashboard/          Protected home page (moved from /)
  scan/, results/,
  history/, ingredients/  Protected feature pages
lib/
  supabase/           Supabase client factories (browser, server, middleware)
  db/                 DB access layer — blacklist.ts, history.ts
  actions/            Server Actions — analyze.ts, deleteAccount.ts
  gemini.ts           Gemini API client (server-only)
  image.ts            Client-side image compression
  types.ts            Canonical shared types
  nav.ts              Shared NAV_ITEMS constant — import here, never duplicate
  hooks/              React hooks (useBlacklist, useAnalyze, useHistory, useResults, useAuth)
components/           Reusable UI components (shadcn/ui + custom)
middleware.ts         Auth-gating middleware (runs before every page render)
__tests__/            Mirrors source structure; uses Vitest + Testing Library
__mocks__/            Manual mocks (@google/genai, @supabase/ssr)
supabase/migrations/  SQL migration files for DB schema
```

**Key layers:**

- `lib/supabase/client.ts` — browser Supabase client. Use in Client Components and client-side hooks.
- `lib/supabase/server.ts` — async server Supabase client. Use in Server Components, Server Actions, and Route Handlers. Reads session from cookies via `next/headers`.
- `lib/supabase/middleware.ts` — middleware client factory. Use only in `middleware.ts`.
- `lib/gemini.ts` — **server-only**. Never import in client components or pages.
- `lib/db/blacklist.ts` — CRUD for `blacklist_items` table. Uses browser client; call from hooks.
- `lib/db/history.ts` — CRUD for `scan_records` table. Uses browser client; call from hooks.
- `lib/actions/analyze.ts` — `"use server"` Server Action. Uses the **server client** (not browser client) for both auth verification and DB writes. Never call `lib/db/` from a Server Action — use the server client directly to avoid RLS failures.
- `lib/types.ts` — canonical shared types (`DishResult`, `ScanRecord`, `RiskLevel`, etc.).
- `lib/nav.ts` — shared `NAV_ITEMS` array (route, label, icon, exact flag). Both `TopBar` and `BottomNav` import from here. Never duplicate this list.
- `lib/hooks/` — React hooks that bridge business logic to components. `useAuth` exposes `{ user, signOut }` from `AuthProvider`.
- `app/providers.tsx` — `AuthProvider` (outer) wraps `BlacklistProvider` (inner). Both must wrap all protected content. `TopBar` and `BottomNav` must be inside `AuthProvider`.
- `components/TopBar.tsx` — three-zone `grid-cols-3` layout. Desktop (≥ lg): logo · centered nav links · account. Mobile: logo · account only. Nav links are label-only, hidden below `lg`.
- `components/BottomNav.tsx` — mobile-only (`lg:hidden`). Shows icons + labels for all four routes.

**Separation of concerns:** Keep business logic in `lib/`, presentation in `components/` and `app/` pages. Do not mix data-fetching or DB calls directly into components — use hooks or Server Actions.

## Auth Flow

- `middleware.ts` checks the Supabase session before every page render.
- Unauthenticated → redirected to `/login`.
- Authenticated visiting `/login` → redirected to `/dashboard`.
- Email confirmation and magic links redirect to `/auth/callback?code=...` which exchanges the PKCE code for a session, then redirects to `/dashboard`.
- The `/auth/callback` redirect URL must be whitelisted in Supabase Dashboard → Authentication → URL Configuration.

## Database

Two tables with Row-Level Security (users can only access their own rows):

| Table | Key columns |
|---|---|
| `blacklist_items` | `id`, `user_id`, `ingredient` (text, lowercase+trimmed), `created_at` |
| `scan_records` | `id`, `user_id`, `dishes` (jsonb), `blacklist_snapshot` (text[]), `created_at` |

Migration SQL: `supabase/migrations/20260511000001_auth_schema.sql`

## Conventions

- **Ingredients** are always stored normalized: lowercase and trimmed.
- **Supabase client choice matters**: browser client (`lib/supabase/client.ts`) has no session in server context — always use the server client (`lib/supabase/server.ts`) in Server Actions and Route Handlers, or RLS will block writes.
- **Path alias** `@/` maps to the project root.
- **Component library:** shadcn/ui components live in `components/ui/`; do not modify generated files there.

## Testing

Tests live in `__tests__/` and mirror the source tree.

**Critical pitfalls:**

- `request.formData()` **hangs** in Vitest when the `Request` body contains a `File`. `vitest.setup.ts` installs a `PatchedRequest` shim that bypasses this. Do not remove it.
- `vi.mock()` factories are **hoisted** above `const` declarations. Use `vi.hoisted(() => vi.fn())` for any mock variables referenced inside a `vi.mock()` factory to avoid `ReferenceError`.
- `@google/genai` is auto-mocked via `__mocks__/@google/genai.ts`. Import it and use `vi.mocked()` to control behavior in tests.
- When mocking `lib/supabase/client.ts` or `lib/supabase/server.ts`, mock the whole module with `vi.mock` and return a fake client object. Use `vi.hoisted` for any variables referenced in the factory.
- Server Actions are just async functions in tests — call them directly, no special setup needed.

## Plans & Specs

Detailed implementation plans and design specs for each epic are in [docs/plans/](docs/plans/), [docs/specs/](docs/specs/), and [docs/auth/](docs/auth/).

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
