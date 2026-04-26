# E5 — AI Analysis Design

**Epic:** E5 — AI Analysis
**Date:** April 26, 2026
**Status:** Approved

---

## 1. Scope

This epic wires up the full analysis flow: from pressing "Analyze Menu" on the scan page, through image compression and the Gemini proxy, to saving the result and navigating to a stub results page. It does **not** include the full results UI (that is E6).

### Already implemented (not in scope)
- `lib/gemini.ts` — Gemini SDK client, prompt construction, response validation, markdown-fence stripping
- `app/api/analyze/route.ts` — server-side proxy with request validation and error responses
- `lib/image.ts` — client-side image compression
- `lib/storage.ts` — `addScanRecord`, `getHistory`, etc.
- `components/ScanInput.tsx` — image selection, preview, offline detection (stub `handleAnalyze`)

### In scope
- `lib/hooks/useAnalyze.ts` — new hook encapsulating the full API call lifecycle
- `components/ScanInput.tsx` — modify to consume `useAnalyze`; add loading and error states
- `app/results/page.tsx` — new stub results page
- `__tests__/lib/hooks/useAnalyze.test.ts` — unit tests for the hook

---

## 2. Architecture

```
ScanInput (UI)
  └── useAnalyze (hook)
        ├── compressImage (lib/image.ts)
        ├── POST /api/analyze
        │     └── analyzeMenu (lib/gemini.ts)
        ├── addScanRecord (lib/storage.ts)
        └── sessionStorage['foodfilter_current_scan']
              └── /results (stub page reads this)
```

---

## 3. `useAnalyze` Hook

**File:** `lib/hooks/useAnalyze.ts`

### Public interface

```ts
export type AnalyzeStatus = 'idle' | 'loading' | 'error';

export interface UseAnalyzeReturn {
  status: AnalyzeStatus;
  error: string | null;
  analyze: (file: File, blacklist: string[]) => Promise<void>;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn
```

### `analyze(file, blacklist)` — internal steps

1. Set `status = 'loading'`, clear `error`.
2. Call `compressImage(file)` — client-side resize to ≤ 1 MB JPEG.
3. Build a `FormData`:
   - `image`: the compressed `Blob` (type `image/jpeg`)
   - `blacklist`: `JSON.stringify(blacklist)`
4. `fetch('/api/analyze', { method: 'POST', body: formData })`.
5. Parse response JSON.
6. On success (`dishes` array present):
   - Generate a `ScanRecord`:
     ```ts
     {
       id: crypto.randomUUID(),
       timestamp: new Date().toISOString(),
       dishes,
       blacklistSnapshot: [...blacklist],
     }
     ```
   - Call `addScanRecord(record)` — persists to `localStorage` history.
   - Write `JSON.stringify(record)` to `sessionStorage['foodfilter_current_scan']` — live handoff to results page.
   - Call `router.push('/results')` (`useRouter` from `next/navigation`).
7. On failure: set `status = 'error'` and `error` to the appropriate user-facing string (see §5).

### `reset()`

Sets `status = 'idle'` and `error = null`. Does not clear the selected image — the user can retry with the same file.

---

## 4. `ScanInput` Modifications

**File:** `components/ScanInput.tsx`

The existing `handleAnalyze` stub is replaced with a call to `analyze(selectedFile, items)` from `useAnalyze`.

### Loading state (inline replacement)

When `status === 'loading'`:
- The card body content is replaced with a centered spinner + "Analyzing your menu…"
- After 15 seconds (tracked via `useEffect`), an additional line appears: "This is taking longer than usual…"
- The "Analyze Menu" button is `disabled` (kept in DOM, not removed)
- Camera/upload buttons are also `disabled`

The spinner uses a CSS `animate-spin` utility from Tailwind (a `<Loader2>` icon from lucide-react).

### Error state

When `status === 'error'`:
- Render an inline alert (same style as the offline guard already in the component) with `error` text
- Render a "Try Again" button that calls `reset()`
- Image selection is preserved (user does not need to re-pick)

### No other behavioral changes to ScanInput

The existing offline check, empty-blacklist warning, and file selection/preview logic are unchanged.

---

## 5. Error Message Mapping

| Condition | User-facing message |
|-----------|---------------------|
| `fetch` throws (network failure, e.g. DNS) | "Could not reach the analysis service. Check your connection and try again." |
| HTTP 400 | "Invalid request. Please re-select your image and try again." |
| HTTP 500 | "Analysis failed. Please try again." |
| Any other non-OK status | "Analysis failed. Please try again." |

---

## 6. sessionStorage Contract

**Key:** `foodfilter_current_scan`
**Value:** `JSON.stringify(ScanRecord)`
**Written by:** `useAnalyze` on successful analysis.
**Read by:** `/results` page on mount.
**Lifecycle:** Cleared by the browser when the tab/session ends. Not explicitly cleared by the app between scans — each new analysis overwrites the previous value.

---

## 7. Stub Results Page

**File:** `app/results/page.tsx`
**Purpose:** Validate that E5 is end-to-end shippable. E6 replaces the interior.

### Behavior

1. On mount, read `sessionStorage['foodfilter_current_scan']`.
2. If absent or unparseable: redirect to `/scan`.
3. If present: display a minimal summary:
   - Page heading: "Results"
   - Dish count: "X dishes analyzed"
   - Plain list: dish name + risk level for each dish
   - "Scan Another Menu" link → `/scan`

This page is a server component wrapper with a client component for the sessionStorage read, since `sessionStorage` is browser-only.

---

## 8. Testing

**File:** `__tests__/lib/hooks/useAnalyze.test.ts`

Tests are written using Vitest + React Testing Library (`renderHook`).

### Test cases

| # | Description |
|---|-------------|
| T1 | Initial state is `{ status: 'idle', error: null }` |
| T2 | `status` transitions to `'loading'` while the fetch is in flight |
| T3 | On success: `addScanRecord` is called, `sessionStorage` is written, `router.push('/results')` is called, `status` returns to `'idle'` |
| T4 | Network error → `status = 'error'`, correct message |
| T5 | HTTP 400 response → `status = 'error'`, correct message |
| T6 | HTTP 500 response → `status = 'error'`, correct message |
| T7 | `reset()` clears `status` to `'idle'` and `error` to `null` |

Mocks required:
- `global.fetch` — via `vi.fn()`
- `lib/image.ts` `compressImage` — returns a fixed `Blob`
- `lib/storage.ts` `addScanRecord` — spy to verify it was called
- `next/navigation` `useRouter` — returns `{ push: vi.fn() }`
- `sessionStorage` — available in jsdom; asserted directly
- `crypto.randomUUID` — stubbed to return a fixed UUID for deterministic assertions

---

## 9. Out of Scope

- Full dish card UI (E6-S2)
- Risk badge component (E6-S3)
- Results summary bar / sorting (E6-S4)
- History page (E7)
