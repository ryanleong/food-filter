## Parent

N/A — part of the desktop navigation epic

## What to build

Restructure `TopBar` to display navigation links on desktop (≥ 1024px) in a three-zone layout: **logo (left) · nav links (center) · account menu (right)**. Nav links are label-only text (no icons), sourced from the shared `NAV_ITEMS` constant (Issue #1). The active link gets a pill highlight using `bg-secondary` / `text-secondary-foreground`. Inactive links use `text-muted-foreground` with a `hover:text-foreground transition-colors`. Nav links are hidden at < 1024px so mobile TopBar is unchanged (logo + account only).

Also add a TopBar test suite covering the desktop nav rendering and active-state behaviour.

## Acceptance criteria

- [ ] At ≥ 1024px, TopBar renders all four nav links (Home, Scan, History, Ingredients) as label-only text, centered between logo and account menu
- [ ] At < 1024px, nav links are not visible in the TopBar (hidden via `lg:flex` / `hidden` pattern)
- [ ] The active nav link (matched via exact/prefix logic) has a pill background (`bg-secondary`) applied
- [ ] The active nav link has `aria-current="page"` set
- [ ] Inactive nav links have no pill background and use muted text color
- [ ] Hover on inactive links transitions to foreground color (`transition-colors`)
- [ ] TopBar height remains `h-14` on both mobile and desktop
- [ ] Account menu (user dropdown) remains in the right zone, unchanged in behaviour
- [ ] TopBar tests: correct link has `aria-current="page"` for each of the four routes
- [ ] TopBar tests: active link has the pill class; inactive links do not
- [ ] TopBar tests: all four nav labels render when a desktop pathname is active

## Blocked by

- Blocked by #1 (shared NAV_ITEMS constant must exist before TopBar imports it)
