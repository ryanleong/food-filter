# Design Spec: E8 (PWA Configuration) & E9 (Navigation & App Shell)

**Date:** 2026-04-26
**Epics:** E8, E9
**Status:** Approved

---

## Overview

This spec covers two tightly coupled epics:

- **E9** restructures the app shell — replacing the current top-nav-only layout with a logo-only top bar and a mobile-first bottom navigation bar, and implementing the home page and 404 page.
- **E8** makes FoodFilter installable as a PWA — web app manifest, service worker with per-route caching strategies, and iOS Safari meta tags.

---

## Current State

| Concern | Current |
|---------|---------|
| `components/Navigation.tsx` | Top horizontal bar, text links, no icons, no active state, Server Component |
| `components/Footer.tsx` | Contains only `ThemeSwitcher` |
| `app/layout.tsx` | Renders `<Navigation>` + `<Footer>` |
| `app/page.tsx` | Empty placeholder (`hello`) |
| PWA | No manifest, no service worker, no icons |
| `next.config.ts` | Minimal — only `cacheComponents: true` |

---

## Architecture

### Components

| Component | Type | Replaces / New | Responsibility |
|-----------|------|----------------|----------------|
| `components/TopBar.tsx` | Server Component | Replaces `Navigation.tsx` | App logo/wordmark (links to `/`) + ThemeSwitcher on the right |
| `components/BottomNav.tsx` | Client Component | New | Sticky bottom nav with 4 items; reads `usePathname()` for active state |
| `app/components/HomeClient.tsx` | Client Component | New | Dynamic home page sections (blacklist nudge, recent scan card) |
| `app/manifest.ts` | Next.js metadata | New | PWA manifest via metadata API |
| `app/not-found.tsx` | Server Component | New | 404 page |

### Deleted Files

- `components/Navigation.tsx` — superseded by `TopBar`
- `components/Footer.tsx` — ThemeSwitcher moves to `TopBar`; no footer needed

---

## E9 — Navigation & App Shell

### E9-S1: TopBar Component

**File:** `components/TopBar.tsx`

- Server Component (no `"use client"`)
- Full-width, `h-14`, sticky top, `border-b`
- Left side: `<Link href="/">FoodFilter</Link>` — wordmark only, no icon
- Right side: `<ThemeSwitcher />` (already a Client Component, safe to nest in Server Component)
- Rendered in `app/layout.tsx` replacing `<Navigation />`

### E9-S1: BottomNav Component

**File:** `components/BottomNav.tsx`

- Client Component (`"use client"`)
- Uses `usePathname()` from `next/navigation`
- Fixed at bottom (`fixed bottom-0`), full-width, `h-16`, `border-t`, `z-50`, background matches the app shell
- 4 items evenly spaced:

| Label | Icon (lucide-react) | href | Active match |
|-------|---------------------|------|--------------|
| Home | `House` | `/` | exact `/` |
| Scan | `Camera` | `/scan` | prefix `/scan` |
| History | `Clock` | `/history` | prefix `/history` |
| Ingredients | `ListChecks` | `/ingredients` | prefix `/ingredients` |

- Each item: icon above, short text label below, wrapped in `<Link>`
- Active state: `text-primary` + `font-semibold`; inactive: `text-muted-foreground`
- Touch targets min 44×44px per item

### Layout Changes — `app/layout.tsx`

- Replace `<Navigation />` with `<TopBar />`
- Replace `<Footer />` with `<BottomNav />`
- Add `pb-16` to the body content wrapper so page content does not hide behind the bottom nav
- Add iOS PWA meta tags (see E8-S3)

### E9-S2: Home Page

**`app/page.tsx`** — Server Component shell:

- Static content rendered server-side:
  - App name as a heading (`h1`)
  - Tagline: "Filter menus. Eat safely."
  - Two CTA buttons: "Scan a Menu" (→ `/scan`) and "Manage Ingredients" (→ `/ingredients`)
- Renders `<HomeClient />` below the CTAs for dynamic content

**`app/components/HomeClient.tsx`** — Client Component:

- On mount reads `getBlacklist()` and `getHistory()` from `lib/storage`
- Uses a `loaded` boolean state to avoid hydration flicker (render nothing until mounted)
- If `getBlacklist().length === 0`: show an inline nudge card — "Start by adding ingredients you want to avoid" with a link to `/ingredients`
- If `getHistory().length > 0`: show a "Recent Scan" card with:
  - Formatted date (`createdAt` of `records[0]`)
  - Dish summary: "X dishes · Y High · Z Medium · W Safe"
  - Link to `/history/[id]` for that record
- Both sections are mutually independent (nudge can show alongside recent scan if blacklist is later cleared)

### E9-S3: 404 Page

**`app/not-found.tsx`**:

- "Page not found" `h1` heading
- Short explanatory message
- "Go Home" button/link → `/`

---

## E8 — PWA Configuration

### E8-S1: Web App Manifest

**`app/manifest.ts`** — uses Next.js `MetadataRoute.Manifest`:

```ts
{
  name: "FoodFilter",
  short_name: "FoodFilter",
  description: "Filter restaurant menus by your ingredient blacklist",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#16a34a",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}
```

### Icon Assets

**`public/icons/`** — Three PNG files generated by a one-time script (`scripts/generate-icons.mjs`):

- Uses Node's built-in `canvas` support via `@napi-rs/canvas` (dev dependency)
- Style: green background (`#16a34a`), white "FF" text centered, rounded corners for maskable variant
- Files committed to repo so no build-time generation is required
- Script is not part of the production build

Files:
- `public/icons/icon-192.png` — 192×192
- `public/icons/icon-512.png` — 512×512
- `public/icons/icon-512-maskable.png` — 512×512 with 20% safe-zone padding around the graphic

### E8-S2: Service Worker

Install `@ducanh2912/next-pwa`.

**`next.config.ts`** updated:

```ts
import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^\/api\//,
      handler: "NetworkFirst",
      options: { cacheName: "api-cache" },
    },
    {
      urlPattern: /\.(js|css|png|jpg|jpeg|webp|woff2|svg)$/,
      handler: "CacheFirst",
      options: { cacheName: "static-assets" },
    },
  ],
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  // security headers added here
};

export default pwaConfig(nextConfig);
```

Caching behaviour:
- **`/api/*`** → `NetworkFirst`: always tries the network; only falls back to cache if offline. Offline analysis fails gracefully (per E4-S5 existing behaviour).
- **Static assets** → `CacheFirst`: served from cache instantly; fetched and updated in background.
- API responses are **never cached** (NetworkFirst falls back to cache miss, not stale content).
- Service worker is disabled in development to avoid interference with hot reload.

### E8-S3: iOS Safari Meta Tags

Added to `app/layout.tsx` via Next.js `metadata` export:

```ts
export const metadata: Metadata = {
  // ...existing fields...
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodFilter",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};
```

### E8-S4: Security Headers + Vercel Docs

Security headers added to `next.config.ts` via `headers()`:

```ts
headers: async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ],
  },
],
```

`README.md` updated:
- Document `GEMINI_API_KEY` as required Vercel environment variable
- Add deployment steps for Vercel (import repo, set env var, deploy)

---

## Data Flow — Home Page

```
app/page.tsx (Server)
  └─ renders static CTAs + <HomeClient />
       └─ HomeClient (Client, mounted)
            ├─ getBlacklist() → localStorage → nudge if empty
            └─ getHistory()  → localStorage → recent scan card if non-empty
```

No prop drilling needed — `HomeClient` reads storage directly, consistent with the existing pattern used in `HistoryClient` and `IngredientsPage`.

---

## File Change Summary

| File | Action |
|------|--------|
| `components/TopBar.tsx` | **Create** |
| `components/BottomNav.tsx` | **Create** |
| `app/components/HomeClient.tsx` | **Create** |
| `app/not-found.tsx` | **Create** |
| `app/manifest.ts` | **Create** |
| `scripts/generate-icons.mjs` | **Create** (dev only, one-time) |
| `public/icons/icon-192.png` | **Generate** |
| `public/icons/icon-512.png` | **Generate** |
| `public/icons/icon-512-maskable.png` | **Generate** |
| `app/page.tsx` | **Rewrite** |
| `app/layout.tsx` | **Update** (swap components, add iOS metadata, add `pb-16`) |
| `next.config.ts` | **Update** (withPWA wrapper + security headers) |
| `README.md` | **Update** (Vercel deployment + env vars) |
| `components/Navigation.tsx` | **Delete** |
| `components/Footer.tsx` | **Delete** |
| `package.json` | **Update** (add `@ducanh2912/next-pwa`, `@napi-rs/canvas` dev dep) |

---

## Test Coverage

Existing tests for `Navigation` (`__tests__/components/Navigation.test.tsx`) must be updated to test `BottomNav` instead:

- Active state reflects current pathname
- All 4 nav items render with correct labels and hrefs
- `TopBar` renders logo linking to `/`

New tests:
- `HomeClient` — renders nudge when blacklist empty, renders recent scan card when history non-empty, renders nothing while not mounted

No new tests needed for manifest or service worker (integration concern, not unit testable).
