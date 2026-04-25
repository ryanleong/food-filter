# E2 — Core Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the five shared modules (`lib/types.ts`, `lib/storage.ts`, `lib/image.ts`, `lib/gemini.ts`, `app/api/analyze/route.ts`) that all FoodFilter features depend on.

**Architecture:** Flat `lib/` files with clear server/client boundaries. `gemini.ts` and `route.ts` are server-only. `image.ts` and `storage.ts` are client-side (SSR-safe). `types.ts` is shared and type-only. Communication between client and server uses `multipart/form-data` via `POST /api/analyze`.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@google/genai` SDK, Canvas API, `localStorage`, Vitest + jsdom

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `lib/types.ts` | Shared TypeScript interfaces — no runtime code |
| Create | `lib/storage.ts` | localStorage helpers — SSR-safe |
| Create | `lib/image.ts` | Client-side image compression via Canvas API |
| Create | `lib/gemini.ts` | Server-only Gemini API client |
| Create | `app/api/analyze/route.ts` | POST endpoint — Gemini proxy |
| Create | `__tests__/lib/storage.test.ts` | Unit tests for storage helpers |
| Create | `__tests__/lib/image.test.ts` | Unit tests for image compression |
| Create | `__tests__/lib/gemini.test.ts` | Unit tests for Gemini client |
| Create | `__tests__/app/api/analyze/route.test.ts` | Unit tests for the analyze route |
| Create | `vitest.config.ts` | Vitest configuration |
| Create | `vitest.setup.ts` | Test setup file |
| Modify | `package.json` | Add test scripts |
| Modify | `tsconfig.json` | Add `vitest/globals` to types |

---

## Task 1: Install Dependencies and Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install @google/genai
npm install --save-dev vitest @vitest/coverage-v8 jsdom vite-tsconfig-paths
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
// Global test setup. Add any shared test utilities here.
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Add `vitest/globals` to `tsconfig.json`**

Add a `"types"` array to `compilerOptions` so TypeScript recognises `describe`, `it`, `expect`, etc. without explicit imports in every test file:

```json
"types": ["vitest/globals"]
```

The updated `compilerOptions` in `tsconfig.json` should look like:

```json
"compilerOptions": {
  "target": "ES2017",
  "lib": ["dom", "dom.iterable", "esnext"],
  "allowJs": true,
  "skipLibCheck": true,
  "strict": true,
  "forceConsistentCasingInFileNames": true,
  "noEmit": true,
  "esModuleInterop": true,
  "module": "esnext",
  "moduleResolution": "bundler",
  "resolveJsonModule": true,
  "isolatedModules": true,
  "jsx": "react-jsx",
  "incremental": true,
  "plugins": [{ "name": "next" }],
  "paths": { "@/*": ["./*"] },
  "types": ["vitest/globals"]
}
```

- [ ] **Step 6: Verify Vitest runs with no tests**

```bash
npm test
```

Expected output: `No test files found` or `0 tests passed`. No errors.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json tsconfig.json
git commit -m "chore: add vitest and @google/genai dependencies"
```

---

## Task 2: Create `lib/types.ts`

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
// Ingredient blacklist entry — stored normalized (lowercase, trimmed)
export type Ingredient = string;

// Risk level assigned to a dish based on blacklist matching
export type RiskLevel = 'high' | 'medium' | 'low';

// Where ingredient knowledge for a dish came from
export type IngredientSource = 'menu' | 'model' | 'both';

// A single dish result returned by Gemini
export interface DishResult {
  name: string;
  riskLevel: RiskLevel;
  blacklistedFound: string[]; // subset of blacklist detected in this dish
  allIngredients: string[];   // full ingredient list (blacklisted + safe)
  source: IngredientSource;
}

// A complete scan result stored in history (no image data)
export interface ScanRecord {
  id: string;                  // crypto.randomUUID()
  timestamp: string;           // ISO 8601
  dishes: DishResult[];
  blacklistSnapshot: string[]; // copy of the blacklist at time of scan
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat(e2): add shared TypeScript types"
```

---

## Task 3: Create `lib/storage.ts`

**Files:**
- Create: `__tests__/lib/storage.test.ts`
- Create: `lib/storage.ts`

### Step 1 — Write failing tests

- [ ] **Step 1: Create `__tests__/lib/storage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBlacklist,
  saveBlacklist,
  getHistory,
  addScanRecord,
  deleteScanRecord,
  clearHistory,
} from '../../lib/storage';
import type { ScanRecord } from '../../lib/types';

// Helper to create a minimal valid ScanRecord
const makeScanRecord = (id: string): ScanRecord => ({
  id,
  timestamp: '2026-04-25T10:00:00.000Z',
  dishes: [],
  blacklistSnapshot: [],
});

describe('getBlacklist', () => {
  beforeEach(() => localStorage.clear());

  it('returns [] when storage is empty', () => {
    expect(getBlacklist()).toEqual([]);
  });

  it('returns the stored array', () => {
    localStorage.setItem('foodfilter_blacklist', JSON.stringify(['peanuts', 'dairy']));
    expect(getBlacklist()).toEqual(['peanuts', 'dairy']);
  });

  it('returns [] and does not throw on corrupt JSON', () => {
    localStorage.setItem('foodfilter_blacklist', '{invalid}');
    expect(getBlacklist()).toEqual([]);
  });
});

describe('saveBlacklist', () => {
  beforeEach(() => localStorage.clear());

  it('persists the array to localStorage', () => {
    saveBlacklist(['gluten', 'nuts']);
    expect(JSON.parse(localStorage.getItem('foodfilter_blacklist')!)).toEqual(['gluten', 'nuts']);
  });

  it('overwrites the previous value', () => {
    saveBlacklist(['a']);
    saveBlacklist(['b', 'c']);
    expect(getBlacklist()).toEqual(['b', 'c']);
  });
});

describe('getHistory', () => {
  beforeEach(() => localStorage.clear());

  it('returns [] when storage is empty', () => {
    expect(getHistory()).toEqual([]);
  });

  it('returns the stored history array', () => {
    const rec = makeScanRecord('1');
    localStorage.setItem('foodfilter_history', JSON.stringify([rec]));
    expect(getHistory()).toEqual([rec]);
  });

  it('returns [] and does not throw on corrupt JSON', () => {
    localStorage.setItem('foodfilter_history', 'BROKEN');
    expect(getHistory()).toEqual([]);
  });
});

describe('addScanRecord', () => {
  beforeEach(() => localStorage.clear());

  it('prepends a new record so newest is first', () => {
    const first = makeScanRecord('1');
    const second = makeScanRecord('2');
    addScanRecord(first);
    addScanRecord(second);
    const history = getHistory();
    expect(history[0].id).toBe('2');
    expect(history[1].id).toBe('1');
  });

  it('works on an empty history', () => {
    addScanRecord(makeScanRecord('a'));
    expect(getHistory()).toHaveLength(1);
  });
});

describe('deleteScanRecord', () => {
  beforeEach(() => localStorage.clear());

  it('removes the record matching the given id', () => {
    addScanRecord(makeScanRecord('a'));
    addScanRecord(makeScanRecord('b'));
    deleteScanRecord('a');
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('b');
  });

  it('does nothing when id is not found', () => {
    addScanRecord(makeScanRecord('a'));
    deleteScanRecord('z');
    expect(getHistory()).toHaveLength(1);
  });
});

describe('clearHistory', () => {
  beforeEach(() => localStorage.clear());

  it('removes all records', () => {
    addScanRecord(makeScanRecord('a'));
    addScanRecord(makeScanRecord('b'));
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it('does not throw when history is already empty', () => {
    expect(() => clearHistory()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests — expect them to FAIL (module not found)**

```bash
npm test -- __tests__/lib/storage.test.ts
```

Expected: `Error: Cannot find module '../../lib/storage'`

### Step 3 — Implement

- [ ] **Step 3: Create `lib/storage.ts`**

```ts
import type { ScanRecord } from './types';

const BLACKLIST_KEY = 'foodfilter_blacklist';
const HISTORY_KEY = 'foodfilter_history';

// Returns false in SSR environments where localStorage is unavailable
function isAvailable(): boolean {
  return typeof window !== 'undefined';
}

export function getBlacklist(): string[] {
  if (!isAvailable()) return [];
  try {
    const raw = localStorage.getItem(BLACKLIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    console.warn('[storage] Failed to parse blacklist from localStorage');
    return [];
  }
}

export function saveBlacklist(items: string[]): void {
  if (!isAvailable()) return;
  localStorage.setItem(BLACKLIST_KEY, JSON.stringify(items));
}

export function getHistory(): ScanRecord[] {
  if (!isAvailable()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanRecord[];
  } catch {
    console.warn('[storage] Failed to parse history from localStorage');
    return [];
  }
}

// Prepends the new record so the array is always newest-first
export function addScanRecord(record: ScanRecord): void {
  if (!isAvailable()) return;
  const history = getHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
}

export function deleteScanRecord(id: string): void {
  if (!isAvailable()) return;
  const history = getHistory();
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.filter((r) => r.id !== id))
  );
}

export function clearHistory(): void {
  if (!isAvailable()) return;
  localStorage.removeItem(HISTORY_KEY);
}
```

- [ ] **Step 4: Run the tests — expect them to PASS**

```bash
npm test -- __tests__/lib/storage.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts __tests__/lib/storage.test.ts
git commit -m "feat(e2): add localStorage storage helpers"
```

---

## Task 4: Create `lib/image.ts`

**Files:**
- Create: `__tests__/lib/image.test.ts`
- Create: `lib/image.ts`

`lib/image.ts` uses browser globals (`Image`, `HTMLCanvasElement`, `URL`). These must all be mocked in tests — jsdom provides `HTMLCanvasElement` as a class but its `toBlob` and `getContext` methods are stubs, so we mock them via `vi.spyOn`.

### Step 1 — Write failing tests

- [ ] **Step 1: Create `__tests__/lib/image.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressImage } from '../../lib/image';

// --- Shared mock references ---

// Reusable per-test toBlob mock — default returns a small (100-byte) JPEG blob
const mockToBlob = vi.fn<[BlobCallback, string?, number?], void>();

// drawImage spy (we just want to confirm it is called)
const mockDrawImage = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();

  // Default: toBlob returns a 100-byte blob (well under any limit)
  mockToBlob.mockImplementation((callback: BlobCallback) => {
    callback(new Blob([new Uint8Array(100)], { type: 'image/jpeg' }));
  });

  // Spy on HTMLCanvasElement prototype methods (jsdom provides the class)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(mockToBlob);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: mockDrawImage,
  } as unknown as CanvasRenderingContext2D);

  // URL stubs (jsdom does not implement these)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  // Mock Image constructor: setting src fires onload asynchronously
  vi.stubGlobal(
    'Image',
    class MockImage {
      naturalWidth = 200;
      naturalHeight = 150;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_val: string) {
        // Use Promise.resolve so callers awaiting the promise receive control after onload
        Promise.resolve().then(() => this.onload?.());
      }
      get src() {
        return '';
      }
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --- Tests ---

describe('compressImage', () => {
  it('throws if the file is not an image MIME type', async () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    await expect(compressImage(file)).rejects.toThrow('File must be an image');
  });

  it('returns a Blob with type image/jpeg for a valid image file', async () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const result = await compressImage(file);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/jpeg');
  });

  it('encodes with drawImage called once when already under the size limit', async () => {
    // Default blob is 100 bytes, default limit is 1024 KB — well under
    const file = new File(['data'], 'small.jpg', { type: 'image/jpeg' });
    await compressImage(file);
    expect(mockDrawImage).toHaveBeenCalledTimes(1);
  });

  it('re-encodes when the first blob exceeds maxSizeKB', async () => {
    // First call: 2 MB blob (over the 1 MB limit). Second call: 100 bytes.
    let callCount = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => {
        callCount++;
        const size = callCount === 1 ? 2 * 1024 * 1024 : 100;
        callback(new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
      }
    );

    const file = new File(['data'], 'large.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file);

    expect(result).toBeInstanceOf(Blob);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('respects a custom maxSizeKB parameter', async () => {
    // toBlob always returns 500 bytes; set maxSizeKB to 0.1 KB (100 bytes) — 500 bytes exceeds it
    // But the MockImage has naturalWidth=200 and naturalHeight=150.
    // The loop shrinks by 0.9× each iteration. After enough iterations the shorter side < 100px.
    // At that point the oversized blob is returned as-is.
    let callCount = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => {
        callCount++;
        callback(new Blob([new Uint8Array(500)], { type: 'image/jpeg' }));
      }
    );

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    // maxSizeKB = 0.1 KB = 102 bytes, blob is always 500 bytes
    // Loop should exit when shorter dimension < 100px
    const result = await compressImage(file, 0.1);
    expect(result).toBeInstanceOf(Blob);
    expect(callCount).toBeGreaterThan(1); // Confirmed looping happened
  });
});
```

- [ ] **Step 2: Run the tests — expect them to FAIL (module not found)**

```bash
npm test -- __tests__/lib/image.test.ts
```

Expected: `Error: Cannot find module '../../lib/image'`

### Step 3 — Implement

- [ ] **Step 3: Create `lib/image.ts`**

```ts
/**
 * Client-side image compression utility.
 * Uses the Canvas API — do NOT import this on the server.
 */

/**
 * Compresses and resizes a menu image before sending to the API.
 * Output is always JPEG regardless of input format.
 *
 * @param file     The image File selected by the user
 * @param maxSizeKB Target maximum size in kilobytes (default: 1024 = 1 MB)
 * @returns        A JPEG Blob at or below maxSizeKB, or as small as possible
 */
export async function compressImage(file: File, maxSizeKB = 1024): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const img = await loadImage(file);
  return compressToTarget(img, maxSizeKB);
}

/** Decodes a File into an HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Draws the image to a canvas at the given dimensions and encodes as JPEG.
 * Shrinks by 0.9× per iteration until the output is under maxSizeKB
 * or the shorter side falls below 100 px.
 */
async function compressToTarget(img: HTMLImageElement, maxSizeKB: number): Promise<Blob> {
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  const maxBytes = maxSizeKB * 1024;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const blob = await encodeAsJpeg(img, width, height);

    if (blob.size <= maxBytes) return blob;

    // Stop shrinking when the shorter side reaches the minimum floor
    const shorter = Math.min(width, height);
    if (shorter <= 100) return blob;

    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
  }
}

/** Draws to a canvas and encodes as JPEG at quality 0.85. */
function encodeAsJpeg(img: HTMLImageElement, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D canvas context'));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      0.85
    );
  });
}
```

- [ ] **Step 4: Run the tests — expect them to PASS**

```bash
npm test -- __tests__/lib/image.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/image.ts __tests__/lib/image.test.ts
git commit -m "feat(e2): add client-side image compression utility"
```

---

## Task 5: Create `lib/gemini.ts`

**Files:**
- Create: `__tests__/lib/gemini.test.ts`
- Create: `lib/gemini.ts`

`lib/gemini.ts` is server-only — it reads `process.env.GEMINI_API_KEY` and calls `@google/genai`. Tests mock the SDK using `vi.mock`.

### Step 1 — Write failing tests

- [ ] **Step 1: Create `__tests__/lib/gemini.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — must appear before the module under test is imported
vi.mock('@google/genai');

import { GoogleGenAI } from '@google/genai';
import { analyzeMenu } from '../../lib/gemini';
import type { DishResult } from '../../lib/types';

// Type-narrow the mocked constructor
const MockedGoogleGenAI = vi.mocked(GoogleGenAI);

// The mock for ai.models.generateContent
const mockGenerateContent = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GEMINI_API_KEY = 'test-key';

  MockedGoogleGenAI.mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  }) as unknown as InstanceType<typeof GoogleGenAI>);
});

// A valid dish fixture that passes all field validation
const validDish: DishResult = {
  name: 'Pad Thai',
  riskLevel: 'high',
  blacklistedFound: ['peanuts'],
  allIngredients: ['rice noodles', 'peanuts', 'egg', 'tofu'],
  source: 'menu',
};

describe('analyzeMenu', () => {
  it('throws when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      analyzeMenu(new ArrayBuffer(0), 'image/jpeg', [])
    ).rejects.toThrow('GEMINI_API_KEY not set');
  });

  it('returns an empty array when Gemini responds with an empty JSON array', async () => {
    mockGenerateContent.mockResolvedValue({ text: '[]' });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toEqual([]);
  });

  it('returns parsed dish results for a valid JSON response', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify([validDish]) });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', ['peanuts']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pad Thai');
    expect(result[0].riskLevel).toBe('high');
  });

  it('strips markdown fences before parsing', async () => {
    const wrapped = '```json\n' + JSON.stringify([validDish]) + '\n```';
    mockGenerateContent.mockResolvedValue({ text: wrapped });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(1);
  });

  it('strips plain code fences before parsing', async () => {
    const wrapped = '```\n' + JSON.stringify([validDish]) + '\n```';
    mockGenerateContent.mockResolvedValue({ text: wrapped });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(1);
  });

  it('throws when the response is not valid JSON', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not-json' });
    await expect(
      analyzeMenu(new ArrayBuffer(0), 'image/jpeg', [])
    ).rejects.toThrow('Failed to parse AI response');
  });

  it('throws when the response is not a JSON array', async () => {
    mockGenerateContent.mockResolvedValue({ text: '{"name":"Burger"}' });
    await expect(
      analyzeMenu(new ArrayBuffer(0), 'image/jpeg', [])
    ).rejects.toThrow('Failed to parse AI response');
  });

  it('filters out dishes missing required fields', async () => {
    const incompleteDish = { name: 'Burger' }; // missing riskLevel, blacklistedFound, etc.
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([incompleteDish, validDish]),
    });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pad Thai');
  });

  it('filters out dishes with an invalid riskLevel value', async () => {
    const badDish = { ...validDish, riskLevel: 'critical' };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([badDish]),
    });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(0);
  });

  it('passes the blacklist to generateContent', async () => {
    mockGenerateContent.mockResolvedValue({ text: '[]' });
    await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', ['gluten', 'dairy']);

    const call = mockGenerateContent.mock.calls[0][0] as { contents: unknown[] };
    const contentsStr = JSON.stringify(call.contents);
    expect(contentsStr).toContain('gluten');
    expect(contentsStr).toContain('dairy');
  });
});
```

- [ ] **Step 2: Run the tests — expect them to FAIL (module not found)**

```bash
npm test -- __tests__/lib/gemini.test.ts
```

Expected: `Error: Cannot find module '../../lib/gemini'`

### Step 3 — Implement

- [ ] **Step 3: Create `lib/gemini.ts`**

```ts
/**
 * Gemini API client — SERVER-ONLY.
 * Do NOT import this file in any client component or page.
 */
import { GoogleGenAI } from '@google/genai';
import type { DishResult, IngredientSource, RiskLevel } from './types';

// --- Prompt constants ---

const SYSTEM_INSTRUCTION =
  'You are a food safety assistant. Analyze restaurant menus and identify which dishes ' +
  'may contain ingredients that a user wants to avoid. ' +
  'Always respond with valid JSON only — no markdown fences, no commentary, no explanation. ' +
  'Your entire response must be a JSON array.';

const OUTPUT_SCHEMA = `Return a JSON array where each element has exactly these five fields:
{
  "name": string,              // dish name as it appears on the menu
  "riskLevel": "high" | "medium" | "low",
  "blacklistedFound": string[], // blacklisted ingredients found in this dish (empty array if none)
  "allIngredients": string[],   // every ingredient identified for this dish
  "source": "menu" | "model" | "both" // where ingredient information came from
}`;

const RISK_RULES = `Risk level rules:
- "high": a blacklisted ingredient is explicitly listed on the menu for this dish, OR you are >= 80% confident it is a standard component based on your knowledge.
- "medium": a blacklisted ingredient is plausibly present from your knowledge of the dish, but not confirmed by menu text.
- "low": no blacklisted ingredients detected.`;

const SOURCE_RULES = `Source rules:
- "menu": used only ingredient information explicitly listed on the menu.
- "model": inferred ingredients from your own knowledge of the dish.
- "both": used both menu text and your own knowledge.`;

// --- Helpers ---

function buildPrompt(blacklist: string[]): string {
  const blacklistSection =
    blacklist.length > 0
      ? `Blacklisted ingredients to check for: ${blacklist.join(', ')}`
      : 'No blacklisted ingredients — return riskLevel: "low" and blacklistedFound: [] for all dishes.';

  return [OUTPUT_SCHEMA, RISK_RULES, SOURCE_RULES, blacklistSection, 'Analyze every dish visible in the menu image.'].join('\n\n');
}

/** Strips ```json ... ``` or ``` ... ``` fences that Gemini sometimes adds. */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

const VALID_RISK_LEVELS = new Set<RiskLevel>(['high', 'medium', 'low']);
const VALID_SOURCES = new Set<IngredientSource>(['menu', 'model', 'both']);

function isValidDish(dish: unknown): dish is DishResult {
  if (typeof dish !== 'object' || dish === null) return false;
  const d = dish as Record<string, unknown>;

  if (typeof d.name !== 'string') return false;
  if (!VALID_RISK_LEVELS.has(d.riskLevel as RiskLevel)) return false;
  if (!VALID_SOURCES.has(d.source as IngredientSource)) return false;
  if (!Array.isArray(d.blacklistedFound)) return false;
  if (!Array.isArray(d.allIngredients)) return false;

  return true;
}

// --- Public API ---

/**
 * Sends a menu image and the user's blacklist to Gemini and returns structured dish results.
 *
 * @param imageBytes   Raw image bytes from the uploaded file
 * @param mimeType     MIME type of the image (e.g. "image/jpeg")
 * @param blacklist    Ingredients to flag (may be empty)
 */
export async function analyzeMenu(
  imageBytes: ArrayBuffer,
  mimeType: string,
  blacklist: string[]
): Promise<DishResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const ai = new GoogleGenAI({ apiKey });

  // Convert ArrayBuffer → base64 string for the inline data part
  const base64Image = Buffer.from(imageBytes).toString('base64');
  const prompt = buildPrompt(blacklist);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  const rawText = response.text ?? '';
  const cleaned = stripMarkdownFences(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response');
  }

  if (!Array.isArray(parsed)) throw new Error('Failed to parse AI response');

  const dishes: DishResult[] = [];
  for (const item of parsed) {
    if (isValidDish(item)) {
      dishes.push(item);
    } else {
      console.warn('[gemini] Filtered out dish with missing or invalid fields:', item);
    }
  }

  return dishes;
}
```

- [ ] **Step 4: Run the tests — expect them to PASS**

```bash
npm test -- __tests__/lib/gemini.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/gemini.ts __tests__/lib/gemini.test.ts
git commit -m "feat(e2): add Gemini API client"
```

---

## Task 6: Create `app/api/analyze/route.ts`

**Files:**
- Create: `__tests__/app/api/analyze/route.test.ts`
- Create: `app/api/analyze/route.ts`

The route handler is tested by constructing a `Request` with a `FormData` body and calling `POST` directly — no HTTP server needed. `lib/gemini` is mocked so tests don't require a real API key.

### Step 1 — Write failing tests

- [ ] **Step 1: Create `__tests__/app/api/analyze/route.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Gemini module before importing the route
vi.mock('@/lib/gemini');

import { analyzeMenu } from '@/lib/gemini';
import { POST } from '../../../app/api/analyze/route';
import type { DishResult } from '@/lib/types';

const mockAnalyzeMenu = vi.mocked(analyzeMenu);

// Creates a Request with a multipart/form-data body
function makeRequest(fields: Record<string, string | File>): Request {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    body: form,
  });
}

// A minimal valid image File for use in tests
const sampleImage = new File([new Uint8Array(100)], 'menu.jpg', {
  type: 'image/jpeg',
});

const sampleDish: DishResult = {
  name: 'Pasta Carbonara',
  riskLevel: 'medium',
  blacklistedFound: ['dairy'],
  allIngredients: ['pasta', 'egg', 'guanciale', 'pecorino'],
  source: 'model',
};

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  // --- 400 validation ---

  it('returns 400 with descriptive error when image field is missing', async () => {
    const req = makeRequest({ blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('image is required');
  });

  it('returns 400 when image field is not a File (sent as plain string)', async () => {
    const req = makeRequest({ image: 'not-a-file', blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('image is required');
  });

  it('returns 400 with descriptive error when blacklist field is missing', async () => {
    const req = makeRequest({ image: sampleImage });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('blacklist is required and must be a JSON array');
  });

  it('returns 400 when blacklist is not valid JSON', async () => {
    const req = makeRequest({ image: sampleImage, blacklist: '{invalid}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('blacklist is required and must be a JSON array');
  });

  it('returns 400 when blacklist parses to a non-array JSON value', async () => {
    const req = makeRequest({ image: sampleImage, blacklist: '"peanuts"' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // --- 200 success ---

  it('returns 200 with dishes on a successful analysis', async () => {
    mockAnalyzeMenu.mockResolvedValue([sampleDish]);
    const req = makeRequest({ image: sampleImage, blacklist: '["dairy"]' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dishes).toEqual([sampleDish]);
  });

  it('returns 200 with an empty dishes array when Gemini finds no dishes', async () => {
    mockAnalyzeMenu.mockResolvedValue([]);
    const req = makeRequest({ image: sampleImage, blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dishes).toEqual([]);
  });

  it('calls analyzeMenu with the image bytes and parsed blacklist', async () => {
    mockAnalyzeMenu.mockResolvedValue([]);
    const req = makeRequest({ image: sampleImage, blacklist: '["gluten","nuts"]' });
    await POST(req);
    expect(mockAnalyzeMenu).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      'image/jpeg',
      ['gluten', 'nuts']
    );
  });

  // --- 500 errors ---

  it('returns 500 with a safe message when GEMINI_API_KEY is not set', async () => {
    mockAnalyzeMenu.mockRejectedValue(new Error('GEMINI_API_KEY not set'));
    const req = makeRequest({ image: sampleImage, blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Server configuration error');
  });

  it('returns 500 with a safe message when analysis fails', async () => {
    mockAnalyzeMenu.mockRejectedValue(new Error('Failed to parse AI response'));
    const req = makeRequest({ image: sampleImage, blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Analysis failed. Please try again.');
  });
});
```

- [ ] **Step 2: Run the tests — expect them to FAIL (module not found)**

```bash
npm test -- __tests__/app/api/analyze/route.test.ts
```

Expected: `Error: Cannot find module '../../../app/api/analyze/route'`

### Step 3 — Implement

- [ ] **Step 3: Create `app/api/analyze/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { analyzeMenu } from '@/lib/gemini';

export async function POST(request: Request) {
  // --- Parse FormData ---
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // --- Validate image ---
  const imageField = formData.get('image');
  if (
    !imageField ||
    !(imageField instanceof File) ||
    !imageField.type.startsWith('image/')
  ) {
    return NextResponse.json({ error: 'image is required' }, { status: 400 });
  }

  // --- Validate blacklist ---
  const blacklistField = formData.get('blacklist');
  if (!blacklistField || typeof blacklistField !== 'string') {
    return NextResponse.json(
      { error: 'blacklist is required and must be a JSON array' },
      { status: 400 }
    );
  }

  let blacklist: unknown;
  try {
    blacklist = JSON.parse(blacklistField);
  } catch {
    return NextResponse.json(
      { error: 'blacklist is required and must be a JSON array' },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(blacklist) ||
    !blacklist.every((item) => typeof item === 'string')
  ) {
    return NextResponse.json(
      { error: 'blacklist is required and must be a JSON array' },
      { status: 400 }
    );
  }

  // --- Call Gemini ---
  // Convert image to ArrayBuffer — image bytes are never logged or stored
  const imageBytes = await imageField.arrayBuffer();

  try {
    const dishes = await analyzeMenu(imageBytes, imageField.type, blacklist);
    return NextResponse.json({ dishes });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';

    if (message === 'GEMINI_API_KEY not set') {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run the tests — expect them to PASS**

```bash
npm test -- __tests__/app/api/analyze/route.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: All tests across all four test files pass. Zero failures.

- [ ] **Step 6: Verify the project builds without TypeScript errors**

```bash
npm run build
```

Expected: Build completes successfully. No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/analyze/route.ts __tests__/app/api/analyze/route.test.ts
git commit -m "feat(e2): add Gemini proxy API route"
```

---

## Done

All five E2 modules are implemented and tested:

| Module | Tests |
|--------|-------|
| `lib/types.ts` | — (type-only, no tests needed) |
| `lib/storage.ts` | `__tests__/lib/storage.test.ts` |
| `lib/image.ts` | `__tests__/lib/image.test.ts` |
| `lib/gemini.ts` | `__tests__/lib/gemini.test.ts` |
| `app/api/analyze/route.ts` | `__tests__/app/api/analyze/route.test.ts` |

The app is now ready for E3 (Ingredient Blacklist UI) and E4 (Menu Scanning UI), which depend on these modules.
