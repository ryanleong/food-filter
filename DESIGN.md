# FoodFilter — Design System

> **Direction: Mediterranean Bistro**
> Warm cream + deep grape. Fraunces serif headings, Outfit sans body. Rounded, inviting, clean.

---

## Color Palette

All colors are defined as CSS variables in `app/globals.css` and consumed via Tailwind utilities.

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Background | `--background` | `#FAF6F0` (warm cream) | Page background |
| Foreground | `--foreground` | `#1C1917` (warm near-black) | Body text |
| Card | `--card` | `#FFFFFF` (white) | Card surfaces, TopBar, BottomNav |
| Card Foreground | `--card-foreground` | `#1C1917` | Text on cards |
| Border | `--border` | `#E5D5C5` (warm beige) | All borders |
| Primary | `--primary` | `#7C3AED` (deep grape) | CTAs, active nav, links, brand |
| Primary Foreground | `--primary-foreground` | `#FFFFFF` | Text on primary buttons |
| Secondary | `--secondary` | `#EDE9FE` (violet-100) | Stat cards, ingredient pills bg |
| Secondary Foreground | `--secondary-foreground` | `#6D28D9` | Text on secondary surfaces |
| Muted | `--muted` | `#F0E8DC` (warm muted cream) | Subtle backgrounds, hover states |
| Muted Foreground | `--muted-foreground` | `#7A6A5A` (warm gray-brown) | Secondary text, labels, captions |
| Destructive | `--destructive` | `#DC2626` (red-600) | Delete actions, error states |
| Destructive Foreground | `--destructive-foreground` | `#FFFFFF` | Text on destructive buttons |
| Ring | `--ring` | `#7C3AED` | Focus rings |

**Never use hardcoded hex values.** Always use Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.) which map to the CSS variables above.

---

## Typography

### Fonts

Two fonts are loaded via `next/font/google` in `app/layout.tsx`:

| Font | Variable | CSS Class | Role |
|---|---|---|---|
| **Fraunces** | `--font-fraunces` | `font-display` | Headings (h1–h4), brand logo, card titles, dates |
| **Outfit** | `--font-outfit` | `font-sans` | All body text, labels, buttons, captions |

`globals.css` sets `font-family` on `body` to Outfit and on `h1–h4` to Fraunces automatically.

### Scale

| Use | Classes |
|---|---|
| Page title (h1) | `font-display text-3xl font-semibold` |
| Section heading (h2) | `font-display text-2xl font-semibold` |
| Card title / dish name | `font-display text-base font-semibold` |
| Brand logo (TopBar) | `font-display text-xl font-semibold text-primary` |
| Hero headline (Dashboard) | `font-display text-4xl sm:text-5xl font-semibold text-primary` |
| Body text | `text-sm text-foreground` |
| Secondary / caption text | `text-xs text-muted-foreground` |
| Label (form) | `text-sm font-medium text-foreground` |

---

## Spacing & Layout

- **Max content width:** `max-w-2xl mx-auto` on all page wrappers
- **Page padding:** `px-4 py-8`
- **Card internal padding:** `p-4` (compact) or `p-5` / `p-6` (spacious)
- **Gap between sections:** `gap-6` or `gap-8`
- **Border radius:** `rounded-xl` (standard cards, inputs, buttons) · `rounded-2xl` (dialogs, large cards) · `rounded-full` (pills, badges)
- **Shadows:** `shadow-sm` on cards — no heavy shadows

---

## Components

### Buttons

There are **no shadcn Button components**. Use plain `<button>` or `<Link>` with Tailwind classes.

#### Primary button
```tsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  Label
</button>
```

#### Full-width primary (forms / CTAs)
```tsx
<button className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
  Label
</button>
```

#### Outline / secondary button
```tsx
<button className="px-4 py-2 border border-border bg-card text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
  Label
</button>
```

#### Ghost / text button
```tsx
<button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
  Label
</button>
```

#### Destructive button
```tsx
<button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">
  Label
</button>
```

#### Small button (in lists)
```tsx
<Link href="..." className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
  View
</Link>
```

### Form Inputs

No shadcn Input/Label. Use plain HTML:

```tsx
<label htmlFor="..." className="text-sm font-medium text-foreground">Label</label>
<input
  className="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
/>
```

### Cards

```tsx
<div className="bg-card rounded-xl border border-border shadow-sm p-4">
  {/* content */}
</div>
```

For cards with a colored left border (DishCard risk indicator):
```tsx
<div className="bg-card rounded-xl border border-border border-l-4 border-l-red-500 shadow-sm p-4">
```

### Modals / Dialogs

Use `ConfirmDialog` from `@/components/ConfirmDialog` — a custom native dialog (no Radix).

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Are you sure?"
  description="This cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  destructive
  onConfirm={handleConfirm}
/>
```

### Ingredient Pills

```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-sm font-medium">
  peanuts
  <button aria-label="Remove peanuts" className="..."><X size={13} /></button>
</span>
```

### Risk Badges (DishCard)

| Level | Classes |
|---|---|
| High Risk | `bg-red-100 text-red-700 ring-1 ring-red-200` |
| Medium Risk | `bg-amber-100 text-amber-700 ring-1 ring-amber-200` |
| Safe | `bg-green-100 text-green-700 ring-1 ring-green-200` |

Applied as: `rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0`

DishCard also uses a colored `border-l-4` to reinforce risk level:
- High → `border-l-red-500`
- Medium → `border-l-amber-500`
- Safe → `border-l-green-500`

### Alert / Warning Banners

```tsx
{/* Warning (amber) */}
<div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
  <p>Message here.</p>
</div>

{/* Error (red) */}
<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
  Error message
</div>

{/* Success (green) */}
<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
  <p className="text-sm font-semibold text-green-700">Success message</p>
</div>
```

### Empty States

Use a Lucide icon + short message, centered:
```tsx
<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
  <RelevantIcon size={36} strokeWidth={1.5} />
  <p className="text-sm">Descriptive message here.</p>
</div>
```

### Scan Viewfinder

The scan page uses a camera viewfinder with corner bracket decorators:
```tsx
<div className="relative flex min-h-56 items-center justify-center rounded-xl bg-muted/50 border border-border border-dashed">
  <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-sm" />
  <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-sm" />
  <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-sm" />
  <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-sm" />
  {/* center content */}
</div>
```

---

## Navigation

### Nav items source of truth

All navigation routes live in `lib/nav.ts` as `NAV_ITEMS`. Both `TopBar` (desktop) and `BottomNav` (mobile) import from this shared constant. **Never duplicate the nav item list** — always import from `@/lib/nav`.

### TopBar
- `sticky top-0 z-50 h-14 border-b border-border bg-card`
- Layout: `grid grid-cols-3 items-center px-4` — three zones: logo (left), nav (center), account (right)
- Brand logo: `font-display text-xl font-semibold text-primary`
- Account: custom dropdown (no Radix) — user icon + email truncated + ChevronDown

**Desktop nav links** (`hidden lg:flex` — visible at ≥ 1024px only):
- Label-only text, no icons
- Wrapper: `hidden lg:flex items-center justify-center gap-1`
- Each link: `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors`
- Active: `bg-secondary text-secondary-foreground font-semibold` + `aria-current="page"`
- Inactive: `text-muted-foreground hover:text-foreground`
- Active-state logic: exact match for `/` (Home); `pathname.startsWith(href)` for all others

### BottomNav
- `fixed bottom-0 h-16 border-t border-border bg-card z-50 lg:hidden`
- Visible on mobile only (hidden at ≥ 1024px via `lg:hidden`)
- 4 items: Home, Scan, History, Ingredients — icons + labels, stacked
- Active: `text-primary font-semibold`
- Inactive: `text-muted-foreground hover:text-foreground`
- Active-state logic: same as desktop (exact for `/`, prefix for others)

---

## What NOT To Do

- ❌ Do not import from `@/components/ui/*` — shadcn has been removed entirely
- ❌ Do not use `next-themes` or `ThemeProvider` — fixed single theme, no dark mode
- ❌ Do not use `suppressHydrationWarning` on `<html>` — not needed without theme switching
- ❌ Do not use Inter, Roboto, or system-ui as primary fonts — use Fraunces / Outfit
- ❌ Do not hardcode hex colors — use CSS variable tokens via Tailwind utilities
- ❌ Do not use `darkMode` variants (`.dark:`) — single fixed theme
- ❌ Do not use `rounded-lg` for cards — use `rounded-xl` (matches the `--radius: 0.75rem` variable)
- ❌ Do not add heavy drop shadows — keep `shadow-sm` or none

---

## Dependency Notes

The following packages were used by shadcn and are now unused. They can be removed from `package.json` when convenient:
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `next-themes`
