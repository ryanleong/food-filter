## Parent

N/A — root issue for the desktop navigation epic

## What to build

Extract the `NAV_ITEMS` array (route `href`, display `label`, Lucide `icon`, `exact` match flag) from `BottomNav` into a shared constants module (e.g. `lib/nav.ts`). Both `BottomNav` and the upcoming desktop TopBar nav (Issue #3) must import from this single source of truth. No visual or behavioral change.

## Acceptance criteria

- [ ] A shared nav constants module exists and exports the `NAV_ITEMS` array with the four existing items: Home (`/`), Scan (`/scan`), History (`/history`), Ingredients (`/ingredients`)
- [ ] `BottomNav` imports `NAV_ITEMS` from the shared module and renders identically to before
- [ ] All existing `BottomNav` tests continue to pass with no changes
- [ ] The shared module is not a React component — it exports plain data only

## Blocked by

None — can start immediately
