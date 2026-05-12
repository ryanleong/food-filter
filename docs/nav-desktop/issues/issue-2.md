## Parent

N/A — part of the desktop navigation epic

## What to build

Hide the `BottomNav` on desktop and remove the bottom padding from the main content area that was reserved for it. At the `lg` breakpoint (≥ 1024px), the BottomNav should be invisible and the page content should extend to the natural bottom of the viewport.

Also update the BottomNav test suite to assert the `lg:hidden` class is present on the root nav element, and confirm no regressions on the existing active-state and rendering tests.

## Acceptance criteria

- [ ] `BottomNav` root `<nav>` has `lg:hidden` so it is hidden at ≥ 1024px
- [ ] `BottomNav` is fully visible and unchanged at < 1024px
- [ ] The `<main>` wrapper in the root layout has `pb-16 lg:pb-0` so bottom padding is removed on desktop
- [ ] Existing BottomNav tests (active state, `aria-current`, link rendering) all pass
- [ ] A new BottomNav test asserts the `lg:hidden` class is present on the root nav

## Blocked by

None — can start immediately
