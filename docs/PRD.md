# Product Requirements Document — FoodFilter PWA

**Version:** 1.0
**Date:** April 25, 2026
**Status:** Draft

---

## 1. Overview

FoodFilter is a Progressive Web App (PWA) that helps users avoid unwanted food ingredients when dining out. Users maintain a personal blacklist of ingredients they want to avoid. They can photograph a restaurant menu, and the app uses Google Gemini Vision AI to identify which dishes likely contain blacklisted ingredients — along with a probability rating and a breakdown of other detected ingredients.

---

## 2. Goals & Non-Goals

### Goals
- Let users define and manage a custom list of blacklisted ingredients (stored locally)
- Allow users to scan a menu photo via camera or file upload
- Use Gemini Vision to extract dishes from the photo and assess each dish against the blacklist
- Display per-dish results: risk level (High / Medium / Low) and detected ingredient breakdown
- Save scan results (without images) locally for later reference
- Fully installable as a PWA on mobile and desktop

### Non-Goals (MVP)
- No user authentication or accounts
- No backend storage — everything stays in the browser
- No support for non-English menus (future)
- No dietary preset profiles (future)
- No image stored in scan history
- No offline AI analysis (requires connectivity)

---

## 3. Users & Use Cases

### Primary User
A diner (allergy sufferer, dietary-restricted individual, or preference-driven eater) who wants to quickly identify safe vs. risky dishes from a physical or digital menu.

### Core Use Cases

| # | Use Case | Description |
|---|----------|-------------|
| UC-1 | Manage blacklist | Add, remove, and view blacklisted ingredients |
| UC-2 | Scan a menu | Capture or upload a menu photo for AI analysis |
| UC-3 | View analysis results | See all extracted dishes and their risk levels |
| UC-4 | Review scan history | Browse previous scan results (no images) |
| UC-5 | Use offline | Manage ingredient blacklist without connectivity |

---

## 4. Functional Requirements

### 4.1 Ingredient Blacklist Management

- Users can type ingredient names and add them to their blacklist
- Users can delete individual ingredients from the blacklist
- Blacklist is persisted in **browser `localStorage`** — no backend, no account required
- No limit imposed on the number of blacklisted ingredients (MVP)
- Offline-capable: ingredient management works without a network connection

### 4.2 Menu Scanning

- Users can submit a menu image via:
  - **Camera capture** — triggers native device camera (primary mobile UX)
  - **File upload** — select an image from the device gallery or filesystem
- Image is sent to the **Google Gemini Vision API** for analysis
- The image is **not** stored anywhere (client or server)
- The app must communicate clearly when network is unavailable (analysis blocked)

### 4.3 AI Analysis

The Gemini Vision model must:

1. **Extract all dishes** visible in the submitted menu photo
2. For each dish, **identify its ingredients** using:
   - Ingredients listed on the menu (if present) — primary source
   - The model's own knowledge of the dish — always used as a supplement
3. **Compare identified ingredients against the user's blacklist**
4. Assign a **risk level** per dish:

| Risk Level | Meaning |
|------------|---------|
| 🔴 High | One or more blacklisted ingredients are stated explicitly on the menu, or the model is highly confident they are present based on the dish's typical composition |
| 🟡 Medium | Blacklisted ingredient is plausibly present based on model knowledge, but not confirmed by menu text |
| 🟢 Low / None | No blacklisted ingredients detected; dish is likely safe |

5. Return a structured list including, per dish:
   - Dish name
   - Risk level
   - Detected blacklisted ingredients (if any)
   - Full list of identified ingredients (blacklisted and non-blacklisted)
   - Source note: whether ingredients came from menu text, model knowledge, or both

### 4.4 Results Display

- Results are displayed as a **scrollable list of dish cards**
- Each card shows:
  - Dish name
  - Risk level badge (color-coded: red / yellow / green)
  - Blacklisted ingredients highlighted (if any)
  - Collapsible / expandable section showing all identified ingredients
  - Source note (e.g., "Based on menu text + model knowledge")
- Results are ordered: High risk → Medium risk → Low/None risk
- User can re-scan (submit another photo) without losing the current result until they navigate away

### 4.5 Scan History

- After a successful scan, the result (dish list + risk levels + ingredients, **no image**) is saved to `localStorage`
- A history screen shows past scans, listed by date and time
- Users can tap a past scan to view the full result
- Users can delete individual history entries or clear all history
- History is local only — cleared if the user clears browser storage

---

## 5. Non-Functional Requirements

### 5.1 PWA

- Installable on iOS (Safari) and Android (Chrome) home screens
- `manifest.json` with app name, icons, theme color, and `display: standalone`
- Service worker for static asset caching (app shell)
- AI analysis gracefully fails with a clear message when offline

### 5.2 Performance

- Menu photo must be compressed/resized client-side before API submission to reduce latency and API cost (target: ≤ 1 MB)
- Analysis response must be shown within a loading state (spinner / progress indicator)
- No full-page reloads for any user action

### 5.3 Security

- Gemini API key is stored server-side only (Next.js API route acts as a proxy)
- The client never receives or stores the API key
- No user PII is collected or transmitted

### 5.4 Accessibility

- WCAG 2.1 AA compliance for color contrast, ARIA roles, and keyboard navigation
- Risk badges are not color-only — include text labels

### 5.5 Browser Support

- Modern evergreen browsers (Chrome, Safari, Firefox, Edge)
- Primary target: mobile Chrome (Android) and mobile Safari (iOS)

---

## 6. Technical Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Google Gemini Vision API (via server-side API route) |
| Storage | Browser `localStorage` |
| PWA | `next-pwa` or custom service worker |
| Hosting | TBD (Vercel recommended) |

### Key Modules

```
app/
  page.tsx                  — Home / entry point
  scan/page.tsx             — Camera/upload + analysis trigger
  results/page.tsx          — Scan results display
  history/page.tsx          — Past scan results
  ingredients/page.tsx      — Blacklist management

app/api/
  analyze/route.ts          — Server-side Gemini Vision proxy

lib/
  gemini.ts                 — Gemini API client (server-only)
  storage.ts                — localStorage helpers (blacklist + history)
  image.ts                  — Client-side image compression utility
  types.ts                  — Shared TypeScript types

components/
  DishCard.tsx              — Per-dish result card
  RiskBadge.tsx             — Color-coded risk level badge
  IngredientList.tsx        — Expandable ingredient breakdown
  ScanInput.tsx             — Camera/upload UI
  BlacklistManager.tsx      — Add/remove ingredient UI
```

### Auth Removal
All Supabase authentication routes, components, and middleware will be removed. Only the Supabase client setup may be retained if future data features are planned; otherwise it will be removed entirely.

---

## 7. Gemini Prompt Design (Outline)

The API route will send a structured system + user prompt to Gemini:

- **System context:** Explain it is a food safety assistant; define the output format (JSON)
- **User message:** Include the base64-encoded menu image + the user's blacklist of ingredients
- **Expected output:** JSON array of dish objects (name, risk_level, blacklisted_found[], all_ingredients[], source)
- **Instructions:** Use menu text as primary source; supplement with knowledge for unlisted dishes or ambiguous ingredients; assign risk level per defined rules

---

## 8. Screens & Navigation

```
Home (/)
  → Ingredients (/ingredients)    — Manage blacklist
  → Scan (/scan)                  — Submit menu photo
      → Results (/results)        — View analysis
  → History (/history)            — Past scans
      → Result detail (/history/[id])
```

---

## 9. Out of Scope (Future Considerations)

- Multi-language menu support
- Dietary preset profiles (vegan, gluten-free, etc.)
- Sharing scan results
- Barcode / packaged food scanning
- User accounts and cloud sync
- Restaurant database integration
- Nutritional information display

---

## 10. Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Gemini response accuracy (manual QA sample) | ≥ 85% correctly identified risky dishes |
| Time-to-result from photo submission | ≤ 10 seconds (p90) |
| PWA installability | Passes Lighthouse PWA audit |
| Mobile usability | Lighthouse mobile score ≥ 80 |
