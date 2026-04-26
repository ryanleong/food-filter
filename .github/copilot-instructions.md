# FoodFilter — AI Agent Instructions

A Next.js PWA that lets users maintain a personal ingredient blacklist and scan restaurant menus via Google Gemini Vision. See [docs/PRD.md](../docs/PRD.md) for full product requirements.

## Commands

| Task         | Command              |
| ------------ | -------------------- |
| Dev server   | `npm run dev`        |
| Build        | `npm run build`      |
| Test (once)  | `npm test`           |
| Test (watch) | `npm run test:watch` |
| Lint         | `npm run lint`       |

**Required env var:** `GEMINI_API_KEY` — needed for the `/api/analyze` route.

## Architecture

```
app/            Next.js App Router pages and API routes
lib/            Business logic (storage, gemini, image, types, hooks)
components/     Reusable UI components (shadcn/ui + custom)
__tests__/      Mirrors source structure; uses Vitest + Testing Library
__mocks__/      Manual mock for @google/genai
```

**Key layers:**

- `lib/gemini.ts` — **server-only**. Never import in client components or pages.
- `lib/storage.ts` — localStorage helpers; all functions are SSR-safe via `isStorageAvailable()`.
- `lib/types.ts` — canonical shared types (`DishResult`, `ScanRecord`, `RiskLevel`, etc.).
- `lib/hooks/` — React hooks that bridge business logic to components (`useBlacklist`, `useAnalyze`, `useHistory`, `useResults`).
- `app/providers.tsx` — `BlacklistProvider` wraps the app with shared blacklist context.

**Separation of concerns:** Keep business logic in `lib/`, presentation in `components/` and `app/` pages. Do not mix data-fetching or storage calls directly into components — use hooks.

## Conventions

- **Ingredients** are always stored normalized: lowercase and trimmed.
- **localStorage access** must happen inside a `useEffect` (not in `useState` initializer) to avoid SSR hydration mismatches. Initialize state with an SSR-safe value (e.g. `[]`) first.
- **Path alias** `@/` maps to the project root.
- **Component library:** shadcn/ui components live in `components/ui/`; do not modify generated files there.

## Testing

Tests live in `__tests__/` and mirror the source tree. Each test file has a corresponding source file (e.g. `__tests__/lib/storage.test.ts` → `lib/storage.ts`).

**Critical pitfalls:**

- `request.formData()` **hangs** in Vitest when the `Request` body contains a `File`. `vitest.setup.ts` installs a `PatchedRequest` shim that bypasses this. Do not remove it.
- `vi.mock()` factories are **hoisted** above `const` declarations. Use `vi.hoisted(() => vi.fn())` for any mock variables referenced inside a `vi.mock()` factory to avoid `ReferenceError`.
- `@google/genai` is auto-mocked via `__mocks__/@google/genai.ts`. Import it and use `vi.mocked()` to control behavior in tests.

## Plans & Specs

Detailed implementation plans and design specs for each epic are in [docs/plans/](../docs/plans/) and [docs/specs/](../docs/specs/).
