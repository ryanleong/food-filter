# E5 — AI Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the full analysis flow — compress image, call `/api/analyze`, save the result to history and sessionStorage, navigate to a stub `/results` page — without touching the already-complete Gemini client or API route.

**Architecture:** A new `useAnalyze` hook owns all API call logic (following the `useBlacklist` pattern). `ScanInput` is modified to consume the hook and render loading/error states. A stub `/results` page reads `sessionStorage` and redirects to `/scan` if empty. All three user-facing stories (loading, error, success) are covered by hook unit tests.

**Tech Stack:** Next.js App Router, React hooks, `next/navigation` (`useRouter`), `lib/image.ts` (`compressImage`), `lib/storage.ts` (`addScanRecord`), `lib/types.ts` (`ScanRecord`), Vitest, `@testing-library/react` (`renderHook`, `act`, `waitFor`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/hooks/useAnalyze.ts` | Full API call lifecycle: compress → fetch → save → navigate |
| Modify | `components/ScanInput.tsx` | Consume `useAnalyze`; inline loading replacement; inline error alert |
| Create | `app/results/page.tsx` | Stub results page: read sessionStorage, redirect if empty |
| Create | `__tests__/lib/hooks/useAnalyze.test.ts` | Hook unit tests (7 test cases) |

---

## Task 1: `useAnalyze` Hook (TDD)

**Files:**
- Create: `lib/hooks/useAnalyze.ts`
- Create: `__tests__/lib/hooks/useAnalyze.test.ts`

---

### Step 1: Write the failing test file

Create `__tests__/lib/hooks/useAnalyze.test.ts` with the full test suite:

```typescript
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalyze } from '@/lib/hooks/useAnalyze';
import * as storage from '@/lib/storage';
import * as imageLib from '@/lib/image';

// ---- Module mocks ----

vi.mock('@/lib/storage', () => ({
  addScanRecord: vi.fn(),
}));

vi.mock('@/lib/image', () => ({
  compressImage: vi.fn(),
}));

// Mock next/navigation router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---- Helpers ----

const mockAddScanRecord = vi.mocked(storage.addScanRecord);
const mockCompressImage = vi.mocked(imageLib.compressImage);

/** Returns a minimal 1×1 JPEG Blob */
function fakeBlob(): Blob {
  return new Blob(['fake-image-data'], { type: 'image/jpeg' });
}

/** Returns a File wrapping fakeBlob */
function fakeFile(): File {
  return new File([fakeBlob()], 'menu.jpg', { type: 'image/jpeg' });
}

const FIXED_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const FIXED_ISO  = '2026-04-26T12:00:00.000Z';

const DISHES = [
  {
    name: 'Pad Thai',
    riskLevel: 'high' as const,
    blacklistedFound: ['peanuts'],
    allIngredients: ['peanuts', 'rice noodles', 'tofu'],
    source: 'both' as const,
  },
];

/** Configures global.fetch to resolve with a successful dishes response */
function mockFetchSuccess() {
  (global.fetch as Mock).mockResolvedValueOnce(
    new Response(JSON.stringify({ dishes: DISHES }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/** Configures global.fetch to resolve with the given HTTP status */
function mockFetchStatus(status: number) {
  (global.fetch as Mock).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: 'fail' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/** Configures global.fetch to reject (network failure) */
function mockFetchNetworkError() {
  (global.fetch as Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));
}

// ---- Setup ----

beforeEach(() => {
  vi.clearAllMocks();

  // Default: compression succeeds
  mockCompressImage.mockResolvedValue(fakeBlob());

  // Stable UUID and timestamp for deterministic assertions
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(FIXED_UUID);
  vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

  global.fetch = vi.fn();

  // Reset sessionStorage between tests
  sessionStorage.clear();
});

// ---- Tests ----

describe('useAnalyze', () => {
  it('T1: initial state is idle with no error', () => {
    const { result } = renderHook(() => useAnalyze());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('T2: status transitions to loading while fetch is in flight', async () => {
    // Fetch never resolves during this test — we inspect the in-flight state
    (global.fetch as Mock).mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useAnalyze());
    act(() => {
      result.current.analyze(fakeFile(), ['peanuts']);
    });

    expect(result.current.status).toBe('loading');
  });

  it('T3: on success — saves record, writes sessionStorage, navigates to /results', async () => {
    mockFetchSuccess();

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), ['peanuts']);
    });

    // addScanRecord called with correct record shape
    expect(mockAddScanRecord).toHaveBeenCalledOnce();
    const savedRecord = mockAddScanRecord.mock.calls[0][0];
    expect(savedRecord).toEqual({
      id: FIXED_UUID,
      timestamp: FIXED_ISO,
      dishes: DISHES,
      blacklistSnapshot: ['peanuts'],
    });

    // sessionStorage written with the same record
    const stored = sessionStorage.getItem('foodfilter_current_scan');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(savedRecord);

    // navigated to results
    expect(mockPush).toHaveBeenCalledWith('/results');
  });

  it('T4: network error → status=error with correct message', async () => {
    mockFetchNetworkError();

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Could not reach the analysis service. Check your connection and try again.'
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('T5: HTTP 400 → status=error with correct message', async () => {
    mockFetchStatus(400);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Invalid request. Please re-select your image and try again.'
    );
  });

  it('T6: HTTP 500 → status=error with correct message', async () => {
    mockFetchStatus(500);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Analysis failed. Please try again.');
  });

  it('T7: reset() clears error and returns to idle', async () => {
    mockFetchStatus(500);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails (module not found)**

```bash
npx vitest run __tests__/lib/hooks/useAnalyze.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/hooks/useAnalyze'`

---

- [ ] **Step 3: Create `lib/hooks/useAnalyze.ts`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image';
import { addScanRecord } from '@/lib/storage';
import type { ScanRecord } from '@/lib/types';

export type AnalyzeStatus = 'idle' | 'loading' | 'error';

export interface UseAnalyzeReturn {
  status: AnalyzeStatus;
  error: string | null;
  analyze: (file: File, blacklist: string[]) => Promise<void>;
  reset: () => void;
}

function mapError(err: unknown, status?: number): string {
  if (status === 400) {
    return 'Invalid request. Please re-select your image and try again.';
  }
  if (status !== undefined) {
    // 500 or any other non-OK status
    return 'Analysis failed. Please try again.';
  }
  // Network-level failure (fetch threw)
  return 'Could not reach the analysis service. Check your connection and try again.';
}

export function useAnalyze(): UseAnalyzeReturn {
  const router = useRouter();
  const [status, setStatus] = useState<AnalyzeStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File, blacklist: string[]): Promise<void> {
    setStatus('loading');
    setError(null);

    try {
      // Step 1: Compress image to ≤ 1 MB JPEG
      const compressed = await compressImage(file);

      // Step 2: Build multipart form data
      const body = new FormData();
      body.append('image', compressed, 'menu.jpg');
      body.append('blacklist', JSON.stringify(blacklist));

      // Step 3: Call the server proxy
      const response = await fetch('/api/analyze', { method: 'POST', body });

      if (!response.ok) {
        setError(mapError(null, response.status));
        setStatus('error');
        return;
      }

      const json = (await response.json()) as { dishes: ScanRecord['dishes'] };

      // Step 4: Build and persist the scan record
      const record: ScanRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        dishes: json.dishes,
        blacklistSnapshot: [...blacklist],
      };

      // Persist to localStorage history (fire-and-forget; storage.ts handles errors)
      addScanRecord(record);

      // Write to sessionStorage for the results page handoff
      try {
        sessionStorage.setItem('foodfilter_current_scan', JSON.stringify(record));
      } catch {
        // sessionStorage unavailable (private browsing quota reached) — navigate anyway
        console.warn('[useAnalyze] Failed to write to sessionStorage');
      }

      // Step 5: Navigate to results
      router.push('/results');
    } catch {
      setError(mapError(null));
      setStatus('error');
    }
  }

  function reset(): void {
    setStatus('idle');
    setError(null);
  }

  return { status, error, analyze, reset };
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
npx vitest run __tests__/lib/hooks/useAnalyze.test.ts
```

Expected: 7 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useAnalyze.ts __tests__/lib/hooks/useAnalyze.test.ts
git commit -m "feat(e5): add useAnalyze hook with full API call lifecycle"
```

---

## Task 2: Loading & Error States in ScanInput

**Files:**
- Modify: `components/ScanInput.tsx`

The existing `handleAnalyze` function is a stub that validates but never calls the API. This task replaces that stub with the real implementation and adds the loading/error UI.

- [ ] **Step 1: Read the current ScanInput before editing**

Read `components/ScanInput.tsx` in full to understand the exact current structure before making any changes.

- [ ] **Step 2: Add `useAnalyze` import and hook call**

At the top of `ScanInput.tsx`, add the import:

```typescript
import { useAnalyze } from '@/lib/hooks/useAnalyze';
```

Inside the `ScanInput` component body, after the existing hook calls (`useBlacklistContext`, `useRef`, `useState`, `useEffect`), add:

```typescript
const { status, error: analyzeError, analyze, reset: resetAnalyze } = useAnalyze();
```

- [ ] **Step 3: Replace the `handleAnalyze` stub**

Replace the existing `handleAnalyze` function body:

```typescript
// OLD — stub, replace this entire function:
function handleAnalyze() {
  if (!selectedFile) {
    setValidationError('Select a menu image before analyzing.');
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setValidationError(null);
    setIsOfflineAlertVisible(true);
    return;
  }
}
```

With:

```typescript
function handleAnalyze() {
  if (!selectedFile) {
    setValidationError('Select a menu image before analyzing.');
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setValidationError(null);
    setIsOfflineAlertVisible(true);
    return;
  }

  analyze(selectedFile, items);
}
```

- [ ] **Step 4: Add the 15-second timeout state**

After the existing `useState`/`useRef` declarations (and before the `useEffect` blocks), add:

```typescript
const [showSlowWarning, setShowSlowWarning] = useState(false);
```

Add a new `useEffect` after the existing effects to manage the slow-warning timer:

```typescript
useEffect(() => {
  if (status !== 'loading') {
    setShowSlowWarning(false);
    return undefined;
  }

  const timer = setTimeout(() => setShowSlowWarning(true), 15_000);
  return () => clearTimeout(timer);
}, [status]);
```

- [ ] **Step 5: Add the loading state inline replacement**

Inside the JSX, locate the `<Card>` that contains the image selection UI. Add a conditional branch so that when `status === 'loading'`, the card body is replaced with the loading indicator.

Find the `<CardContent ...>` opening tag inside the card and wrap its content:

```tsx
<CardContent className="flex flex-col gap-6">
  {status === 'loading' ? (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
      <p className="text-sm font-medium">Analyzing your menu…</p>
      {showSlowWarning ? (
        <p className="text-xs">This is taking longer than usual…</p>
      ) : null}
    </div>
  ) : (
    /* existing CardContent children — move them all inside this else branch */
    ...existing content...
  )}
</CardContent>
```

> **Important:** Only the content of `<CardContent>` changes. The `<CardHeader>` (title and description) stays outside this condition and is always visible.

- [ ] **Step 6: Add the `Loader2` import**

`Loader2` is from lucide-react. Add it to the existing lucide import line:

```typescript
// Before:
import { Camera, ImageUp, TriangleAlert, X } from 'lucide-react';

// After:
import { Camera, ImageUp, Loader2, TriangleAlert, X } from 'lucide-react';
```

- [ ] **Step 7: Add the analyzeError alert and Try Again button**

In the JSX alerts section (where `validationError` and `isOfflineAlertVisible` alerts are rendered), add a new block for `analyzeError`. Place it after the offline alert and before the `<Card>`:

```tsx
{analyzeError ? (
  <div
    className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    role="alert"
  >
    <p>{analyzeError}</p>
    <button
      type="button"
      onClick={resetAnalyze}
      className="self-start rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
    >
      Try Again
    </button>
  </div>
) : null}
```

- [ ] **Step 8: Disable camera/upload buttons while loading**

The two `<Button>` elements that trigger camera and upload inputs need `disabled={status === 'loading'}` added to their props. Locate each button's onClick handler and add the disabled prop:

```tsx
// Camera button — add disabled prop:
<Button
  type="button"
  variant="outline"
  className="h-auto flex-col gap-2 py-6"
  onClick={() => cameraInputRef.current?.click()}
  disabled={status === 'loading'}
>

// Upload button — add disabled prop:
<Button
  type="button"
  variant="outline"
  className="h-auto flex-col gap-2 py-6"
  onClick={() => uploadInputRef.current?.click()}
  disabled={status === 'loading'}
>
```

- [ ] **Step 9: Disable the Analyze Menu button while loading**

Locate the "Analyze Menu" `<Button>` (the one with `onClick={handleAnalyze}`) and add `disabled={status === 'loading' || !selectedFile}`:

```tsx
<Button
  type="button"
  className="w-full sm:w-auto"
  onClick={handleAnalyze}
  disabled={status === 'loading' || !selectedFile}
>
  Analyze Menu
</Button>
```

- [ ] **Step 10: Run all tests to verify no regressions**

```bash
npx vitest run
```

Expected: all tests pass. The existing scan page tests in `__tests__/app/scan/page.test.tsx` should still pass since they don't test the analyze flow.

- [ ] **Step 11: Commit**

```bash
git add components/ScanInput.tsx
git commit -m "feat(e5): wire useAnalyze into ScanInput with loading and error states"
```

---

## Task 3: Stub Results Page

**Files:**
- Create: `app/results/page.tsx`
- Create: `app/results/_components/ResultsClient.tsx`

The results page needs `sessionStorage` which is browser-only, so it requires a client component for the data read. The server component (`page.tsx`) is a thin shell.

- [ ] **Step 1: Create the client component**

Create `app/results/_components/ResultsClient.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ScanRecord } from '@/lib/types';

const SESSION_KEY = 'foodfilter_current_scan';

const RISK_LABEL: Record<string, string> = {
  high: '🔴 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
};

export function ResultsClient() {
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        router.replace('/scan');
        return;
      }
      const parsed = JSON.parse(raw) as ScanRecord;
      // Basic validation — redirect if the record doesn't look right
      if (!parsed?.dishes || !Array.isArray(parsed.dishes)) {
        router.replace('/scan');
        return;
      }
      setRecord(parsed);
    } catch {
      router.replace('/scan');
    }
  }, [router]);

  if (!record) {
    // Render nothing while redirect resolves or record loads
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {record.dishes.length} dish{record.dishes.length !== 1 ? 'es' : ''} analyzed
      </p>
      <ul className="flex flex-col gap-2">
        {record.dishes.map((dish, i) => (
          <li
            key={`${dish.name}-${i}`}
            className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
          >
            <span className="font-medium">{dish.name}</span>
            <span>{RISK_LABEL[dish.riskLevel] ?? dish.riskLevel}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/scan"
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Scan Another Menu
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create the server shell page**

Create `app/results/page.tsx`:

```typescript
import type { Metadata } from 'next';
import { ResultsClient } from './components/ResultsClient';

export const metadata: Metadata = {
  title: 'Results | FoodFilter',
  description: 'Analysis results for your scanned menu.',
};

export default function ResultsPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Results</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dishes detected in your menu, checked against your ingredient list.
            </p>
          </div>
          <ResultsClient />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Run all tests to verify no regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/results/page.tsx app/results/_components/ResultsClient.tsx
git commit -m "feat(e5): add stub results page reading from sessionStorage"
```

---

## Task 4: End-to-End Smoke Test (Manual)

This task verifies that all three E5 pieces work together before the epic is closed.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Smoke test — success path**

1. Navigate to `/ingredients` — add at least one ingredient (e.g. "peanuts").
2. Navigate to `/scan` — select any food menu image.
3. Click "Analyze Menu".
4. Confirm the loading spinner appears with "Analyzing your menu…".
5. After the API responds, confirm the browser navigates to `/results`.
6. Confirm at least one dish is listed with a risk label.
7. Navigate to `/scan` and reload `/results` directly — confirm it redirects back to `/scan`.

- [ ] **Step 3: Smoke test — error path**

1. Disconnect from the network (or disable Wi-Fi).
2. Navigate to `/scan`, select an image, click "Analyze Menu".
3. Confirm the offline alert appears (not the error alert — the online check fires first).
4. Re-enable network.
5. Navigate to `/scan`, select an image.
6. In browser DevTools → Network, set throttling to "Offline" after the button is clicked (to simulate a mid-flight network failure).
7. Confirm the analyzeError alert appears with the network error message.
8. Click "Try Again" — confirm the error clears and the image selection is still present.

- [ ] **Step 4: Final commit tag**

```bash
git commit --allow-empty -m "chore(e5): epic complete — AI analysis wired end-to-end"
```
