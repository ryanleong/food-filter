# E2 — Core Infrastructure Design

**Date:** April 25, 2026
**Epic:** E2 from `docs/Epics.md`
**Status:** Approved

---

## 1. Scope

This spec covers the five modules that all other FoodFilter features depend on:

| File | Role | Runs on |
|------|------|---------|
| `lib/types.ts` | Shared TypeScript interfaces | Both (type-only) |
| `lib/storage.ts` | `localStorage` read/write helpers | Client (SSR-safe) |
| `lib/image.ts` | Client-side image compression | Client only |
| `lib/gemini.ts` | Gemini 3.1 Flash-lite API client | Server only |
| `app/api/analyze/route.ts` | POST endpoint (Gemini proxy) | Server only |

No UI is built in this epic.

---

## 2. Architecture

```
[Browser]
  lib/image.ts          — compresses File → Blob (Canvas API, JPEG @ 0.85)
  lib/storage.ts        — localStorage R/W (SSR-safe)
  lib/types.ts          — shared TS interfaces (no runtime code)

[Client → Server boundary]
  POST /api/analyze     — multipart/form-data: image (Blob) + blacklist (JSON string)

[Server]
  app/api/analyze/route.ts   — parses FormData, calls gemini.ts, returns JSON
  lib/gemini.ts              — @google/genai call, prompt, response parsing
```

---

## 3. Dependencies

Install before implementation:

```bash
npm install @google/genai
```

No other new dependencies. `crypto.randomUUID()` is built-in (Node ≥ 18, all modern browsers).

---

## 4. Module Designs

### 4.1 `lib/types.ts`

Pure TypeScript types — no imports, no runtime code.

```ts
// Ingredient blacklist entry (normalized: lowercase, trimmed)
export type Ingredient = string;

// Risk level for a dish
export type RiskLevel = 'high' | 'medium' | 'low';

// Source of ingredient knowledge used for a dish
export type IngredientSource = 'menu' | 'model' | 'both';

// A single dish result returned by Gemini
export interface DishResult {
  name: string;
  riskLevel: RiskLevel;
  blacklistedFound: string[];   // subset of blacklist detected in this dish
  allIngredients: string[];     // full ingredient list (blacklisted + safe)
  source: IngredientSource;
}

// A complete scan result stored in history
export interface ScanRecord {
  id: string;                   // crypto.randomUUID()
  timestamp: string;            // ISO 8601
  dishes: DishResult[];
  blacklistSnapshot: string[];  // copy of blacklist at time of scan
}
```

---

### 4.2 `lib/storage.ts`

All functions are SSR-safe: guarded by `typeof window === 'undefined'` before accessing `localStorage`. JSON parse failures return safe defaults and log a `console.warn`.

**localStorage keys:**
- `foodfilter_blacklist` — stores `string[]`
- `foodfilter_history` — stores `ScanRecord[]` (newest first)

**Exported functions:**

| Function | Signature | Description |
|----------|-----------|-------------|
| `getBlacklist` | `() => string[]` | Returns stored blacklist or `[]` |
| `saveBlacklist` | `(items: string[]) => void` | Overwrites stored blacklist |
| `getHistory` | `() => ScanRecord[]` | Returns history array, newest first |
| `addScanRecord` | `(record: ScanRecord) => void` | Prepends record; saves full array |
| `deleteScanRecord` | `(id: string) => void` | Removes record by id |
| `clearHistory` | `() => void` | Removes all history records |

---

### 4.3 `lib/image.ts`

Client-side only. Uses the browser Canvas API.

**Exported function:**

```ts
export async function compressImage(file: File, maxSizeKB = 1024): Promise<Blob>
```

**Algorithm:**
1. Validate `file.type` starts with `image/` — throw `Error("File must be an image")` if not.
2. Decode into an `HTMLImageElement` via `createObjectURL`.
3. Draw onto a `<canvas>` at original dimensions.
4. Encode as JPEG at quality `0.85` via `canvas.toBlob`.
5. If the resulting Blob exceeds `maxSizeKB`, loop: scale canvas dimensions by `0.9×` per iteration, re-encode, repeat until under limit or the shorter dimension falls below `100px`.
6. Return the final `Blob` (always JPEG, `image/jpeg`).

**Constraints:**
- Aspect ratio is always preserved.
- Minimum floor: `100px` on the shorter side — prevents an infinite shrink loop.
- Output MIME type is always `image/jpeg` regardless of input format.

---

### 4.4 `lib/gemini.ts`

Server-only module. No `"use client"` directive. Not imported anywhere client-side.

**Exported function:**

```ts
export async function analyzeMenu(
  imageBytes: ArrayBuffer,
  mimeType: string,
  blacklist: string[]
): Promise<DishResult[]>
```

**Implementation details:**
- Reads `process.env.GEMINI_API_KEY`. Throws `Error("GEMINI_API_KEY not set")` if absent.
- Uses `@google/genai` SDK with model `gemini-2.0-flash-lite`.
- Sends the image as an inline Part (base64 from `imageBytes`) alongside the text prompt.
- If `blacklist` is empty, the prompt instructs Gemini to return `riskLevel: "low"` and `blacklistedFound: []` for all dishes.

**Prompt structure:**
1. **System instruction:** "You are a food safety assistant. Analyze restaurant menus and identify which dishes may contain ingredients that a user wants to avoid. Always respond with valid JSON only — no markdown, no commentary."
2. **Output schema instruction:** Describe the exact JSON array shape (see below).
3. **Blacklist:** List the user's blacklisted ingredients, or state "No blacklisted ingredients" if empty.
4. **Risk rules:**
   - `high`: blacklisted ingredient explicitly listed on the menu, or model is ≥ 80% confident it is a standard component of the dish.
   - `medium`: blacklisted ingredient is plausibly present based on model knowledge but not confirmed by menu text.
   - `low`: no blacklisted ingredients detected.
5. **Source rules:** Use `source: "menu"` if ingredients were listed on the menu, `"model"` if inferred from knowledge, `"both"` if both were used.

**Expected JSON schema per dish (embedded in prompt):**
```json
{
  "name": "string",
  "riskLevel": "high | medium | low",
  "blacklistedFound": ["string"],
  "allIngredients": ["string"],
  "source": "menu | model | both"
}
```

**Response parsing:**
- Strip markdown fences (` ```json ... ``` ` or ` ``` ... ``` `) before parsing.
- Wrap `JSON.parse` in `try/catch` — throw `Error("Failed to parse AI response")` on failure.
- Validate each dish object has all five required fields. Filter out invalid dishes with `console.warn`. An empty array is a valid return value.

---

### 4.5 `app/api/analyze/route.ts`

Next.js App Router `POST` handler.

**Request:** `multipart/form-data`
- `image`: File (required, must be image MIME type)
- `blacklist`: JSON string of `string[]` (required, may be `"[]"`)

**Response (200):**
```json
{ "dishes": [/* DishResult[] */] }
```

**Error responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | `image` field missing or not a File | `{ "error": "image is required" }` |
| 400 | `blacklist` field missing or not valid JSON array | `{ "error": "blacklist is required and must be a JSON array" }` |
| 500 | `GEMINI_API_KEY` not set | `{ "error": "Server configuration error" }` |
| 500 | Gemini call throws or parse fails | `{ "error": "Analysis failed. Please try again." }` |

**Implementation steps:**
1. Parse FormData with `request.formData()`.
2. Extract and validate `image` (must be a `File` with `image/*` MIME).
3. Parse and validate `blacklist` JSON.
4. Convert `image` to `ArrayBuffer` via `image.arrayBuffer()`.
5. Call `analyzeMenu(imageBytes, image.type, blacklist)`.
6. Return `NextResponse.json({ dishes })`.
7. No image bytes are ever logged or stored.

**Body size:** Next.js App Router defaults to 4 MB — sufficient for base64-encoded 1 MB images (~1.37 MB). No `next.config.ts` change needed.

---

## 5. Error Handling Summary

| Layer | Failure | Behavior |
|-------|---------|----------|
| `image.ts` | Non-image MIME | Throws `Error("File must be an image")` |
| `storage.ts` | SSR (no `window`) | Returns safe default silently |
| `storage.ts` | Corrupt JSON in storage | Returns safe default, `console.warn` |
| `gemini.ts` | Missing API key | Throws `Error("GEMINI_API_KEY not set")` |
| `gemini.ts` | Unparseable response | Throws `Error("Failed to parse AI response")` |
| `gemini.ts` | Dish missing required fields | Filtered out with `console.warn`, rest returned |
| `route.ts` | Missing/invalid fields | 400 `{ error: "..." }` |
| `route.ts` | Gemini throws | 500 `{ error: "Analysis failed. Please try again." }` |

---

## 6. Out of Scope

- No UI components
- No loading states or client-side error display (those belong to E4/E5)
- No `ScanRecord` creation (that belongs to E6-S5)
- No changes to `next.config.ts`
