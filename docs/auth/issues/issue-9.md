# Issue 9: Analyze Server Action & useAnalyze hook migration

## Parent

None

## What to build

Replace the `/api/analyze` Route Handler with a Next.js Server Action. The Server Action reads the Supabase session from cookies to verify the caller is authenticated, then calls the existing Gemini logic, saves the resulting `ScanRecord` via `lib/db/history.ts`, and writes the result to `sessionStorage` for the results page. Update `useAnalyze` to call the Server Action instead of `fetch('/api/analyze', ...)`. Unauthenticated calls must return an error without invoking Gemini.

## Acceptance criteria

- [ ] `lib/actions/analyze.ts` is a `"use server"` file with an `analyzeMenu(formData: FormData)` exported function
- [ ] The action reads the Supabase session from cookies; if no valid session exists, it returns an auth error immediately without calling Gemini
- [ ] The action accepts a `FormData` containing the compressed image blob and the blacklist JSON string
- [ ] On success, the action calls `lib/gemini.ts`, saves the record via `lib/db/history.ts`, and returns the `ScanRecord`
- [ ] On Gemini failure, the action returns an error and does not save a record to the DB
- [ ] `useAnalyze` calls `analyzeMenu()` (Server Action) instead of `fetch('/api/analyze', ...)`
- [ ] After a successful action call, `useAnalyze` writes the result to `sessionStorage` and navigates to `/results`
- [ ] `next.config.ts` sets `serverActions.bodySizeLimit` to at least `'1mb'`
- [ ] Tests cover: unauthenticated call returns error without calling Gemini; authenticated call with valid FormData calls Gemini and saves record; Gemini failure returns error without saving
- [ ] Tests for `useAnalyze` are updated to mock `lib/actions/analyze.ts` instead of `fetch`
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #6 (requires server-side session verification via Supabase)
- Blocked by #8 (action saves records via `lib/db/history.ts`)
