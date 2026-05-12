# Desktop Navigation — PRD

## Problem Statement

The app's navigation currently consists of a `BottomNav` bar fixed to the bottom of the screen, designed for mobile thumb reach. On desktop (screens ≥ 1024px), this pattern is jarring: bottom-fixed bars are a mobile convention, the nav items are far from the natural mouse interaction zone, and the TopBar has significant unused horizontal space. Desktop users expect navigation in the header.

## Solution

On desktop (lg breakpoint, ≥ 1024px), move the four navigation links — Home, Scan, History, Ingredients — into the TopBar. The TopBar restructures into a three-zone layout: **logo (left) · nav links (center) · account menu (right)**. The `BottomNav` is hidden at this breakpoint. On mobile (< 1024px), the layout is unchanged: `TopBar` shows only logo + account, `BottomNav` stays fixed at the bottom.

## User Stories

1. As a desktop user, I want to see navigation links in the top bar, so that I can navigate the app using familiar desktop conventions.
2. As a desktop user, I want navigation links centered in the top bar, so that the layout feels balanced between the logo and account menu.
3. As a desktop user, I want navigation links to show label text only (no icons), so that the horizontal nav bar stays clean and uncluttered.
4. As a desktop user, I want the active navigation link to be highlighted with a pill background, so that I can clearly see which section I am in.
5. As a desktop user, I want the active pill highlight to use the app's muted/secondary color scheme, so that it feels cohesive with the rest of the card-based design system.
6. As a desktop user, I want navigation links to transition colors smoothly on hover, so that interactions feel polished.
7. As a desktop user, I do not want to see the bottom navigation bar, so that I don't have duplicate navigation systems cluttering the screen.
8. As a desktop user, I want the TopBar to remain the same height (h-14 / 56px) as before, so that the header stays compact and doesn't eat into content space.
9. As a mobile user, I want the BottomNav to remain exactly as it is, so that my thumb-friendly navigation is unchanged.
10. As a mobile user, I want the TopBar on mobile to remain logo + account only (no nav links), so that the header doesn't become crowded on small screens.
11. As a user on any device, I want the Scan page to behave identically regardless of screen size, so that I can upload menu photos from both mobile and desktop.
12. As a user switching between breakpoints (e.g., resizing a browser window), I want the navigation to switch seamlessly between modes at the lg breakpoint without layout glitches.
13. As a desktop user, I want the main content area to no longer have bottom padding reserved for the BottomNav, so that no vertical space is wasted at the bottom of the screen.
14. As a keyboard/screen-reader user, I want the correct `aria-current="page"` attribute on the active nav link in both desktop and mobile navigation, so that assistive technology correctly identifies the current page.
15. As a user, I want the navigation item for the current route to be visually distinct in both the desktop TopBar and the mobile BottomNav using the same active-state logic, so that the experience is consistent.

## Implementation Decisions

### Modules modified

- **TopBar component** — Major modification. Restructured into three zones at lg: logo (left), nav links (center), account menu (right). Nav links are label-only at desktop, hidden at mobile. Active state uses a pill (`bg-muted` or `bg-secondary` rounded background) with color transition on hover. The nav item list is the same four items as BottomNav (Home, Scan, History, Ingredients), sharing the same active-state logic (exact match for `/`, prefix match for all others).
- **BottomNav component** — Minor modification. Add `lg:hidden` to the root `<nav>` element so it disappears at desktop breakpoint. No other changes.
- **Root layout (`app/layout.tsx`)** — Minor modification. The `<main>` wrapper currently has `pb-16` to prevent content from being hidden behind the BottomNav. At `lg`, the BottomNav is gone, so the bottom padding should be removed (`lg:pb-0`).

### Active-state logic

Identical to the current BottomNav logic:
- `/` (Home): exact pathname match only
- `/scan`, `/history`, `/ingredients`: `pathname.startsWith(href)`

### Responsive strategy

- Below `lg` (< 1024px): TopBar shows logo + account only. BottomNav is visible.
- At `lg` (≥ 1024px): TopBar shows logo + centered nav + account. BottomNav is hidden.
- CSS-only breakpoint switching using Tailwind's `lg:` prefix — no JavaScript media queries.

### Design tokens used

- Active pill background: `bg-secondary` (violet-100), text: `text-secondary-foreground`
- Inactive link: `text-muted-foreground`, hover: `text-foreground`
- Active link: `text-primary font-semibold`
- Transition: `transition-colors`

## Testing Decisions

**What makes a good test here:** Test external behaviour — what the component renders and how it responds to different `pathname` values. Do not test Tailwind class strings directly or internal state. Prior art: `__tests__/components/BottomNav.test.tsx` (existing active-state and rendering tests).

### Modules to test

- **TopBar** — Test that:
  - Nav links render on desktop (mocked at lg breakpoint or tested via class presence)
  - The correct link has `aria-current="page"` based on pathname
  - The active link has the pill class applied
  - No nav links render in the mobile slot (they carry `lg:flex hidden` classes)
- **BottomNav** — Test that:
  - The `lg:hidden` class is present on the root nav element
  - Existing active-state tests continue to pass (no regression)
- **Root layout** — No unit tests needed; the padding change is a one-line CSS class update.

## Out of Scope

- Sidebar navigation (rejected in design phase)
- Dark mode or theme switching
- Animated sliding pill that physically moves between nav items (decided: color transition only)
- Icon display in the desktop TopBar nav (decided: label-only)
- Changing the max-width or layout of page content on desktop
- Any changes to the Scan page UI or functionality

## Further Notes

- The four nav items (Home, Scan, History, Ingredients) and their routes are the same in both `BottomNav` and the new desktop TopBar. Consider extracting this list to a shared constant to avoid duplication.
- The `lg` breakpoint is 1024px in Tailwind's default config, which covers tablets in landscape but not portrait — intentional, so portrait tablet users get the mobile nav.
- The account dropdown in the TopBar is not moved or changed; it remains in the right zone on both mobile and desktop.
