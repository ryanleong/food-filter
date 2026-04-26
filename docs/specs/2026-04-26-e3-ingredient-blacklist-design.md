# E3 — Ingredient Blacklist Design Spec

**Date:** April 26, 2026  
**Epic:** E3 — Ingredient Blacklist  
**Status:** Approved

---

## 1. Overview

This epic adds the `/ingredients` page where users can view, add, and remove blacklisted ingredients. State is managed in a shared React context (backed by a custom hook) so the scan page (E4) can consume the same blacklist without re-reading `localStorage` on every render.

---

## 2. Architecture

### Layer breakdown

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| State logic | `lib/hooks/useBlacklist.ts` | Add/remove/normalize/deduplicate + localStorage sync |
| Shared state | `app/providers.tsx` | `BlacklistProvider` + `useBlacklistContext()` export |
| Layout wiring | `app/layout.tsx` | Wrap `{children}` with `<BlacklistProvider>` |
| Page shell | `app/ingredients/page.tsx` | Route entry, page `<title>`, heading, composition |
| Input component | `components/IngredientInput.tsx` | Controlled input + Add button |
| List component | `components/IngredientList.tsx` | Count badge, alphabetical pills, empty state |
| Pill component | `components/IngredientPill.tsx` | Single ingredient tag with × remove button |

### Why a shared context

The `/scan` page (E4) and the API call (E5) both need the current blacklist. Storing it in context means the scan page calls `useBlacklistContext()` instead of reading from `localStorage` again, keeping a single source of truth in memory while the session is active.

---

## 3. `useBlacklist` Hook — `lib/hooks/useBlacklist.ts`

**Interface:**

```ts
interface UseBlacklistReturn {
  items: string[];
  add: (raw: string) => void;
  remove: (name: string) => void;
}

export function useBlacklist(): UseBlacklistReturn
```

**Behavior:**
- Initializes `items` by calling `getBlacklist()` from `lib/storage.ts` (runs only on mount, safe for SSR because `getBlacklist` guards against `localStorage` unavailability)
- `add(raw)`: trims whitespace, lowercases, silently ignores empty strings and exact duplicates (case-insensitive), appends to state, calls `saveBlacklist`
- `remove(name)`: filters the item out by exact match, calls `saveBlacklist`
- Returns `{ items, add, remove }`

---

## 4. `BlacklistProvider` — `app/providers.tsx`

```ts
export const BlacklistContext = createContext<UseBlacklistReturn | null>(null);

export function BlacklistProvider({ children }: { children: React.ReactNode })

export function useBlacklistContext(): UseBlacklistReturn
```

- `BlacklistProvider` calls `useBlacklist()` and provides the result via `BlacklistContext`
- `useBlacklistContext()` throws a descriptive error if called outside the provider (fail-fast during development)
- Marked `"use client"` because it uses React state

### Wiring in `app/layout.tsx`

```tsx
<BlacklistProvider>
  {children}
</BlacklistProvider>
```

Wraps inside `<ThemeProvider>` so theme is available to all provider children.

---

## 5. `/ingredients` Page — `app/ingredients/page.tsx`

- Sets `metadata.title = "My Ingredients"` via Next.js static metadata export
- Renders an `<h1>` heading: "My Ingredients"
- Renders `<IngredientInput>` above `<IngredientList>`
- Marked `"use client"` — consumes context
- No data fetching; all state comes from `useBlacklistContext()`

---

## 6. `IngredientInput` — `components/IngredientInput.tsx`

- `"use client"` component
- Local `value` state for the controlled `<Input>` (shadcn)
- Submits on:
  - shadcn `<Button>` click ("Add")
  - `Enter` keypress on the input
- After a successful add: clears `value`, re-focuses the input via a `ref`
- Shows no error on duplicate/empty — the hook silently ignores them; the input simply clears

---

## 7. `IngredientList` — `components/IngredientList.tsx`

- `"use client"` component; reads `items` from `useBlacklistContext()`
- Count line: `"{n} ingredient{s}"` rendered as plain text (or with a muted style)
- Items sorted alphabetically before rendering
- Maps each item to `<IngredientPill name={item} onRemove={remove} />`
- **Empty state** (when `items.length === 0`): centered layout with a `UtensilsCrossed` lucide icon and the message "No ingredients yet. Add one above to get started."

---

## 8. `IngredientPill` — `components/IngredientPill.tsx`

- Stateless presentational component
- Props: `{ name: string; onRemove: (name: string) => void }`
- Visual: small rounded tag, muted background (`bg-muted`), border, ingredient name text, `X` lucide icon (14px) as an accessible `<button>` with `aria-label="Remove {name}"`
- Hover: subtle background lift (`hover:bg-muted/80`)
- Fully keyboard-accessible (the × is a real `<button>`, not a `<div>`)

---

## 9. Data Flow

```
localStorage
    │
    ▼
useBlacklist (hook)
    │  items / add / remove
    ▼
BlacklistProvider (context)
    │
    ├──▶ IngredientList → IngredientPill (reads items, calls remove)
    └──▶ IngredientInput (calls add)
         (future: /scan page reads items via useBlacklistContext)
```

---

## 10. Testing

### `__tests__/lib/hooks/useBlacklist.test.ts`

Uses `vitest` + `@testing-library/react` (`renderHook`).

| Test | Description |
|------|-------------|
| Initializes from localStorage | Mocks `getBlacklist` returning `['nuts']`; hook `items` starts as `['nuts']` |
| `add` normalizes input | `add('  Peanuts  ')` → items contains `'peanuts'` |
| `add` deduplicates | Calling `add('peanuts')` twice → only one entry |
| `add` ignores empty | `add('')` and `add('  ')` → no change |
| `add` calls saveBlacklist | `saveBlacklist` is called with updated array |
| `remove` deletes the item | `remove('peanuts')` → items is empty |
| `remove` calls saveBlacklist | `saveBlacklist` is called with filtered array |

### `__tests__/app/ingredients/page.test.tsx`

Uses `vitest` + `@testing-library/react` + `@testing-library/user-event`.

| Test | Description |
|------|-------------|
| Renders empty state | Empty blacklist → empty-state message is visible |
| Adds ingredient via button | Type "peanuts", click Add → pill appears, input clears |
| Adds ingredient via Enter | Type "dairy", press Enter → pill appears |
| Removes ingredient | Render with item present, click ×, pill disappears |
| Shows correct count | 2 items → "2 ingredients" visible |
| Deduplication (UI) | Add "nuts" twice → only one pill |

---

## 11. Accessibility

- All interactive elements are keyboard-reachable
- `IngredientPill` × button has `aria-label="Remove {name}"`
- Risk badges are not color-only (text label always present)
- Color contrast meets WCAG 2.1 AA

---

## 12. Out of Scope for E3

- Navigation links to `/ingredients` (E9)
- Drag-to-reorder ingredients (not in PRD)
- Ingredient import/export
- Max ingredient count enforcement (PRD: no limit for MVP)
