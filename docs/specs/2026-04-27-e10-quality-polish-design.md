# E10 — Quality & Polish: Design Spec

**Date:** April 27, 2026
**Epic:** E10 — Quality & Polish
**Status:** Draft

---

## Overview

E10 addresses the remaining accessibility, responsiveness, security, and edge-case resilience gaps across the FoodFilter codebase. The app already has strong foundations in all five areas; this epic closes the measurable gaps without introducing new features or large-scale refactoring.

---

## E10-S1 — Accessibility Fixes

### What needs to change

**Touch target size (`IngredientPill`):**
The remove button renders visually at ~14×14px. WCAG 2.1 SC 2.5.5 and mobile best-practice require a minimum 44×44px interactive target. The fix is to add `p-2.5` (or equivalent) to the button's Tailwind classes, which expands the clickable area without changing the visual pill size.

**No other gaps found:** All other interactive elements already have `aria-label` (icon-only buttons), `aria-current` (nav), `aria-live` (status region), `aria-expanded`/`aria-controls` (DishCard expand), `role="alert"` (error messages), and the RiskBadge uses both color and text.

### Files changed
- `components/IngredientPill.tsx` — add `p-2.5` to the remove button's `className`

---

## E10-S2 — Long Text Overflow (Mobile Responsiveness)

All pages are already responsive with standard Tailwind containers. The only missing pieces are overflow guards for user-controlled strings (dish names, ingredient names) that could be arbitrarily long.

### What needs to change

**`DishCard`:** Add `break-words` to the `CardTitle` element (dish name) and to the ingredient list paragraph (`text-sm text-muted-foreground`).

**`IngredientPill`:** Add `break-all` to the ingredient name `<span>` inside the pill so very long strings wrap inside the pill rather than pushing it off-screen.

### Files changed
- `components/DishCard.tsx` — `break-words` on title and ingredient text
- `components/IngredientPill.tsx` — `break-all` on name span

---

## E10-S3 — Image Compression: Aspect Ratio Test

The existing `__tests__/lib/image.test.ts` covers: wrong MIME type, JPEG output, single-pass encoding, multi-pass re-encoding, and the floor-stop condition. The missing case is explicit aspect-ratio preservation.

### New test case

Test name: `"preserves aspect ratio when resizing"`

Setup: Mock `Image` with `naturalWidth = 400, naturalHeight = 200` (2:1 ratio). Capture the `drawImage` call arguments and assert that the rendered `width / height` ratio remains `2`.

The test verifies that the 0.9× shrink loop passes the *same proportional dimensions* to `drawImage` on every iteration, not a fixed size.

### Files changed
- `__tests__/lib/image.test.ts` — one new `it(...)` block

---

## E10-S4 — API Route: Content-Type Validation

The `POST /api/analyze` route accepts `multipart/form-data`. An explicit `Content-Type` header check makes the contract clear and prevents unexpected request shapes from reaching FormData parsing.

### What to add

At the very top of the `POST` handler, before `request.formData()`:

```ts
const contentType = request.headers.get('content-type') ?? '';
if (!contentType.includes('multipart/form-data')) {
  return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 });
}
```

Returns HTTP **415 Unsupported Media Type** (the semantically correct status) if the header is absent or wrong.

All other security requirements from E10-S4 are already satisfied:
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) are in `next.config.ts`
- API key is never included in response bodies
- No CORS headers (Next.js same-origin default)
- Body size limit enforced via `MAX_IMAGE_BYTES = 10 MB` guard in route.ts

### Files changed
- `app/api/analyze/route.ts` — add Content-Type check at top of POST handler

---

## E10-S5 — Edge Cases: localStorage Banner & Long-Text Overflow

### localStorage unavailable banner

**New component:** `components/StorageBanner.tsx`

Responsibilities:
- On mount: calls `isStorageAvailable()` (to be exported from `lib/storage.ts`) to check baseline availability
- Also subscribes to a custom `"foodfilter:storage-error"` DOM event dispatched on `window` when any storage write fails (quota exceeded, private browsing restrictions, etc.)
- If either condition is true: renders a dismissible amber banner with text: `"Your data cannot be saved in this browser session."`
- Dismiss button with `aria-label="Dismiss storage warning"` and an × icon
- The banner is rendered once at the top of the main content area; it does not fix-position over the navigation

**Integration:** Added inside `<BlacklistProvider>` in `app/layout.tsx`, above `{children}`.

**`lib/storage.ts` changes:**
1. Export `isStorageAvailable` (currently unexported private).
2. In each `catch` block inside write functions (`saveBlacklist`, `addScanRecord`, `deleteScanRecord`, `clearHistory`): dispatch `new CustomEvent('foodfilter:storage-error')` on `window` after the `console.warn`. This signals the banner without coupling storage.ts to React.

### Long text overflow (same files as E10-S2 above)

Already covered in the E10-S2 section.

### Files changed
- `lib/storage.ts` — export `isStorageAvailable`
- `components/StorageBanner.tsx` — new component
- `app/layout.tsx` — add `<StorageBanner />` inside `<BlacklistProvider>`

---

## Architecture Summary

| Story | Files Changed | New Files |
|-------|--------------|-----------|
| E10-S1 | `components/IngredientPill.tsx` | — |
| E10-S2 | `components/DishCard.tsx`, `components/IngredientPill.tsx` | — |
| E10-S3 | `__tests__/lib/image.test.ts` | — |
| E10-S4 | `app/api/analyze/route.ts` | — |
| E10-S5 | `lib/storage.ts`, `app/layout.tsx` | `components/StorageBanner.tsx` |

No new dependencies required. All changes are surgical and isolated.

---

## Out of Scope

- Full Lighthouse audit run (manual verification step, not code)
- Automated WCAG contrast scanning (existing color choices already verified to pass AA)
- Focus management on DishCard expand/collapse (decision: skip — toggle button stays in context)
- E10-S2 testing via device emulation (manual QA step)
