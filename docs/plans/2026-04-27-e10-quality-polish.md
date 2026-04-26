# E10 — Quality & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining accessibility, overflow, security, and edge-case resilience gaps identified in E10 without introducing new features.

**Architecture:** Five independent, surgical changes: touch-target fix in `IngredientPill`; overflow guards in `DishCard` and `IngredientPill`; a new aspect-ratio test in the image test suite; a Content-Type guard in the API route; and a new `StorageBanner` component wired into the global layout that listens for a custom DOM event fired by `storage.ts` on write failures.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, Vitest + Testing Library

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `components/IngredientPill.tsx` | Modify | Touch-target padding + overflow guard |
| `components/DishCard.tsx` | Modify | Overflow guards for dish name and ingredient text |
| `__tests__/lib/image.test.ts` | Modify | Add aspect-ratio preservation test |
| `app/api/analyze/route.ts` | Modify | Content-Type validation before FormData parse |
| `lib/storage.ts` | Modify | Export `isStorageAvailable`; dispatch custom event on write errors |
| `components/StorageBanner.tsx` | Create | Dismissible banner when localStorage is unavailable or quota exceeded |
| `app/layout.tsx` | Modify | Render `<StorageBanner />` inside `<BlacklistProvider>` |

---

## Task 1: Fix touch-target size and add overflow guard on `IngredientPill`

**Files:**
- Modify: `components/IngredientPill.tsx`

This combines E10-S1 (touch target) and E10-S2 (overflow) into one edit since both touch the same file.

- [ ] **Step 1: Edit `IngredientPill.tsx`**

Replace the current `<span>` and `<button>` with the following. The name `<span>` gets `break-all` so long strings wrap inside the pill. The button gets `p-2.5 -m-2.5` to expand the hit area to 44×44px while keeping the visual ×-icon position unchanged (negative margin cancels out the extra padding in the flex layout).

```tsx
'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientPillProps {
  name: string;
  onRemove: (name: string) => void;
}

export function IngredientPill({ name, onRemove }: IngredientPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-sm',
        'transition-colors hover:bg-muted/80',
      )}
    >
      <span className="break-all">{name}</span>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(name)}
        className="flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring p-2.5 -m-2.5"
      >
        <X size={14} />
      </button>
    </span>
  );
}
```

- [ ] **Step 2: Run existing IngredientPill tests to confirm nothing broke**

```bash
npx vitest run __tests__/components/IngredientPill.test.tsx
```

Expected output: all 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/IngredientPill.tsx
git commit -m "fix(a11y): expand ingredient pill remove button touch target; add break-all overflow guard"
```

---

## Task 2: Add overflow guards to `DishCard`

**Files:**
- Modify: `components/DishCard.tsx`

`break-words` prevents long dish names or ingredient strings from overflowing their card container on narrow viewports.

- [ ] **Step 1: Edit `DishCard.tsx`**

Add `break-words` to the `CardTitle` className and to the `allIngredients` paragraph className:

```tsx
'use client';

import { useState, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/RiskBadge';
import { cn } from '@/lib/utils';
import type { DishResult, IngredientSource } from '@/lib/types';

interface DishCardProps {
  dish: DishResult;
}

const SOURCE_LABELS: Record<IngredientSource, string> = {
  menu:  'Source: menu text',
  model: 'Source: AI knowledge',
  both:  'Source: menu + AI knowledge',
};

export function DishCard({ dish }: DishCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expandableId = useId();

  const { name, riskLevel, blacklistedFound, allIngredients, source } = dish;
  const showBlacklisted = riskLevel !== 'low' && blacklistedFound.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold break-words">{name}</CardTitle>
        <RiskBadge level={riskLevel} />
      </CardHeader>
      <CardContent className="space-y-2">
        {showBlacklisted && (
          <p
            className={cn(
              'text-sm font-medium break-words',
              riskLevel === 'high'
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400',
            )}
          >
            Contains: {blacklistedFound.join(', ')}
          </p>
        )}

        {expanded && (
          <div id={expandableId}>
            <p className="text-sm text-muted-foreground break-words">
              {allIngredients.join(', ')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {SOURCE_LABELS[source]}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={expandableId}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        >
          {expanded
            ? 'Hide ingredients'
            : `Show all ingredients (${allIngredients.length})`}
        </button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Run existing DishCard tests to confirm nothing broke**

```bash
npx vitest run __tests__/components/DishCard.test.tsx
```

Expected output: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/DishCard.tsx
git commit -m "fix(ui): add break-words overflow guard to DishCard dish name and ingredient text"
```

---

## Task 3: Add aspect-ratio preservation test to image compression suite

**Files:**
- Modify: `__tests__/lib/image.test.ts`

The existing tests verify JPEG output, single/multi-pass encoding, and floor-stop. This task adds the missing assertion that the resize loop keeps `width/height` constant.

- [ ] **Step 1: Add the new test case**

Append the following `it(...)` block inside the existing `describe('compressImage', () => { ... })` block, after the `'respects a custom maxSizeKB parameter'` test. The test overrides `MockImage` for this one case with `naturalWidth = 400, naturalHeight = 200` (2:1 ratio) and captures `drawImage` argument pairs.

```ts
  it('preserves aspect ratio when resizing across multiple iterations', async () => {
    // Use a 400×200 image (2:1 ratio) and always return an oversized blob
    // so the loop runs at least twice before the floor stops it.
    vi.stubGlobal(
      'Image',
      class MockImageWide {
        naturalWidth = 400;
        naturalHeight = 200;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          Promise.resolve().then(() => this.onload?.());
        }
        get src() { return ''; }
      }
    );

    // Always return a blob larger than maxSizeKB so the loop keeps shrinking
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => {
        callback(new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' }));
      }
    );

    // Capture every drawImage(img, 0, 0, width, height) call
    const drawImageCalls: Array<{ width: number; height: number }> = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: (_img: unknown, _x: unknown, _y: unknown, width: number, height: number) => {
        drawImageCalls.push({ width, height });
      },
    } as unknown as CanvasRenderingContext2D);

    const file = new File(['data'], 'wide.jpg', { type: 'image/jpeg' });
    // maxSizeKB = 1 KB — blob is always 2 MB, so loop runs until floor
    await compressImage(file, 1);

    // Must have looped at least twice
    expect(drawImageCalls.length).toBeGreaterThanOrEqual(2);

    // Every call must maintain the original 2:1 aspect ratio (±0.01 tolerance for rounding)
    for (const { width, height } of drawImageCalls) {
      expect(width / height).toBeCloseTo(2, 1);
    }
  });
```

- [ ] **Step 2: Run the image test suite to confirm the new test passes**

```bash
npx vitest run __tests__/lib/image.test.ts
```

Expected output: all 5 tests pass (4 existing + 1 new).

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/image.test.ts
git commit -m "test(image): add aspect-ratio preservation test for compressImage resize loop"
```

---

## Task 4: Add Content-Type validation to the API route

**Files:**
- Modify: `app/api/analyze/route.ts`

- [ ] **Step 1: Add the Content-Type guard**

Insert the following block as the very first thing inside `POST`, before the `// --- Parse FormData ---` comment:

```ts
export async function POST(request: Request) {
  // --- Validate Content-Type ---
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
  }

  // --- Parse FormData ---
  let formData: FormData;
  // ... rest of the existing handler unchanged
```

The full edited top of the function (lines that change):

```ts
export async function POST(request: Request) {
  // --- Validate Content-Type ---
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
  }

  // --- Parse FormData ---
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
```

- [ ] **Step 2: Add a test for the 415 response**

Open `__tests__/app/api/analyze/` and find the existing route test file. Add one new `it(...)` case to the existing describe block:

```ts
it('returns 415 when Content-Type is not multipart/form-data', async () => {
  const request = new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const response = await POST(request);
  expect(response.status).toBe(415);
  const body = await response.json();
  expect(body).toEqual({ error: 'Unsupported Media Type' });
});
```

- [ ] **Step 3: Run the API route tests**

```bash
npx vitest run __tests__/app/api/analyze
```

Expected output: all existing tests pass + the new 415 test passes.

- [ ] **Step 4: Commit**

```bash
git add app/api/analyze/route.ts __tests__/app/api/analyze/
git commit -m "fix(api): validate Content-Type multipart/form-data; return 415 on mismatch"
```

---

## Task 5: Export `isStorageAvailable` and dispatch storage-error custom event

**Files:**
- Modify: `lib/storage.ts`

This prepares storage.ts for the `StorageBanner` in Task 6. Two changes:
1. Make `isStorageAvailable` exported (was `function`, becomes `export function`).
2. In the `catch` block of each *write* function (`saveBlacklist`, `addScanRecord`, `deleteScanRecord`, `clearHistory`), dispatch a `CustomEvent('foodfilter:storage-error')` on `window` after the existing `console.warn`. Read functions (`getBlacklist`, `getHistory`) already return safe defaults and don't need the event.

- [ ] **Step 1: Edit `lib/storage.ts`**

```ts
import type { ScanRecord } from './types';

const BLACKLIST_KEY = 'foodfilter_blacklist';
const HISTORY_KEY = 'foodfilter_history';

/** Returns false in SSR environments where localStorage is unavailable. */
export function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Dispatches a custom DOM event so the StorageBanner can react to write failures. */
function notifyStorageError(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('foodfilter:storage-error'));
  }
}

export function getBlacklist(): string[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(BLACKLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[storage] Failed to parse blacklist from localStorage');
    return [];
  }
}

export function saveBlacklist(items: string[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify(items));
  } catch {
    console.warn('[storage] Failed to save blacklist to localStorage');
    notifyStorageError();
  }
}

export function getHistory(): ScanRecord[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[storage] Failed to parse history from localStorage');
    return [];
  }
}

// Prepends the new record so the array is always newest-first
export function addScanRecord(record: ScanRecord): void {
  if (!isStorageAvailable()) return;
  const history = getHistory();
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
  } catch {
    console.warn('[storage] Failed to save history to localStorage');
    notifyStorageError();
  }
}

export function deleteScanRecord(id: string): void {
  if (!isStorageAvailable()) return;
  const history = getHistory();
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.filter((r) => r.id !== id))
    );
  } catch {
    console.warn('[storage] Failed to save history to localStorage');
    notifyStorageError();
  }
}

export function clearHistory(): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    console.warn('[storage] Failed to clear history from localStorage');
    notifyStorageError();
  }
}
```

- [ ] **Step 2: Run the existing storage tests to confirm nothing broke**

```bash
npx vitest run __tests__/lib/storage.test.ts
```

Expected output: all tests pass (the export change is backward-compatible).

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat(storage): export isStorageAvailable; dispatch foodfilter:storage-error on write failures"
```

---

## Task 6: Create `StorageBanner` component

**Files:**
- Create: `components/StorageBanner.tsx`

The banner:
- Checks `isStorageAvailable()` on mount; if false, shows itself immediately.
- Listens for `'foodfilter:storage-error'` events on `window` to catch runtime write failures (quota exceeded, etc.).
- Is dismissible via an × button.
- Renders nothing when dismissed or when storage is fine.

- [ ] **Step 1: Write a failing test first**

Create `__tests__/components/StorageBanner.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageBanner } from '@/components/StorageBanner';

// We mock the isStorageAvailable import so we can control it per test
vi.mock('@/lib/storage', () => ({
  isStorageAvailable: vi.fn(),
}));

import { isStorageAvailable } from '@/lib/storage';
const mockIsStorageAvailable = vi.mocked(isStorageAvailable);

describe('StorageBanner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when localStorage is available', () => {
    mockIsStorageAvailable.mockReturnValue(true);
    const { container } = render(<StorageBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the warning banner when localStorage is unavailable', () => {
    mockIsStorageAvailable.mockReturnValue(false);
    render(<StorageBanner />);
    expect(
      screen.getByText('Your data cannot be saved in this browser session.'),
    ).toBeInTheDocument();
  });

  it('shows the banner when a foodfilter:storage-error event is dispatched', async () => {
    mockIsStorageAvailable.mockReturnValue(true);
    render(<StorageBanner />);
    // No banner yet
    expect(
      screen.queryByText('Your data cannot be saved in this browser session.'),
    ).not.toBeInTheDocument();

    // Simulate a write failure event
    act(() => {
      window.dispatchEvent(new CustomEvent('foodfilter:storage-error'));
    });

    expect(
      screen.getByText('Your data cannot be saved in this browser session.'),
    ).toBeInTheDocument();
  });

  it('dismisses the banner when the × button is clicked', async () => {
    mockIsStorageAvailable.mockReturnValue(false);
    render(<StorageBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss storage warning' }));
    expect(
      screen.queryByText('Your data cannot be saved in this browser session.'),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm the tests fail (component does not exist yet)**

```bash
npx vitest run __tests__/components/StorageBanner.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/StorageBanner'`

- [ ] **Step 3: Create `components/StorageBanner.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { isStorageAvailable } from '@/lib/storage';

export function StorageBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show immediately if localStorage is unavailable in this environment
    if (!isStorageAvailable()) {
      setVisible(true);
      return;
    }

    // Also listen for runtime write failures (e.g. quota exceeded)
    function handleStorageError() {
      setVisible(true);
    }

    window.addEventListener('foodfilter:storage-error', handleStorageError);
    return () => {
      window.removeEventListener('foodfilter:storage-error', handleStorageError);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p>Your data cannot be saved in this browser session.</p>
      <button
        type="button"
        aria-label="Dismiss storage warning"
        onClick={() => setVisible(false)}
        className="shrink-0 rounded text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the StorageBanner tests to confirm they pass**

```bash
npx vitest run __tests__/components/StorageBanner.test.tsx
```

Expected output: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/StorageBanner.tsx __tests__/components/StorageBanner.test.tsx
git commit -m "feat(storage): add StorageBanner component for localStorage unavailable state"
```

---

## Task 7: Wire `StorageBanner` into the root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Edit `app/layout.tsx`**

Add the `StorageBanner` import and render it as the first child inside `<BlacklistProvider>`, above `<main>`:

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { BlacklistProvider } from '@/app/providers';
import { StorageBanner } from '@/components/StorageBanner';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'FoodFilter',
  description: 'Avoid unwanted ingredients when dining out',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FoodFilter',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopBar />
          <BlacklistProvider>
            <StorageBanner />
            <main className="pb-16">
              {children}
            </main>
          </BlacklistProvider>
          <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background" />}>
            <BottomNav />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Run the full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected output: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(layout): render StorageBanner inside BlacklistProvider for app-wide localStorage warning"
```

---

## Self-Review Checklist

**Spec coverage:**
- E10-S1 (touch target) → Task 1 ✓
- E10-S2 (overflow) → Tasks 1 & 2 ✓
- E10-S3 (aspect-ratio test) → Task 3 ✓
- E10-S4 (Content-Type validation) → Task 4 ✓
- E10-S5 (localStorage banner) → Tasks 5, 6, 7 ✓
- E10-S5 (long text overflow) → Tasks 1 & 2 ✓

**Placeholder scan:** No TBDs, TODOs, or "similar to" references found.

**Type consistency:**
- `isStorageAvailable` exported in Task 5, imported in Task 6 component and Task 6 test via `@/lib/storage` ✓
- `StorageBanner` named export in Task 6, imported as named export in Task 7 ✓
- Custom event name `'foodfilter:storage-error'` used consistently in storage.ts (Task 5), StorageBanner (Task 6), and test (Task 6) ✓
- `notifyStorageError` is a module-private helper in storage.ts — not exposed or referenced externally ✓
