# E6 Results Display — Design Spec

**Date:** April 26, 2026
**Epic:** E6 — Results Display
**Status:** Approved

---

## 1. Overview

Replace the placeholder `/results` page with a fully featured results view. Users are navigated to `/results` after a successful Gemini analysis. The page shows a sticky summary bar, a sorted list of dish cards, and edge-case messages for zero dishes or all-safe results.

**History save** is already handled by `useAnalyze.ts` (`addScanRecord` is called before navigation) — no additional work needed in the results layer.

---

## 2. New Files

| File | Type | Purpose |
|------|------|---------|
| `components/RiskBadge.tsx` | Component | Color-coded risk level pill |
| `components/DishCard.tsx` | Component | Expandable dish result card |
| `lib/hooks/useResults.ts` | Hook | sessionStorage read, validation, redirect |
| `__tests__/components/RiskBadge.test.tsx` | Test | RiskBadge unit tests |
| `__tests__/components/DishCard.test.tsx` | Test | DishCard unit tests |
| `__tests__/lib/hooks/useResults.test.ts` | Test | useResults unit tests |

---

## 3. Modified Files

| File | Change |
|------|--------|
| `app/results/components/ResultsClient.tsx` | Rewritten to use `useResults`, summary bar, sorted dish list |

---

## 4. Component: `RiskBadge`

**File:** `components/RiskBadge.tsx`

**Props:**
```ts
interface RiskBadgeProps {
  level: RiskLevel; // 'high' | 'medium' | 'low'
}
```

**Behavior:**
- Maps `RiskLevel` to a fixed color scheme and label. Never uses color alone — always includes both icon and text (WCAG accessibility).
- Does **not** use the existing shadcn `Badge` component. The existing badge has `hover:` state effects and limited color variants; `RiskBadge` needs non-interactive, semantically specific styling.
- Uses `cn()` from `lib/utils` for class composition.

**Visual spec:**

| Level | Background | Text | Label |
|-------|-----------|------|-------|
| `high` | `bg-red-600` | `text-white` | `⚠ High Risk` |
| `medium` | `bg-amber-400` | `text-amber-900` | `⚡ Medium Risk` |
| `low` | `bg-green-600` | `text-white` | `✓ Safe` |

**Styling:** `rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap`

---

## 5. Component: `DishCard`

**File:** `components/DishCard.tsx`

**Props:**
```ts
interface DishCardProps {
  dish: DishResult;
}
```

Uses existing shadcn primitives: `Card`, `CardHeader`, `CardTitle`, `CardContent` from `components/ui/card.tsx`.

### 5.1 Collapsed State (default)

- **`CardHeader`:** Dish name (left, `CardTitle`) + `RiskBadge` (right), flex row, space-between.
- **Blacklist alert** (only when `riskLevel !== 'low'` AND `blacklistedFound.length > 0`): a labeled line below the header inside `CardContent` — `"Contains: peanuts, dairy"`.
  - `high` → text in `text-red-600 dark:text-red-400`
  - `medium` → text in `text-amber-600 dark:text-amber-400`
- **Expand toggle button:** `"Show all ingredients (N)"` where N = `allIngredients.length`. Positioned at the bottom of `CardContent`. Has `aria-expanded={false}`.

### 5.2 Expanded State

All collapsed content remains visible, plus:
- **All ingredients list:** `allIngredients` joined by `", "` in `text-sm text-muted-foreground`.
- **Source note:** muted text line at the very bottom.
  - `menu` → `"Source: menu text"`
  - `model` → `"Source: AI knowledge"`
  - `both` → `"Source: menu + AI knowledge"`
- **Toggle button label** switches to `"Hide ingredients"`. `aria-expanded={true}`.

### 5.3 Accessibility

- Toggle button uses `aria-expanded` attribute.
- Toggle button has a descriptive `aria-controls` pointing to the expandable region id.
- Expandable region has `id` matching `aria-controls`.

---

## 6. Hook: `useResults`

**File:** `lib/hooks/useResults.ts`

```ts
export interface UseResultsReturn {
  record: ScanRecord | null;
  loaded: boolean;
}

export function useResults(): UseResultsReturn
```

**Behavior:**
1. Declares `record: ScanRecord | null = null` and `loaded = false` in state.
2. Inside `useEffect` (runs once on mount):
   - Calls `sessionStorage.getItem('foodfilter_current_scan')`.
   - On missing key or parse failure: calls `router.push('/scan')`, returns early.
   - Validates parsed value: must be an object with a `dishes` array. On failure: redirects to `/scan`.
   - On success: sets `record` and `loaded = true`.
3. SSR-safe: sessionStorage access is inside `useEffect`, never called during server render.
4. `SESSION_KEY = 'foodfilter_current_scan'` exported as a named constant for use in tests.

---

## 7. Updated `ResultsClient`

**File:** `app/results/components/ResultsClient.tsx`

Consumes `useResults()`. Renders nothing (`null`) until `loaded === true`.

### 7.1 Layout (top to bottom)

```
┌─────────────────────────────────────────┐  ← sticky top-0, bg-background/95 backdrop-blur
│  3 dishes · 1 High Risk · 1 Medium · 1 Safe │
└─────────────────────────────────────────┘
  [Scan Another Menu]  ← button, below sticky bar
  ┌──────────────────────────────────────┐
  │  DishCard (high)                     │
  ├──────────────────────────────────────┤
  │  DishCard (high)                     │
  ├──────────────────────────────────────┤
  │  DishCard (medium)                   │
  ├──────────────────────────────────────┤
  │  DishCard (low)                      │
  └──────────────────────────────────────┘
  [Scan Another Menu]  ← repeated at bottom
```

### 7.2 Summary Bar

- Sticky (`position: sticky; top: 0`), `z-10`, background `bg-background/95 backdrop-blur-sm` so page content scrolls beneath it.
- Text: `"N dishes · X High Risk · Y Medium Risk · Z Safe"`. Counts are live from the sorted dish list.
- High Risk count shown in `text-red-600`, Medium in `text-amber-600`, Safe in `text-green-600`.
- Has a bottom border (`border-b`) to visually separate from content.
- Padding: `px-4 py-3`.

### 7.3 Dish Sorting

```ts
const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
const sorted = [...record.dishes].sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
```

Uses a spread to avoid mutating the original array.

### 7.4 Edge Cases

- **Zero dishes:** Replace dish list with: `"No dishes could be identified in this image. Try a clearer photo."`
- **All dishes `low`:** Insert a positive message between the summary bar and the dish list: `"Great news — no blacklisted ingredients detected!"`
- Both edge cases show the "Scan Another Menu" button.

### 7.5 "Scan Another Menu" Button

- Uses the existing shadcn `Button` component (`variant="default"`).
- `href="/scan"` via Next.js `Link`.
- Appears once below the summary bar and again after the dish list.

---

## 8. Testing

### `RiskBadge.test.tsx`
- Renders the correct label for each `RiskLevel`.
- Applies the expected CSS class for each level (test via `className` checks or `data-testid`).

### `DishCard.test.tsx`
- Renders the dish name and `RiskBadge`.
- For `high`/`medium` dishes with `blacklistedFound`: shows "Contains:" line.
- For `low` dishes: does NOT show "Contains:" line.
- Expand toggle: clicking reveals `allIngredients` and source note; `aria-expanded` toggles.
- Collapse toggle: clicking again hides the expanded section.

### `useResults.test.ts`
- Returns `{ record: null, loaded: false }` initially.
- On valid sessionStorage data: sets record and `loaded = true`.
- On missing key: calls `router.push('/scan')`.
- On malformed JSON: calls `router.push('/scan')`.
- On missing `dishes` field: calls `router.push('/scan')`.

---

## 9. Constraints & Notes

- The `RiskBadge` hardcodes Tailwind classes rather than using dynamic class interpolation, so Tailwind's tree-shaking picks them up at build time.
- `DishCard` is a pure presentational component — no hooks, no side effects.
- `useResults` is a `'use client'` hook; `ResultsClient` already has `'use client'`.
- The `ScanRecord.timestamp` field name differs from the Epics spec (`createdAt`) — the codebase uses `timestamp`. The spec will follow the codebase convention.
- History save (E6-S5) is already complete — `useAnalyze.ts` calls `addScanRecord` before navigating to `/results`.
