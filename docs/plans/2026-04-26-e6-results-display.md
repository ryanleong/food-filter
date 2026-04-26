# E6 Results Display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/results` page with a fully featured results view showing sortable dish cards with risk badges, a sticky summary bar, and proper edge-case handling.

**Architecture:** Three new units (`RiskBadge`, `DishCard`, `useResults`) are built test-first, then `ResultsClient` is rewritten to orchestrate them. History saving is already handled by `useAnalyze.ts` and requires no changes.

**Tech Stack:** Next.js 15, React 19, Vitest + Testing Library, Tailwind CSS, shadcn/ui Card + Button primitives.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/RiskBadge.tsx` | Color-coded risk level pill (presentational) |
| Create | `components/DishCard.tsx` | Expandable dish result card (presentational) |
| Create | `lib/hooks/useResults.ts` | sessionStorage read, validation, redirect logic |
| Modify | `app/results/components/ResultsClient.tsx` | Orchestrates useResults + dish list + summary bar |
| Create | `__tests__/components/RiskBadge.test.tsx` | Unit tests for RiskBadge |
| Create | `__tests__/components/DishCard.test.tsx` | Unit tests for DishCard |
| Create | `__tests__/lib/hooks/useResults.test.ts` | Unit tests for useResults |

---

## Task 1: RiskBadge Component

**Files:**
- Create: `components/RiskBadge.tsx`
- Create: `__tests__/components/RiskBadge.test.tsx`

- [ ] **Step 1.1: Write the failing tests**

Create `__tests__/components/RiskBadge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskBadge } from '@/components/RiskBadge';

describe('RiskBadge', () => {
  it('renders "⚠ High Risk" for high level', () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText('⚠ High Risk')).toBeInTheDocument();
  });

  it('renders "⚡ Medium Risk" for medium level', () => {
    render(<RiskBadge level="medium" />);
    expect(screen.getByText('⚡ Medium Risk')).toBeInTheDocument();
  });

  it('renders "✓ Safe" for low level', () => {
    render(<RiskBadge level="low" />);
    expect(screen.getByText('✓ Safe')).toBeInTheDocument();
  });

  it('applies red background class for high level', () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText('⚠ High Risk')).toHaveClass('bg-red-600');
  });

  it('applies amber background class for medium level', () => {
    render(<RiskBadge level="medium" />);
    expect(screen.getByText('⚡ Medium Risk')).toHaveClass('bg-amber-400');
  });

  it('applies green background class for low level', () => {
    render(<RiskBadge level="low" />);
    expect(screen.getByText('✓ Safe')).toHaveClass('bg-green-600');
  });
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/RiskBadge.test.tsx --reporter=verbose
```

Expected: FAIL — `Cannot find module '@/components/RiskBadge'`

- [ ] **Step 1.3: Implement RiskBadge**

Create `components/RiskBadge.tsx`:

```tsx
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
  high:   { label: '⚠ High Risk',   className: 'bg-red-600 text-white' },
  medium: { label: '⚡ Medium Risk', className: 'bg-amber-400 text-amber-900' },
  low:    { label: '✓ Safe',         className: 'bg-green-600 text-white' },
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const { label, className } = RISK_CONFIG[level];
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        className,
      )}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/RiskBadge.test.tsx --reporter=verbose
```

Expected: PASS — 6 tests

- [ ] **Step 1.5: Commit**

```bash
git add components/RiskBadge.tsx __tests__/components/RiskBadge.test.tsx
git commit -m "feat(e6): add RiskBadge component"
```

---

## Task 2: DishCard Component

**Files:**
- Create: `components/DishCard.tsx`
- Create: `__tests__/components/DishCard.test.tsx`

- [ ] **Step 2.1: Write the failing tests**

Create `__tests__/components/DishCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DishCard } from '@/components/DishCard';
import type { DishResult } from '@/lib/types';

const HIGH_DISH: DishResult = {
  name: 'Pad Thai',
  riskLevel: 'high',
  blacklistedFound: ['peanuts', 'soy sauce'],
  allIngredients: ['peanuts', 'soy sauce', 'rice noodles', 'tofu', 'egg'],
  source: 'both',
};

const MEDIUM_DISH: DishResult = {
  name: 'Green Curry',
  riskLevel: 'medium',
  blacklistedFound: ['dairy'],
  allIngredients: ['coconut milk', 'dairy', 'chicken', 'basil'],
  source: 'model',
};

const LOW_DISH: DishResult = {
  name: 'Steamed Rice',
  riskLevel: 'low',
  blacklistedFound: [],
  allIngredients: ['rice', 'water'],
  source: 'menu',
};

describe('DishCard', () => {
  it('renders the dish name', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(screen.getByText('Pad Thai')).toBeInTheDocument();
  });

  it('renders the RiskBadge for the dish risk level', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(screen.getByText('⚠ High Risk')).toBeInTheDocument();
  });

  it('shows "Contains:" line for a high-risk dish with blacklisted ingredients', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(screen.getByText('Contains: peanuts, soy sauce')).toBeInTheDocument();
  });

  it('shows "Contains:" line for a medium-risk dish with blacklisted ingredients', () => {
    render(<DishCard dish={MEDIUM_DISH} />);
    expect(screen.getByText('Contains: dairy')).toBeInTheDocument();
  });

  it('does NOT show "Contains:" line for a low-risk dish', () => {
    render(<DishCard dish={LOW_DISH} />);
    expect(screen.queryByText(/Contains:/i)).not.toBeInTheDocument();
  });

  it('shows the expand toggle button with ingredient count', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(
      screen.getByRole('button', { name: 'Show all ingredients (5)' }),
    ).toBeInTheDocument();
  });

  it('expand toggle has aria-expanded="false" by default', () => {
    render(<DishCard dish={HIGH_DISH} />);
    expect(
      screen.getByRole('button', { name: 'Show all ingredients (5)' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking expand reveals allIngredients and source note', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    expect(
      screen.getByText('peanuts, soy sauce, rice noodles, tofu, egg'),
    ).toBeInTheDocument();
    expect(screen.getByText('Source: menu + AI knowledge')).toBeInTheDocument();
  });

  it('expand toggle label changes to "Hide ingredients" when expanded', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    expect(screen.getByRole('button', { name: 'Hide ingredients' })).toBeInTheDocument();
  });

  it('aria-expanded is "true" when expanded', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    expect(screen.getByRole('button', { name: 'Hide ingredients' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('clicking "Hide ingredients" collapses the section', async () => {
    render(<DishCard dish={HIGH_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (5)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide ingredients' }));
    expect(
      screen.queryByText('peanuts, soy sauce, rice noodles, tofu, egg'),
    ).not.toBeInTheDocument();
  });

  it('shows "Source: menu text" for source="menu"', async () => {
    render(<DishCard dish={LOW_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (2)' }));
    expect(screen.getByText('Source: menu text')).toBeInTheDocument();
  });

  it('shows "Source: AI knowledge" for source="model"', async () => {
    render(<DishCard dish={MEDIUM_DISH} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show all ingredients (4)' }));
    expect(screen.getByText('Source: AI knowledge')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/DishCard.test.tsx --reporter=verbose
```

Expected: FAIL — `Cannot find module '@/components/DishCard'`

- [ ] **Step 2.3: Implement DishCard**

Create `components/DishCard.tsx`:

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
        <CardTitle className="text-base font-semibold">{name}</CardTitle>
        <RiskBadge level={riskLevel} />
      </CardHeader>
      <CardContent className="space-y-2">
        {showBlacklisted && (
          <p
            className={cn(
              'text-sm font-medium',
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
            <p className="text-sm text-muted-foreground">
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

- [ ] **Step 2.4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/DishCard.test.tsx --reporter=verbose
```

Expected: PASS — 12 tests

- [ ] **Step 2.5: Commit**

```bash
git add components/DishCard.tsx __tests__/components/DishCard.test.tsx
git commit -m "feat(e6): add DishCard component"
```

---

## Task 3: useResults Hook

**Files:**
- Create: `lib/hooks/useResults.ts`
- Create: `__tests__/lib/hooks/useResults.test.ts`

- [ ] **Step 3.1: Write the failing tests**

Create `__tests__/lib/hooks/useResults.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useResults, SESSION_KEY } from '@/lib/hooks/useResults';
import type { ScanRecord } from '@/lib/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const VALID_RECORD: ScanRecord = {
  id: 'abc-123',
  timestamp: '2026-04-26T12:00:00.000Z',
  dishes: [
    {
      name: 'Pad Thai',
      riskLevel: 'high',
      blacklistedFound: ['peanuts'],
      allIngredients: ['peanuts', 'noodles'],
      source: 'both',
    },
  ],
  blacklistSnapshot: ['peanuts'],
};

describe('useResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('returns loaded=false and record=null on initial render', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(VALID_RECORD));
    const { result } = renderHook(() => useResults());
    // Synchronous initial state before useEffect fires
    expect(result.current.loaded).toBe(false);
    expect(result.current.record).toBeNull();
  });

  it('sets record and loaded=true when sessionStorage has valid data', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(VALID_RECORD));
    const { result } = renderHook(() => useResults());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.record).toEqual(VALID_RECORD);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to /scan when the sessionStorage key is missing', async () => {
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when sessionStorage value is malformed JSON', async () => {
    sessionStorage.setItem(SESSION_KEY, 'not-valid-json{{{');
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when the parsed object has no dishes field', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: 'abc', timestamp: '2026-01-01' }));
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when dishes is not an array', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: 'abc', dishes: 'not-an-array' }));
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });
});
```

- [ ] **Step 3.2: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/hooks/useResults.test.ts --reporter=verbose
```

Expected: FAIL — `Cannot find module '@/lib/hooks/useResults'`

- [ ] **Step 3.3: Implement useResults**

Create `lib/hooks/useResults.ts`:

```ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScanRecord } from '@/lib/types';

export const SESSION_KEY = 'foodfilter_current_scan';

export interface UseResultsReturn {
  record: ScanRecord | null;
  loaded: boolean;
}

export function useResults(): UseResultsReturn {
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      router.push('/scan');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.push('/scan');
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('dishes' in parsed) ||
      !Array.isArray((parsed as Record<string, unknown>).dishes)
    ) {
      router.push('/scan');
      return;
    }

    setRecord(parsed as ScanRecord);
    setLoaded(true);
  }, [router]);

  return { record, loaded };
}
```

- [ ] **Step 3.4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/hooks/useResults.test.ts --reporter=verbose
```

Expected: PASS — 6 tests

- [ ] **Step 3.5: Commit**

```bash
git add lib/hooks/useResults.ts __tests__/lib/hooks/useResults.test.ts
git commit -m "feat(e6): add useResults hook"
```

---

## Task 4: Rewrite ResultsClient

**Files:**
- Modify: `app/results/components/ResultsClient.tsx`

No additional unit test needed — `useResults`, `DishCard`, and `RiskBadge` are individually tested. `ResultsClient` is a thin integration layer.

- [ ] **Step 4.1: Replace ResultsClient**

Overwrite `app/results/components/ResultsClient.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { useResults } from '@/lib/hooks/useResults';
import { DishCard } from '@/components/DishCard';
import { Button } from '@/components/ui/button';
import type { RiskLevel } from '@/lib/types';

const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export function ResultsClient() {
  const { record, loaded } = useResults();

  if (!loaded || !record) {
    return null;
  }

  const sorted = [...record.dishes].sort(
    (a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel],
  );

  const highCount   = sorted.filter((d) => d.riskLevel === 'high').length;
  const mediumCount = sorted.filter((d) => d.riskLevel === 'medium').length;
  const lowCount    = sorted.filter((d) => d.riskLevel === 'low').length;
  const allLow      = highCount === 0 && mediumCount === 0 && sorted.length > 0;
  const noDishes    = sorted.length === 0;

  return (
    <div>
      {/* Sticky summary bar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <p className="text-sm font-medium">
          {sorted.length} {sorted.length === 1 ? 'dish' : 'dishes'}
          {highCount > 0 && (
            <> · <span className="text-red-600">{highCount} High Risk</span></>
          )}
          {mediumCount > 0 && (
            <> · <span className="text-amber-600">{mediumCount} Medium Risk</span></>
          )}
          {lowCount > 0 && (
            <> · <span className="text-green-600">{lowCount} Safe</span></>
          )}
        </p>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Button asChild variant="default">
          <Link href="/scan">Scan Another Menu</Link>
        </Button>

        {noDishes && (
          <p className="text-sm text-muted-foreground">
            No dishes could be identified in this image. Try a clearer photo.
          </p>
        )}

        {allLow && (
          <p className="text-sm font-medium text-green-600">
            Great news — no blacklisted ingredients detected!
          </p>
        )}

        {sorted.map((dish, index) => (
          <DishCard key={index} dish={dish} />
        ))}

        {sorted.length > 0 && (
          <Button asChild variant="default">
            <Link href="/scan">Scan Another Menu</Link>
          </Button>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4.2: Run the full test suite**

```bash
npx vitest run --reporter=verbose
```

Expected: All existing tests pass, plus the 24 new tests added in Tasks 1–3.

- [ ] **Step 4.3: Start the dev server and do a manual smoke test**

```bash
npm run dev
```

Open `http://localhost:3000/scan` in the browser. Take or upload a menu photo, click "Analyze Menu", and verify:
- Page navigates to `/results`
- Sticky summary bar is visible and shows correct counts with colored text
- Dishes are sorted high → medium → low
- Each DishCard shows the dish name and correct RiskBadge
- High/medium cards show the "Contains:" line with correct color
- Clicking "Show all ingredients (N)" expands the card and shows all ingredients + source note
- Clicking "Hide ingredients" collapses it again
- "Scan Another Menu" button appears both above and below the dish list and navigates to `/scan`
- Navigating directly to `/results` (no prior analysis) redirects to `/scan`

- [ ] **Step 4.4: Commit**

```bash
git add app/results/components/ResultsClient.tsx
git commit -m "feat(e6): rewrite ResultsClient with summary bar, sorted DishCards, and edge cases"
```
