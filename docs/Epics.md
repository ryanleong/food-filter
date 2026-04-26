# FoodFilter PWA — Implementation Epics & User Stories

**Version:** 1.0
**Date:** April 25, 2026
**Source:** PRD v1.0

---

## Epic Index

| # | Epic | Description |
|---|------|-------------|
| E1 | Project Scaffold & Cleanup (Completed) | Remove auth, configure PWA foundation |
| E2 | Core Infrastructure (Completed) | Types, storage helpers, image utility, API proxy |
| E3 | Ingredient Blacklist (Completed) | Manage ingredients UI and persistence |
| E4 | Menu Scanning (Completed) | Camera/upload UI and image submission |
| E5 | AI Analysis (Completed) | Gemini Vision integration and prompt engineering |
| E6 | Results Display (Completed) | Dish cards, risk badges, ingredient breakdown |
| E7 | Scan History | Save, view, and delete past scan results |
| E8 | PWA Configuration | Manifest, service worker, installability |
| E9 | Navigation & Shell | App layout, routing, bottom nav |
| E10 | Quality & Polish | Accessibility, error states, loading states, performance |

---

## E1 — Project Scaffold & Cleanup (Completed)

**Goal:** Transform the Next.js + Supabase auth scaffold into a clean base for FoodFilter with no auth concerns.

**Status:** Completed (April 25, 2026)

---

### E1-S1 — Remove Supabase Authentication (Completed)

**As a developer,** I want all authentication-related code removed so the codebase only contains what FoodFilter needs.

**Acceptance Criteria:**
- Delete the following routes entirely:
  - `app/auth/login/`
  - `app/auth/sign-up/`
  - `app/auth/sign-up-success/`
  - `app/auth/forgot-password/`
  - `app/auth/update-password/`
  - `app/auth/error/`
  - `app/auth/confirm/`
  - `app/protected/`
- Delete the following components:
  - `components/login-form.tsx`
  - `components/sign-up-form.tsx`
  - `components/forgot-password-form.tsx`
  - `components/update-password-form.tsx`
  - `components/auth-button.tsx`
  - `components/logout-button.tsx`
- Delete `components/deploy-button.tsx`, `components/env-var-warning.tsx`, `components/supabase-logo.tsx`, `components/next-logo.tsx`, and `components/tutorial/`
- Remove all Supabase middleware (`middleware.ts` if present)
- Remove `lib/supabase/` directory entirely (client, server, proxy)
- Remove Supabase-related environment variable references from `.env.local.example` / `README.md`
- App builds without errors after cleanup (`next build` passes)

---

### E1-S2 — Update Environment Variable Configuration (Completed)

**As a developer,** I want a clearly documented `.env.local.example` file reflecting only the variables FoodFilter needs.

**Acceptance Criteria:**
- `.env.local.example` contains exactly:
  ```
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- `README.md` updated to reflect setup steps for FoodFilter (remove Supabase setup instructions)
- `GEMINI_API_KEY` is never referenced on the client side (only in server-side API route)

---

### E1-S3 — Clean Up `package.json` Dependencies (Completed)

**As a developer,** I want unused dependencies removed to keep the bundle lean.

**Acceptance Criteria:**
- `@supabase/supabase-js` and `@supabase/ssr` removed from `package.json`
- `npm install` runs without errors
- No import from `@supabase/*` remains in the codebase
- `next build` produces no warnings about removed packages

---

## E2 — Core Infrastructure (Completed)

**Goal:** Establish the shared types, utilities, and server-side proxy that all features depend on.

**Status:** Completed (April 26, 2026)

---

### E2-S1 — Define Shared TypeScript Types

**As a developer,** I want a central `lib/types.ts` file so all modules share consistent data shapes.

**Acceptance Criteria:**
- `lib/types.ts` exports the following interfaces/types:

```ts
// Ingredient blacklist
export type Ingredient = string; // normalized to lowercase, trimmed

// Risk level for a dish
export type RiskLevel = 'high' | 'medium' | 'low';

// Source of ingredient knowledge used for a dish
export type IngredientSource = 'menu' | 'model' | 'both';

// A single dish result returned by Gemini
export interface DishResult {
  name: string;
  riskLevel: RiskLevel;
  blacklistedFound: string[];   // subset of all_ingredients that matched blacklist
  allIngredients: string[];     // full list of identified ingredients
  source: IngredientSource;
}

// A complete scan result stored in history
export interface ScanRecord {
  id: string;           // UUID v4
  createdAt: string;    // ISO 8601
  dishes: DishResult[];
  blacklistSnapshot: string[]; // copy of the blacklist at time of scan
}
```

- No runtime logic in `lib/types.ts` (types only)

---

### E2-S2 — localStorage Helper Module

**As a developer,** I want a `lib/storage.ts` module that abstracts all `localStorage` reads and writes so the rest of the app never touches `localStorage` directly.

**Acceptance Criteria:**
- `lib/storage.ts` exports the following functions:

| Function | Signature | Description |
|----------|-----------|-------------|
| `getBlacklist` | `() => string[]` | Return stored blacklist, or `[]` if empty |
| `saveBlacklist` | `(items: string[]) => void` | Overwrite stored blacklist |
| `getHistory` | `() => ScanRecord[]` | Return stored history array, newest first |
| `addScanRecord` | `(record: ScanRecord) => void` | Prepend record to history |
| `deleteScanRecord` | `(id: string) => void` | Remove record by id |
| `clearHistory` | `() => void` | Remove all history records |

- All functions handle the case where `localStorage` is unavailable (SSR) by returning safe defaults without throwing
- Keys used: `foodfilter_blacklist`, `foodfilter_history`
- Data is serialized as JSON

---

### E2-S3 — Client-Side Image Compression Utility

**As a developer,** I want a `lib/image.ts` utility that compresses and resizes a menu image before it is sent to the API.

**Acceptance Criteria:**
- `lib/image.ts` exports:
  ```ts
  export async function compressImage(file: File, maxSizeKB?: number): Promise<string>
  // Returns base64-encoded JPEG data URL, stripped of the `data:image/...;base64,` prefix
  ```
- Default `maxSizeKB` is `1024` (1 MB)
- Implementation uses the browser `Canvas` API to resize the image if it exceeds the limit
- Preserves aspect ratio when resizing
- Output is always JPEG (quality 0.85) for consistent encoding
- Throws a descriptive `Error` if the file is not an image MIME type

---

### E2-S4 — Gemini API Client (Server-Only)

**As a developer,** I want a `lib/gemini.ts` module that constructs and sends the Gemini 3.1 Flash-lite Vision request.

**Acceptance Criteria:**
- `lib/gemini.ts` exports:
  ```ts
  export async function analyzeMenu(
    base64Image: string,
    blacklist: string[]
  ): Promise<DishResult[]>
  ```
- Uses the `@google/generative-ai` SDK with model `gemini-3.1-flash-lite` (or `fetch` to the REST endpoint — whichever is simpler)
- API key is read from `process.env.GEMINI_API_KEY` — never hardcoded
- Throws a typed error if the API call fails or returns unparseable JSON
- The function is only importable server-side (no `"use client"` directive)

---

### E2-S5 — Server-Side API Route (Gemini Proxy)

**As a developer,** I want a `POST /api/analyze` route that accepts an image and blacklist from the client and returns structured dish results.

**Acceptance Criteria:**
- Route file: `app/api/analyze/route.ts`
- **Request body** (JSON):
  ```json
  {
    "image": "<base64 string>",
    "blacklist": ["ingredient1", "ingredient2"]
  }
  ```
- **Response** (JSON, 200):
  ```json
  {
    "dishes": [ /* DishResult[] */ ]
  }
  ```
- **Error responses:**
  - `400` if `image` or `blacklist` is missing or malformed
  - `500` with `{ "error": "..." }` if Gemini call fails
- `GEMINI_API_KEY` must be present; return `500` with a safe error message if missing
- No image data is logged or persisted on the server
- Request body size limit set to accommodate base64-encoded 1 MB images (~1.4 MB after encoding) — configure `next.config.ts` if needed

---

## E3 — Ingredient Blacklist (Completed)

**Goal:** Let users build and maintain their personal list of ingredients to avoid.

**Status:** Completed (April 26, 2026)

---

### E3-S1 — Blacklist Page & Route

**As a user,** I want a dedicated page at `/ingredients` where I can manage my blacklisted ingredients.

**Acceptance Criteria:**
- Route: `app/ingredients/page.tsx`
- Page is accessible from the main navigation
- Page title: "My Ingredients" (shown in `<title>` and as a page heading)
- On first visit (empty blacklist), shows an empty-state message prompting the user to add ingredients

---

### E3-S2 — Add an Ingredient

**As a user,** I want to type an ingredient name and add it to my blacklist so the AI knows what to look for.

**Acceptance Criteria:**
- Text input field with placeholder: "e.g. peanuts, gluten, dairy…"
- "Add" button (or press Enter) submits the ingredient
- Input is normalized: trimmed whitespace, lowercased before saving
- Duplicate ingredients (case-insensitive) are silently ignored — no duplicate entries
- After adding, the input field is cleared and focused for the next entry
- Ingredient appears immediately in the list below without page reload
- Saved to `localStorage` via `saveBlacklist`

---

### E3-S3 — View Blacklist

**As a user,** I want to see all my blacklisted ingredients listed clearly so I know what is currently being filtered.

**Acceptance Criteria:**
- Ingredients are displayed as a list of pill/tag components, alphabetically sorted
- Each pill shows the ingredient name and a delete (×) button
- Count shown at top (e.g., "3 ingredients")
- List updates reactively — no page reload needed

---

### E3-S4 — Remove an Ingredient

**As a user,** I want to remove an ingredient from my blacklist if I no longer need to avoid it.

**Acceptance Criteria:**
- Clicking the × on an ingredient pill removes it immediately
- `localStorage` is updated via `saveBlacklist`
- If the last ingredient is removed, the empty-state message is shown again

---

## E4 — Menu Scanning (Completed)

**Goal:** Let users submit a menu image from their camera or file system.

**Status:** Completed (April 26, 2026)

---

### E4-S1 — Scan Page & Route

**As a user,** I want a dedicated page at `/scan` where I can submit a menu photo for analysis.

**Acceptance Criteria:**
- Route: `app/scan/page.tsx`
- Page accessible from the main navigation
- Page heading: "Scan a Menu"
- If the user's blacklist is empty, show an inline warning: "Your ingredient list is empty. Add ingredients before scanning." with a link to `/ingredients`

---

### E4-S2 — Camera Capture

**As a mobile user,** I want to use my device camera to take a photo of a menu directly within the app.

**Acceptance Criteria:**
- "Take Photo" button triggers a `<input type="file" accept="image/*" capture="environment">` — uses rear camera by default on mobile
- Once a photo is captured, a preview thumbnail is shown on the page
- User can retake (clear the selection and capture again)

---

### E4-S3 — File Upload

**As a user,** I want to select an existing image from my device gallery or filesystem.

**Acceptance Criteria:**
- "Upload Image" button triggers a `<input type="file" accept="image/*">` (no `capture` attribute)
- Once selected, a preview thumbnail is shown
- User can change their selection before analyzing

---

### E4-S4 — Image Preview & Confirmation

**As a user,** I want to see a preview of the selected image and confirm before analysis is triggered.

**Acceptance Criteria:**
- Preview image displayed at a reasonable size (max height ~300px, maintains aspect ratio)
- "Analyze Menu" button is the only way to trigger the API call (not automatic on selection)
- "Clear" or "Change Image" button lets the user remove the current selection
- If no image is selected and the user taps "Analyze Menu", show a validation error

---

### E4-S5 — Offline Guard

**As a user,** if I am offline when I try to analyze, I want a clear message explaining that connectivity is required.

**Acceptance Criteria:**
- Before calling the API, check `navigator.onLine`
- If offline: display a dismissible alert — "No internet connection. AI analysis requires connectivity."
- The "Analyze Menu" button is disabled (or shows the alert instead of proceeding) when offline
- The blacklist management page remains fully functional offline

---

## E5 — AI Analysis (Completed)

**Goal:** Submit the image and blacklist to Gemini via the server proxy and return structured dish results.

**Status:** Completed (April 26, 2026)

---

### E5-S1 — Gemini 3.1 Flash-lite Prompt Engineering

**As a developer,** I want a well-structured Gemini 3.1 Flash-lite prompt that reliably produces parseable JSON dish results.

**Acceptance Criteria:**
- The prompt passed to Gemini must include:
  1. A system instruction defining the role: food safety assistant analyzing restaurant menus
  2. The user's blacklisted ingredients as an explicit list
  3. The menu image (inline base64, JPEG MIME type)
  4. Clear output format instructions: JSON array, no markdown wrapping, no commentary
- The expected JSON schema per dish:
  ```json
  {
    "name": "string",
    "riskLevel": "high" | "medium" | "low",
    "blacklistedFound": ["string"],
    "allIngredients": ["string"],
    "source": "menu" | "model" | "both"
  }
  ```
- Risk level assignment rules embedded in prompt:
  - `high`: blacklisted ingredient explicitly listed on menu, or model is ≥ 80% confident it is a standard component
  - `medium`: blacklisted ingredient is possibly present based on model knowledge, but unconfirmed
  - `low`: no blacklisted ingredients detected
- If the menu lists ingredients for a dish, the model must use those as the primary source and note `source: "menu"` or `source: "both"`
- If no ingredients are listed on the menu, the model uses its own knowledge and notes `source: "model"`
- Prompt instructs the model to return an empty `blacklistedFound` array and `riskLevel: "low"` when the blacklist is empty

---

### E5-S2 — Handle Gemini Response Parsing

**As a developer,** I want robust JSON parsing so that malformed or partial Gemini responses do not crash the app.

**Acceptance Criteria:**
- Response is parsed with a try/catch around `JSON.parse`
- If parsing fails, the API route returns `500` with `{ "error": "Failed to parse AI response" }`
- If Gemini 3.1 Flash-lite wraps JSON in a markdown code block (` ```json ... ``` `), strip the wrapping before parsing
- Each dish object in the parsed array is validated against expected fields; dishes with missing required fields are filtered out with a console warning (not thrown)
- Empty dishes array (no dishes detected) is a valid response — not treated as an error

---

### E5-S3 — Loading State During Analysis

**As a user,** I want clear visual feedback that analysis is in progress so I know the app is working.

**Acceptance Criteria:**
- While the API call is in flight, show a full-screen or overlay loading state on the scan page
- Loading indicator includes a message: "Analyzing your menu…"
- "Analyze Menu" button is disabled during analysis (prevents duplicate submissions)
- If analysis takes > 15 seconds, show an additional message: "This is taking longer than usual…"
- On error, loading state is dismissed and the error is displayed inline

---

### E5-S4 — API Error Handling

**As a user,** if analysis fails I want a clear error message so I can understand what went wrong and try again.

**Acceptance Criteria:**
- Network errors → "Could not reach the analysis service. Check your connection and try again."
- `500` from API route → "Analysis failed. Please try again."
- `400` from API route → "Invalid request. Please re-select your image and try again."
- Error is shown as an inline alert on the scan page (not a separate error page)
- "Try Again" button resets the error and returns user to the image-ready state (image selection preserved)

---

## E6 — Results Display (Completed)

**Goal:** Present the analysis results as an ordered, readable list of dish cards.

**Status:** Completed (April 26, 2026)

---

### E6-S1 — Results Page & Route (Completed)

**As a user,** I want to be taken to a results page after analysis completes so I can see my menu evaluation.

**Acceptance Criteria:**
- After a successful API response, the user is navigated to `/results` (or results are shown inline on the scan page — TBD at implementation, but a separate route is preferred for shareability of state)
- Results state is passed via React context or `sessionStorage` (not URL query params — too large)
- If the user navigates directly to `/results` with no active result, they are redirected to `/scan`

---

### E6-S2 — Dish Card Component (Completed)

**As a user,** I want each dish shown as a card with its name, risk level, and relevant ingredients clearly displayed.

**Acceptance Criteria:**
- Component: `components/DishCard.tsx`
- Card displays:
  - Dish name (prominent, readable font size)
  - `RiskBadge` component (see E6-S3)
  - If `riskLevel` is `high` or `medium`: a list of `blacklistedFound` ingredients, each highlighted in red/amber
  - An expandable "Show all ingredients" section that reveals `allIngredients`
  - A source note in muted text at the bottom (e.g., "Source: menu text + model knowledge")
- Collapsed by default (only name, badge, blacklisted ingredients visible)
- Expand/collapse toggle is keyboard accessible

---

### E6-S3 — Risk Badge Component (Completed)

**As a user,** I want a color-coded label on each dish card that immediately communicates risk level.

**Acceptance Criteria:**
- Component: `components/RiskBadge.tsx`
- Props: `level: RiskLevel`
- Visual styles:

| Level | Background | Text | Label |
|-------|-----------|------|-------|
| high | Red | White | ⚠ High Risk |
| medium | Amber/Yellow | Dark | ⚡ Medium Risk |
| low | Green | White | ✓ Safe |

- Badge includes both an icon and text (never color-only, for accessibility)
- Uses Tailwind CSS utility classes

---

### E6-S4 — Results Ordering & Summary (Completed)

**As a user,** I want high-risk dishes shown first so the most important information is immediately visible.

**Acceptance Criteria:**
- Dishes are sorted: `high` → `medium` → `low`
- Within each risk group, dishes are shown in the order returned by Gemini (preserves menu order)
- A summary bar at the top of the results page shows:
  - Total number of dishes analyzed
  - Count of High / Medium / Low dishes (e.g., "2 High Risk · 1 Medium Risk · 5 Safe")
- A "Scan Another Menu" button is always visible at the top or bottom

---

### E6-S5 — Save Result to History (Completed)

**As a user,** I want the scan result automatically saved to my history so I can refer back to it later.

**Acceptance Criteria:**
- After a successful analysis, `addScanRecord` is called with a new `ScanRecord`:
  - `id`: generated UUID v4
  - `createdAt`: current ISO timestamp
  - `dishes`: the `DishResult[]` from Gemini
  - `blacklistSnapshot`: the current blacklist at time of scan
- Save happens automatically — user does not need to take any action
- If `localStorage` is full or unavailable, the save fails silently (error logged to console, not shown to user)

---

## E7 — Scan History (Completed)

**Goal:** Let users browse and review their past scan results.

**Status:** Completed (April 26, 2026)

---

### E7-S1 — History Page & Route (Completed)

**As a user,** I want a `/history` page listing all my previous scans so I can refer back to them.

**Acceptance Criteria:**
- Route: `app/history/page.tsx`
- Accessible from main navigation
- Each history entry shows:
  - Date and time of the scan (formatted: e.g., "Apr 25, 2026 · 14:32")
  - Summary: "X dishes · Y High Risk · Z Medium Risk"
  - A "View" button/link to the detail page
  - A delete (×) button for that entry
- Entries ordered newest first
- Empty state shown when history is empty: "No scans yet. Scan a menu to get started."

---

### E7-S2 — History Detail Page (Completed)

**As a user,** I want to tap a history entry and see the full results for that scan.

**Acceptance Criteria:**
- Route: `app/history/[id]/page.tsx`
- Displays the same dish card list as the live results view (reuses `DishCard`, `RiskBadge`)
- Shows the date/time of the original scan at the top
- Shows the blacklist that was active at the time of the scan (`blacklistSnapshot`) in a collapsible section
- "Back to History" link returns to `/history`
- If `id` does not match any record, redirect to `/history`

---

### E7-S3 — Delete History Entry (Completed)

**As a user,** I want to delete individual history entries to manage my storage.

**Acceptance Criteria:**
- Clicking delete on a history entry shows a brief confirmation (inline — "Are you sure?" with Confirm / Cancel) to prevent accidental deletion
- On confirmation, `deleteScanRecord(id)` is called and the entry is removed from the list immediately
- No page reload

---

### E7-S4 — Clear All History (Completed)

**As a user,** I want to clear my entire scan history at once.

**Acceptance Criteria:**
- "Clear All History" button present on the `/history` page (only shown when history is non-empty)
- Clicking shows a modal or dialog: "Clear all scan history? This cannot be undone." with Confirm / Cancel
- On confirmation, `clearHistory()` is called and the empty state is shown
- Uses a shadcn/ui `AlertDialog` component for the confirmation

---

## E8 — PWA Configuration

**Goal:** Make FoodFilter installable as a PWA on mobile and desktop.

---

### E8-S1 — Web App Manifest

**As a user,** I want to install FoodFilter on my home screen so it opens like a native app.

**Acceptance Criteria:**
- `public/manifest.json` (or `app/manifest.ts` using Next.js metadata API) includes:
  ```json
  {
    "name": "FoodFilter",
    "short_name": "FoodFilter",
    "description": "Filter restaurant menus by your ingredient blacklist",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#16a34a",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
      { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```
- Icon files present in `public/icons/`
- Manifest linked in `app/layout.tsx` via Next.js `<link>` or metadata API
- Lighthouse PWA audit: "Installable" ✓

---

### E8-S2 — Service Worker & App Shell Caching

**As a user,** I want the app UI to load instantly even on slow connections because the shell is cached.

**Acceptance Criteria:**
- Service worker registered via `next-pwa` (or equivalent) in `next.config.ts`
- Caches static assets (JS bundles, CSS, fonts, icons) on install
- Cache strategy: **Network First** for API routes (`/api/*`), **Cache First** for static assets
- Service worker does NOT cache API responses (no stale analysis results)
- When offline and user attempts to analyze: network request fails gracefully (see E4-S5)
- Service worker updated on new deployment (versioned cache names or `skipWaiting`)

---

### E8-S3 — iOS Safari PWA Meta Tags

**As an iOS user,** I want FoodFilter to look and behave like a native app when added to my home screen.

**Acceptance Criteria:**
- `app/layout.tsx` includes in `<head>`:
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
  - `<meta name="apple-mobile-web-app-title" content="FoodFilter">`
  - `<link rel="apple-touch-icon" href="/icons/icon-192.png">`
- Status bar does not overlap content on iOS
- Splash screen background matches manifest `background_color`

---

### E8-S4 — Vercel Deployment Configuration

**As a developer,** I want the app deployable to Vercel with a single command.

**Acceptance Criteria:**
- `vercel.json` (if needed) configures any required headers or rewrites
- `GEMINI_API_KEY` documented as a required Vercel environment variable in `README.md`
- `next build` passes with zero errors before deploying
- No Supabase environment variables required for the app to run

---

## E9 — Navigation & App Shell

**Goal:** Provide a consistent, mobile-first navigation shell across all pages.

---

### E9-S1 — Root Layout

**As a user,** I want a consistent app shell (header or bottom navigation) so I can move between sections easily.

**Acceptance Criteria:**
- `app/layout.tsx` wraps all pages with a shared shell
- Shell includes:
  - App name / logo in a top header bar
  - Bottom navigation bar (mobile-first) with 4 items:
    - Home (`/`) — house icon
    - Scan (`/scan`) — camera icon
    - History (`/history`) — clock icon
    - Ingredients (`/ingredients`) — list icon
- Active nav item is visually highlighted
- Bottom nav is sticky (always visible while scrolling)
- Shell does not use any auth-related components

---

### E9-S2 — Home Page

**As a user,** I want a home page that orients me to the app and provides quick-action shortcuts.

**Acceptance Criteria:**
- Route: `app/page.tsx`
- Content:
  - App name + tagline: "Filter menus. Eat safely."
  - Two primary CTA buttons: "Scan a Menu" (→ `/scan`) and "Manage Ingredients" (→ `/ingredients`)
  - If blacklist is empty: inline nudge — "Start by adding ingredients you want to avoid"
  - If history is non-empty: a "Recent Scan" card showing the last scan's summary with a link to its detail
- Reads blacklist count and last history entry from `localStorage` on mount

---

### E9-S3 — 404 Page

**As a user,** if I navigate to an unknown URL I want a helpful not-found page.

**Acceptance Criteria:**
- `app/not-found.tsx` exists
- Shows "Page not found" message
- Includes a "Go Home" link to `/`

---

## E10 — Quality & Polish

**Goal:** Ensure the app is accessible, performant, and resilient across real-world usage.

---

### E10-S1 — Accessibility Audit

**As a user with accessibility needs,** I want the app to be fully usable via keyboard and screen reader.

**Acceptance Criteria:**
- All interactive elements have accessible labels (`aria-label` where icon-only)
- Risk badges use both color and text (never color-only)
- Focus management: after opening an expandable section or modal, focus moves to the new content
- Color contrast meets WCAG 2.1 AA for all text
- `<img>` elements have meaningful `alt` attributes (or `alt=""` for decorative images)
- Lighthouse accessibility score ≥ 90

---

### E10-S2 — Mobile Responsiveness

**As a mobile user,** I want the app to be fully usable on small screens without horizontal scrolling.

**Acceptance Criteria:**
- All pages are responsive from 320px viewport width upwards
- Touch targets are at minimum 44×44px
- Text is readable without zooming (minimum 16px body text)
- No horizontal overflow on any screen tested (320px, 375px, 414px)
- Tested on iOS Safari and Android Chrome (via browser devtools device emulation at minimum)

---

### E10-S3 — Image Compression Validation

**As a developer,** I want to verify that the image compression utility reliably keeps payloads under 1 MB.

**Acceptance Criteria:**
- `compressImage` tested with images of varying sizes (small < 200KB, medium 1–3 MB, large > 5 MB)
- Output is always ≤ 1024 KB
- Aspect ratio is preserved in all cases
- Output is a valid JPEG (can be displayed in an `<img>` tag)

---

### E10-S4 — API Route Security Headers

**As a developer,** I want the API route to include security best practices.

**Acceptance Criteria:**
- `POST /api/analyze` validates that `Content-Type: application/json` is set
- Request body is size-limited (max ~2 MB to accommodate base64 image)
- No CORS headers added (same-origin only — Next.js default)
- Gemini API key is never included in response bodies or error messages
- `next.config.ts` adds security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

### E10-S5 — Empty & Edge-Case States

**As a user,** I want the app to handle edge cases gracefully without crashing or showing blank screens.

**Acceptance Criteria:**
- Gemini returns zero dishes → show message: "No dishes could be identified in this image. Try a clearer photo."
- All dishes are `low` risk → show a positive summary: "Great news — no blacklisted ingredients detected!"
- User's blacklist becomes empty after a scan was saved → history detail still shows `blacklistSnapshot` correctly
- `localStorage` throws (private browsing, quota exceeded) → app degrades gracefully with a banner: "Your data cannot be saved in this browser session."
- Very long ingredient names or dish names wrap correctly in their containers without overflow
