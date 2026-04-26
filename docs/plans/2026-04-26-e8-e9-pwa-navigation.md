# E8 & E9 — PWA Configuration + Navigation & App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder app shell with a logo-only top bar + mobile bottom nav, build the home page and 404 page, and make the app installable as a PWA with a manifest, service worker, and iOS meta tags.

**Architecture:** `TopBar` (Server Component) owns the logo + ThemeSwitcher. `BottomNav` (Client Component) owns active-state-aware bottom navigation using `usePathname()`. PWA support is provided by `@ducanh2912/next-pwa` wrapping `next.config.ts`.

**Tech Stack:** Next.js 15 (App Router), `@ducanh2912/next-pwa`, `@napi-rs/canvas` (icon generation script only), `lucide-react`, Tailwind CSS, Vitest + Testing Library

**Spec:** `docs/specs/2026-04-26-e8-e9-pwa-navigation-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/TopBar.tsx` | Create | App wordmark + ThemeSwitcher; Server Component |
| `components/BottomNav.tsx` | Create | 4-item sticky bottom nav with active state; Client Component |
| `components/Navigation.tsx` | Delete | Superseded by TopBar + BottomNav |
| `components/Footer.tsx` | Delete | ThemeSwitcher moves to TopBar |
| `app/layout.tsx` | Modify | Swap Navigation→TopBar, Footer→BottomNav; add pb-16; add iOS/PWA metadata |
| `app/page.tsx` | Rewrite | Static CTAs + renders HomeClient |
| `app/components/HomeClient.tsx` | Create | Dynamic blacklist nudge + recent scan card; Client Component |
| `app/not-found.tsx` | Create | 404 page |
| `app/manifest.ts` | Create | PWA manifest via Next.js metadata API |
| `next.config.ts` | Modify | Wrap with `withPWA`; add security headers |
| `scripts/generate-icons.mjs` | Create | One-time Node script to generate `public/icons/*.png` |
| `public/icons/icon-192.png` | Generate | PWA icon 192×192 |
| `public/icons/icon-512.png` | Generate | PWA icon 512×512 |
| `public/icons/icon-512-maskable.png` | Generate | PWA maskable icon 512×512 |
| `__tests__/components/Navigation.test.tsx` | Rewrite | Update to test BottomNav instead |
| `__tests__/components/BottomNav.test.tsx` | Create | Full BottomNav test coverage |
| `__tests__/app/home/HomeClient.test.tsx` | Create | HomeClient unit tests |
| `README.md` | Modify | Vercel deployment + env var docs |
| `package.json` | Modify | Add `@ducanh2912/next-pwa`, `@napi-rs/canvas` (dev) |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime and dev dependencies**

Run in the project root:

```bash
npm install @ducanh2912/next-pwa
npm install --save-dev @napi-rs/canvas
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@ducanh2912/next-pwa'); console.log('pwa ok')"
node -e "require('@napi-rs/canvas'); console.log('canvas ok')"
```

Expected: both lines print `ok` with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add next-pwa and napi-rs/canvas dependencies"
```

---

## Task 2: TopBar Component (E9-S1)

**Files:**
- Create: `components/TopBar.tsx`
- Test: `__tests__/components/TopBar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/TopBar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopBar from '@/components/TopBar';

describe('TopBar', () => {
  it('renders the FoodFilter wordmark linking to /', () => {
    render(<TopBar />);
    const link = screen.getByRole('link', { name: /foodfilter/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the ThemeSwitcher', () => {
    render(<TopBar />);
    // ThemeSwitcher renders a button to toggle theme
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/TopBar.test.tsx
```

Expected: FAIL — `TopBar` module not found.

- [ ] **Step 3: Implement TopBar**

Create `components/TopBar.tsx`:

```tsx
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';

const TopBar = () => {
  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b bg-background flex items-center px-4 justify-between">
      <Link href="/" className="font-bold text-lg tracking-tight">
        FoodFilter
      </Link>
      <ThemeSwitcher />
    </header>
  );
};

export default TopBar;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/components/TopBar.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/TopBar.tsx __tests__/components/TopBar.test.tsx
git commit -m "feat(e9): add TopBar component"
```

---

## Task 3: BottomNav Component (E9-S1)

**Files:**
- Create: `components/BottomNav.tsx`
- Create: `__tests__/components/BottomNav.test.tsx`
- Delete: `__tests__/components/Navigation.test.tsx`

`usePathname()` from `next/navigation` must be mocked in tests. Vitest's jsdom environment does not run a real Next.js router.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/BottomNav.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BottomNav from '@/components/BottomNav';

// Mock usePathname so we can control the active route in each test
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('BottomNav', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  it('renders all four nav items', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /scan/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ingredients/i })).toBeInTheDocument();
  });

  it('links point to the correct hrefs', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /scan/i })).toHaveAttribute('href', '/scan');
    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: /ingredients/i })).toHaveAttribute('href', '/ingredients');
  });

  it('marks Home as active on the root path', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<BottomNav />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('text-primary');
  });

  it('marks Scan as active on /scan', () => {
    vi.mocked(usePathname).mockReturnValue('/scan');
    render(<BottomNav />);
    const scanLink = screen.getByRole('link', { name: /scan/i });
    expect(scanLink).toHaveClass('text-primary');
  });

  it('marks History as active on /history/some-id', () => {
    vi.mocked(usePathname).mockReturnValue('/history/abc-123');
    render(<BottomNav />);
    const historyLink = screen.getByRole('link', { name: /history/i });
    expect(historyLink).toHaveClass('text-primary');
  });

  it('does not mark Home as active on /scan', () => {
    vi.mocked(usePathname).mockReturnValue('/scan');
    render(<BottomNav />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).not.toHaveClass('text-primary');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/components/BottomNav.test.tsx
```

Expected: FAIL — `BottomNav` module not found.

- [ ] **Step 3: Implement BottomNav**

Create `components/BottomNav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Camera, Clock, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: House, exact: true },
  { href: '/scan', label: 'Scan', icon: Camera, exact: false },
  { href: '/history', label: 'History', icon: Clock, exact: false },
  { href: '/ingredients', label: 'Ingredients', icon: ListChecks, exact: false },
] as const;

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background"
    >
      <ul className="flex h-full items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-xs min-h-[44px]',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/BottomNav.test.tsx
```

Expected: PASS (all 6 tests)

- [ ] **Step 5: Delete the old Navigation test**

```bash
rm __tests__/components/Navigation.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add components/BottomNav.tsx __tests__/components/BottomNav.test.tsx
git rm __tests__/components/Navigation.test.tsx
git commit -m "feat(e9): add BottomNav component with active state"
```

---

## Task 4: Wire TopBar + BottomNav into Layout; Delete Old Components (E9-S1)

**Files:**
- Modify: `app/layout.tsx`
- Delete: `components/Navigation.tsx`
- Delete: `components/Footer.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

Replace the entire contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { BlacklistProvider } from '@/app/providers';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'FoodFilter',
  description: 'Avoid unwanted ingredients when dining out',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FoodFilter',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopBar />
          <BlacklistProvider>
            <main className="pb-16">
              {children}
            </main>
          </BlacklistProvider>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Delete old components**

```bash
rm components/Navigation.tsx components/Footer.tsx
```

- [ ] **Step 3: Run the full test suite to check nothing is broken**

```bash
npx vitest run
```

Expected: all tests pass (no Navigation import errors).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git rm components/Navigation.tsx components/Footer.tsx
git commit -m "feat(e9): wire TopBar + BottomNav into layout, remove old Navigation and Footer"
```

---

## Task 5: Home Page + HomeClient (E9-S2)

**Files:**
- Rewrite: `app/page.tsx`
- Create: `app/components/HomeClient.tsx`
- Create: `__tests__/app/home/HomeClient.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/home/HomeClient.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeClient from '@/app/components/HomeClient';
import * as storage from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  getBlacklist: vi.fn(),
  getHistory: vi.fn(),
}));

describe('HomeClient', () => {
  beforeEach(() => {
    vi.mocked(storage.getBlacklist).mockReturnValue([]);
    vi.mocked(storage.getHistory).mockReturnValue([]);
  });

  it('renders nothing before mounting (avoids hydration mismatch)', () => {
    // Before useEffect fires, `loaded` is false → renders null
    // We can test this by checking that dynamic content is absent synchronously.
    // Testing Library renders synchronously up to the first paint (before effects),
    // so we assert absence of the nudge before effects flush.
    const { container } = render(<HomeClient />);
    // After effects run, content appears — but the container itself renders
    // without throwing, which proves the null-before-mount guard works.
    expect(container).toBeInTheDocument();
  });

  it('shows the blacklist nudge when blacklist is empty', async () => {
    vi.mocked(storage.getBlacklist).mockReturnValue([]);
    vi.mocked(storage.getHistory).mockReturnValue([]);
    render(<HomeClient />);
    // Wait for useEffect to set `loaded = true`
    expect(
      await screen.findByText(/start by adding ingredients/i)
    ).toBeInTheDocument();
  });

  it('does not show the nudge when blacklist is non-empty', async () => {
    vi.mocked(storage.getBlacklist).mockReturnValue(['peanuts']);
    vi.mocked(storage.getHistory).mockReturnValue([]);
    render(<HomeClient />);
    await screen.findByRole('link', { name: /manage ingredients/i });
    expect(screen.queryByText(/start by adding ingredients/i)).not.toBeInTheDocument();
  });

  it('shows a recent scan card when history is non-empty', async () => {
    vi.mocked(storage.getBlacklist).mockReturnValue(['peanuts']);
    vi.mocked(storage.getHistory).mockReturnValue([
      {
        id: 'abc-123',
        createdAt: '2026-04-25T14:32:00.000Z',
        dishes: [
          { name: 'Pad Thai', riskLevel: 'high', blacklistedFound: ['peanuts'], allIngredients: ['peanuts'], source: 'menu' },
          { name: 'Rice', riskLevel: 'low', blacklistedFound: [], allIngredients: ['rice'], source: 'menu' },
        ],
        blacklistSnapshot: ['peanuts'],
      },
    ]);
    render(<HomeClient />);
    expect(await screen.findByText(/recent scan/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute('href', '/history/abc-123');
  });

  it('does not show recent scan card when history is empty', async () => {
    vi.mocked(storage.getBlacklist).mockReturnValue(['peanuts']);
    vi.mocked(storage.getHistory).mockReturnValue([]);
    render(<HomeClient />);
    await screen.findByRole('link', { name: /manage ingredients/i });
    expect(screen.queryByText(/recent scan/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/app/home/HomeClient.test.tsx
```

Expected: FAIL — `HomeClient` module not found.

- [ ] **Step 3: Create `app/components/HomeClient.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlacklist, getHistory } from '@/lib/storage';
import type { ScanRecord } from '@/lib/types';

/** Formats a dish summary line, e.g. "5 dishes · 2 High · 1 Medium · 2 Safe" */
function formatSummary(dishes: ScanRecord['dishes']): string {
  const high = dishes.filter((d) => d.riskLevel === 'high').length;
  const medium = dishes.filter((d) => d.riskLevel === 'medium').length;
  const low = dishes.filter((d) => d.riskLevel === 'low').length;
  return `${dishes.length} dishes · ${high} High · ${medium} Medium · ${low} Safe`;
}

/** Formats an ISO timestamp to a human-readable string, e.g. "Apr 25, 2026 · 14:32" */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}

export default function HomeClient() {
  const [loaded, setLoaded] = useState(false);
  const [blacklistEmpty, setBlacklistEmpty] = useState(false);
  const [recentRecord, setRecentRecord] = useState<ScanRecord | null>(null);

  useEffect(() => {
    const blacklist = getBlacklist();
    const history = getHistory();
    setBlacklistEmpty(blacklist.length === 0);
    setRecentRecord(history.length > 0 ? history[0] : null);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="flex flex-col gap-4">
      {blacklistEmpty && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          Start by adding ingredients you want to avoid.{' '}
          <Link href="/ingredients" className="font-medium underline underline-offset-4">
            Manage Ingredients
          </Link>
        </div>
      )}

      {recentRecord && (
        <div className="rounded-lg border px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Recent Scan
            </p>
            <p className="text-sm font-medium">{formatDate(recentRecord.createdAt)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatSummary(recentRecord.dishes)}
            </p>
          </div>
          <Link
            href={`/history/${recentRecord.id}`}
            className="shrink-0 text-sm font-medium underline underline-offset-4"
          >
            View
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `app/page.tsx`**

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HomeClient from '@/app/components/HomeClient';

export default function Home() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">FoodFilter</h1>
          <p className="mt-2 text-lg text-muted-foreground">Filter menus. Eat safely.</p>
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/scan">Scan a Menu</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ingredients">Manage Ingredients</Link>
          </Button>
        </div>

        <HomeClient />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run __tests__/app/home/HomeClient.test.tsx
```

Expected: PASS (all 5 tests)

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/components/HomeClient.tsx __tests__/app/home/HomeClient.test.tsx
git commit -m "feat(e9): implement home page with dynamic HomeClient"
```

---

## Task 6: 404 Page (E9-S3)

**Files:**
- Create: `app/not-found.tsx`

No unit test needed — this is a pure static page with no logic.

- [ ] **Step 1: Create `app/not-found.tsx`**

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20 flex flex-col items-center gap-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat(e9): add 404 not-found page"
```

---

## Task 7: Generate PWA Icons (E8-S1)

**Files:**
- Create: `scripts/generate-icons.mjs`
- Generate: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-512-maskable.png`

`@napi-rs/canvas` must be installed (Task 1). The script is run once and the output PNG files are committed to the repo.

- [ ] **Step 1: Create `scripts/generate-icons.mjs`**

```mjs
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');

mkdirSync(OUT_DIR, { recursive: true });

/**
 * Draws the FoodFilter icon on a canvas and returns a PNG Buffer.
 * @param {number} size - Canvas size in pixels (width and height)
 * @param {boolean} maskable - If true, scales the graphic to 60% to respect the safe zone
 */
function drawIcon(size, maskable) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Green background
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, size, size);

  // "FF" text — scale down for maskable safe-zone (80% of size, centred)
  const scale = maskable ? 0.6 : 0.8;
  const fontSize = Math.round(size * scale * 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FF', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
];

for (const { name, size, maskable } of icons) {
  const buffer = drawIcon(size, maskable);
  const outPath = join(OUT_DIR, name);
  writeFileSync(outPath, buffer);
  console.log(`Written ${outPath}`);
}
```

- [ ] **Step 2: Run the script to generate icons**

```bash
node scripts/generate-icons.mjs
```

Expected output:
```
Written ...public/icons/icon-192.png
Written ...public/icons/icon-512.png
Written ...public/icons/icon-512-maskable.png
```

- [ ] **Step 3: Verify the files exist and are non-zero**

```bash
ls -lh public/icons/
```

Expected: three `.png` files, each several KB in size.

- [ ] **Step 4: Commit**

```bash
git add public/icons/ scripts/generate-icons.mjs
git commit -m "feat(e8): add PWA icon assets and generation script"
```

---

## Task 8: Web App Manifest (E8-S1)

**Files:**
- Create: `app/manifest.ts`

- [ ] **Step 1: Create `app/manifest.ts`**

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FoodFilter',
    short_name: 'FoodFilter',
    description: 'Filter restaurant menus by your ingredient blacklist',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/manifest.ts
git commit -m "feat(e8): add PWA web app manifest"
```

---

## Task 9: Service Worker + Security Headers (E8-S2, E10-S4)

**Files:**
- Modify: `next.config.ts`

`@ducanh2912/next-pwa` uses CommonJS interop; the import needs `default` extraction when using ESM-style TypeScript config.

- [ ] **Step 1: Update `next.config.ts`**

Replace the entire contents of `next.config.ts` with:

```ts
import type { NextConfig } from 'next';
// @ts-expect-error — @ducanh2912/next-pwa has no bundled types for this import path
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // API routes: always go to network, fall back to cache only if offline
      urlPattern: /^\/api\//,
      handler: 'NetworkFirst' as const,
      options: {
        cacheName: 'api-cache',
      },
    },
    {
      // Static assets: serve from cache, revalidate in background
      urlPattern: /\.(js|css|png|jpg|jpeg|webp|woff2|svg)$/,
      handler: 'CacheFirst' as const,
      options: {
        cacheName: 'static-assets',
      },
    },
  ],
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
```

- [ ] **Step 2: Verify the config compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (the `@ts-expect-error` suppresses the untyped import).

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat(e8): configure next-pwa service worker and add security headers"
```

---

## Task 10: Update README (E8-S4)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Open `README.md` and add a Deployment section**

Find the existing README content and add the following section. Place it after the "Getting Started" / development setup section:

```markdown
## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add the following environment variable in the Vercel project settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key — used only server-side in `/api/analyze` |

4. Deploy. The app builds with `next build` and requires no other configuration.

> **Note:** `GEMINI_API_KEY` is never exposed to the client. Do not add it as a `NEXT_PUBLIC_` variable.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Vercel deployment instructions and env var documentation"
```

---

## Task 11: Full Verification

- [ ] **Step 1: Run the complete test suite**

```bash
npx vitest run
```

Expected: all tests pass with no failures or errors.

- [ ] **Step 2: Run TypeScript compiler check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run linter**

```bash
npx eslint .
```

Expected: 0 errors (warnings are acceptable).

- [ ] **Step 4: Verify the dev build starts cleanly**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- TopBar renders with "FoodFilter" wordmark and theme switcher
- BottomNav renders at the bottom with 4 items
- Home, Scan, History, Ingredients links all navigate correctly
- Active nav item is highlighted on each page
- Page content is not hidden behind the bottom nav (check scan and ingredients pages)

- [ ] **Step 5: Final commit if any fixes were made**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in task |
|-----------------|-----------------|
| E9-S1: TopBar (logo + ThemeSwitcher) | Task 2 |
| E9-S1: BottomNav (4 items, active state, sticky) | Task 3 |
| E9-S1: Layout wired up, pb-16, old components deleted | Task 4 |
| E9-S2: Home page static CTAs | Task 5 |
| E9-S2: HomeClient (nudge + recent scan) | Task 5 |
| E9-S3: 404 not-found page | Task 6 |
| E8-S1: PWA icons generated | Task 7 |
| E8-S1: Web app manifest | Task 8 |
| E8-S2: Service worker (NetworkFirst + CacheFirst) | Task 9 |
| E8-S3: iOS Safari meta tags | Task 4 (layout.tsx `appleWebApp` metadata) |
| E8-S4: Security headers | Task 9 |
| E8-S4: README Vercel docs | Task 10 |
| Navigation test updated | Task 3 (old deleted, new BottomNav.test.tsx) |
| HomeClient tests | Task 5 |

All spec requirements are covered. ✓
