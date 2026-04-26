# E3 — Ingredient Blacklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/ingredients` page where users can add and remove blacklisted ingredients, backed by a shared React context that persists to `localStorage` and will be consumed by the scan page in E4.

**Architecture:** A `useBlacklist` custom hook owns all state logic (add/remove/normalize/deduplicate + localStorage sync). A `BlacklistProvider` wraps the app in `app/layout.tsx`, making the hook's return value available everywhere via `useBlacklistContext()`. Three focused UI components (`IngredientInput`, `IngredientList`, `IngredientPill`) compose the page.

**Tech Stack:** Next.js App Router, React context, shadcn/ui (`Input`, `Button`), lucide-react, Vitest, `@testing-library/react`, `@testing-library/user-event`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/hooks/useBlacklist.ts` | State logic: add/remove/normalize/deduplicate + localStorage sync |
| Create | `app/providers.tsx` | `BlacklistContext`, `BlacklistProvider`, `useBlacklistContext()` |
| Modify | `app/layout.tsx` | Wrap `{children}` with `<BlacklistProvider>` |
| Create | `app/ingredients/page.tsx` | Route entry, page title/heading, composition |
| Create | `components/IngredientInput.tsx` | Controlled input + Add button |
| Create | `components/IngredientPill.tsx` | Single ingredient tag with × remove button |
| Create | `components/IngredientList.tsx` | Count, alphabetical pill grid, empty state |
| Create | `__tests__/lib/hooks/useBlacklist.test.ts` | Hook unit tests |
| Create | `__tests__/components/IngredientPill.test.tsx` | Pill unit tests |
| Create | `__tests__/components/IngredientInput.test.tsx` | Input component tests |
| Create | `__tests__/components/IngredientList.test.tsx` | List component tests |
| Create | `__tests__/app/ingredients/page.test.tsx` | Page integration tests |

---

## Task 1: Install React Testing Library

**Files:**
- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Install the packages**

```bash
npm install --save-dev @testing-library/react @testing-library/user-event
```

- [ ] **Step 2: Verify the install**

```bash
npm test
```

Expected: existing tests still pass (no regressions).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @testing-library/react and user-event"
```

---

## Task 2: `useBlacklist` Hook (TDD)

**Files:**
- Create: `__tests__/lib/hooks/useBlacklist.test.ts`
- Create: `lib/hooks/useBlacklist.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/hooks/useBlacklist.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlacklist } from '@/lib/hooks/useBlacklist';
import * as storage from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  getBlacklist: vi.fn(),
  saveBlacklist: vi.fn(),
}));

const mockGetBlacklist = vi.mocked(storage.getBlacklist);
const mockSaveBlacklist = vi.mocked(storage.saveBlacklist);

describe('useBlacklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlacklist.mockReturnValue([]);
  });

  describe('initialization', () => {
    it('initializes items from getBlacklist()', () => {
      mockGetBlacklist.mockReturnValue(['nuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      expect(result.current.items).toEqual(['nuts', 'dairy']);
    });

    it('initializes to [] when storage is empty', () => {
      mockGetBlacklist.mockReturnValue([]);
      const { result } = renderHook(() => useBlacklist());
      expect(result.current.items).toEqual([]);
    });
  });

  describe('add', () => {
    it('adds a new ingredient', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('peanuts'));
      expect(result.current.items).toContain('peanuts');
    });

    it('trims whitespace before adding', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('  peanuts  '));
      expect(result.current.items).toContain('peanuts');
      expect(result.current.items).not.toContain('  peanuts  ');
    });

    it('lowercases the ingredient before adding', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('Peanuts'));
      expect(result.current.items).toContain('peanuts');
      expect(result.current.items).not.toContain('Peanuts');
    });

    it('silently ignores empty string', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add(''));
      expect(result.current.items).toHaveLength(0);
    });

    it('silently ignores whitespace-only string', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('   '));
      expect(result.current.items).toHaveLength(0);
    });

    it('silently ignores exact duplicate', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('peanuts'));
      act(() => result.current.add('peanuts'));
      expect(result.current.items).toHaveLength(1);
    });

    it('deduplicates case-insensitively', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('PEANUTS'));
      expect(result.current.items).toHaveLength(1);
    });

    it('calls saveBlacklist with the updated array', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('gluten'));
      expect(mockSaveBlacklist).toHaveBeenCalledWith(['gluten']);
    });
  });

  describe('remove', () => {
    it('removes the matching ingredient', () => {
      mockGetBlacklist.mockReturnValue(['peanuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.remove('peanuts'));
      expect(result.current.items).not.toContain('peanuts');
      expect(result.current.items).toContain('dairy');
    });

    it('calls saveBlacklist with the filtered array', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.remove('peanuts'));
      expect(mockSaveBlacklist).toHaveBeenCalledWith([]);
    });

    it('does nothing if item is not in the list', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.remove('gluten'));
      expect(result.current.items).toEqual(['peanuts']);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/hooks/useBlacklist.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/hooks/useBlacklist'`

- [ ] **Step 3: Implement `useBlacklist`**

Create `lib/hooks/useBlacklist.ts`:

```typescript
'use client';

import { useState } from 'react';
import { getBlacklist, saveBlacklist } from '@/lib/storage';

export interface UseBlacklistReturn {
  items: string[];
  add: (raw: string) => void;
  remove: (name: string) => void;
}

export function useBlacklist(): UseBlacklistReturn {
  const [items, setItems] = useState<string[]>(() => getBlacklist());

  function add(raw: string): void {
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;

    setItems((prev) => {
      if (prev.includes(normalized)) return prev;
      const updated = [...prev, normalized];
      saveBlacklist(updated);
      return updated;
    });
  }

  function remove(name: string): void {
    setItems((prev) => {
      const updated = prev.filter((item) => item !== name);
      saveBlacklist(updated);
      return updated;
    });
  }

  return { items, add, remove };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/hooks/useBlacklist.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useBlacklist.ts __tests__/lib/hooks/useBlacklist.test.ts
git commit -m "feat(e3): add useBlacklist hook with TDD"
```

---

## Task 3: `BlacklistProvider` + Layout Wiring

**Files:**
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`

> No dedicated test file — the provider is exercised fully by the component and page integration tests in later tasks.

- [ ] **Step 1: Create `app/providers.tsx`**

```typescript
'use client';

import { createContext, useContext } from 'react';
import { useBlacklist, type UseBlacklistReturn } from '@/lib/hooks/useBlacklist';

export const BlacklistContext = createContext<UseBlacklistReturn | null>(null);

export function BlacklistProvider({ children }: { children: React.ReactNode }) {
  const value = useBlacklist();
  return (
    <BlacklistContext.Provider value={value}>
      {children}
    </BlacklistContext.Provider>
  );
}

export function useBlacklistContext(): UseBlacklistReturn {
  const ctx = useContext(BlacklistContext);
  if (!ctx) {
    throw new Error('useBlacklistContext must be used inside <BlacklistProvider>');
  }
  return ctx;
}
```

- [ ] **Step 2: Modify `app/layout.tsx` to wrap children**

The current `app/layout.tsx` content:
```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
// ... font setup ...
export default function RootLayout({ children }: ...) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={...}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navigation />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Update it to:
```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BlacklistProvider } from "@/app/providers";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "FoodFilter",
  description: "Avoid unwanted ingredients when dining out",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
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
          <Navigation />
          <BlacklistProvider>
            {children}
          </BlacklistProvider>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the build compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add app/providers.tsx app/layout.tsx
git commit -m "feat(e3): add BlacklistProvider and wire into layout"
```

---

## Task 4: `IngredientPill` Component (TDD)

**Files:**
- Create: `__tests__/components/IngredientPill.test.tsx`
- Create: `components/IngredientPill.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/IngredientPill.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientPill } from '@/components/IngredientPill';

describe('IngredientPill', () => {
  it('renders the ingredient name', () => {
    render(<IngredientPill name="peanuts" onRemove={vi.fn()} />);
    expect(screen.getByText('peanuts')).toBeInTheDocument();
  });

  it('renders a remove button with accessible label', () => {
    render(<IngredientPill name="dairy" onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove dairy' })).toBeInTheDocument();
  });

  it('calls onRemove with the ingredient name when × is clicked', async () => {
    const onRemove = vi.fn();
    render(<IngredientPill name="gluten" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove gluten' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith('gluten');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/IngredientPill.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/IngredientPill'`

- [ ] **Step 3: Implement `IngredientPill`**

Create `components/IngredientPill.tsx`:

```typescript
'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientPillProps {
  name: string;
  onRemove: (name: string) => void;
}

export function IngredientPill({ name, onRemove }: IngredientPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-sm',
        'transition-colors hover:bg-muted/80',
      )}
    >
      {name}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(name)}
        className="flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <X size={14} />
      </button>
    </span>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/IngredientPill.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/IngredientPill.tsx __tests__/components/IngredientPill.test.tsx
git commit -m "feat(e3): add IngredientPill component with TDD"
```

---

## Task 5: `IngredientInput` Component (TDD)

**Files:**
- Create: `__tests__/components/IngredientInput.test.tsx`
- Create: `components/IngredientInput.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/IngredientInput.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientInput } from '@/components/IngredientInput';
import { BlacklistContext } from '@/app/providers';
import type { UseBlacklistReturn } from '@/lib/hooks/useBlacklist';

// Helper: render IngredientInput with a mock context value
function renderWithContext(contextValue: Partial<UseBlacklistReturn> = {}) {
  const defaults: UseBlacklistReturn = {
    items: [],
    add: vi.fn(),
    remove: vi.fn(),
    ...contextValue,
  };
  return {
    ...render(
      <BlacklistContext.Provider value={defaults}>
        <IngredientInput />
      </BlacklistContext.Provider>
    ),
    mockAdd: defaults.add as ReturnType<typeof vi.fn>,
  };
}

describe('IngredientInput', () => {
  it('renders an input with placeholder text', () => {
    renderWithContext();
    expect(
      screen.getByPlaceholderText('e.g. peanuts, gluten, dairy…')
    ).toBeInTheDocument();
  });

  it('renders an Add button', () => {
    renderWithContext();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls add with the typed value when Add is clicked', async () => {
    const { mockAdd } = renderWithContext();
    await userEvent.type(screen.getByRole('textbox'), 'peanuts');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(mockAdd).toHaveBeenCalledWith('peanuts');
  });

  it('calls add when Enter is pressed in the input', async () => {
    const { mockAdd } = renderWithContext();
    await userEvent.type(screen.getByRole('textbox'), 'dairy{Enter}');
    expect(mockAdd).toHaveBeenCalledWith('dairy');
  });

  it('clears the input after adding via button', async () => {
    renderWithContext();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'gluten');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(input).toHaveValue('');
  });

  it('clears the input after adding via Enter', async () => {
    renderWithContext();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'soy{Enter}');
    expect(input).toHaveValue('');
  });

  it('does not call add when input is empty and Add is clicked', async () => {
    const { mockAdd } = renderWithContext();
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/IngredientInput.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/IngredientInput'`

- [ ] **Step 3: Implement `IngredientInput`**

Create `components/IngredientInput.tsx`:

```typescript
'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBlacklistContext } from '@/app/providers';

export function IngredientInput() {
  const { add } = useBlacklistContext();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    add(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. peanuts, gluten, dairy…"
        aria-label="Ingredient to avoid"
        className="flex-1"
      />
      <Button type="button" onClick={submit}>
        Add
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/IngredientInput.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/IngredientInput.tsx __tests__/components/IngredientInput.test.tsx
git commit -m "feat(e3): add IngredientInput component with TDD"
```

---

## Task 6: `IngredientList` Component (TDD)

**Files:**
- Create: `__tests__/components/IngredientList.test.tsx`
- Create: `components/IngredientList.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/IngredientList.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientList } from '@/components/IngredientList';
import { BlacklistContext } from '@/app/providers';
import type { UseBlacklistReturn } from '@/lib/hooks/useBlacklist';

function renderWithContext(contextValue: Partial<UseBlacklistReturn> = {}) {
  const defaults: UseBlacklistReturn = {
    items: [],
    add: vi.fn(),
    remove: vi.fn(),
    ...contextValue,
  };
  return {
    ...render(
      <BlacklistContext.Provider value={defaults}>
        <IngredientList />
      </BlacklistContext.Provider>
    ),
    mockRemove: defaults.remove as ReturnType<typeof vi.fn>,
  };
}

describe('IngredientList', () => {
  it('shows empty-state message when there are no ingredients', () => {
    renderWithContext({ items: [] });
    expect(
      screen.getByText(/no ingredients yet/i)
    ).toBeInTheDocument();
  });

  it('does not show empty-state when items are present', () => {
    renderWithContext({ items: ['peanuts'] });
    expect(screen.queryByText(/no ingredients yet/i)).not.toBeInTheDocument();
  });

  it('renders a pill for each ingredient', () => {
    renderWithContext({ items: ['peanuts', 'dairy', 'gluten'] });
    expect(screen.getByText('peanuts')).toBeInTheDocument();
    expect(screen.getByText('dairy')).toBeInTheDocument();
    expect(screen.getByText('gluten')).toBeInTheDocument();
  });

  it('displays the correct count for one item', () => {
    renderWithContext({ items: ['peanuts'] });
    expect(screen.getByText('1 ingredient')).toBeInTheDocument();
  });

  it('displays the correct count for multiple items', () => {
    renderWithContext({ items: ['peanuts', 'dairy'] });
    expect(screen.getByText('2 ingredients')).toBeInTheDocument();
  });

  it('renders items in alphabetical order', () => {
    renderWithContext({ items: ['soy', 'dairy', 'almonds'] });
    const pills = screen.getAllByRole('button', { name: /^Remove/ });
    // aria-labels are "Remove almonds", "Remove dairy", "Remove soy"
    expect(pills[0]).toHaveAccessibleName('Remove almonds');
    expect(pills[1]).toHaveAccessibleName('Remove dairy');
    expect(pills[2]).toHaveAccessibleName('Remove soy');
  });

  it('calls remove with the ingredient name when × is clicked', async () => {
    const { mockRemove } = renderWithContext({ items: ['peanuts'] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove peanuts' }));
    expect(mockRemove).toHaveBeenCalledWith('peanuts');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/components/IngredientList.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/IngredientList'`

- [ ] **Step 3: Implement `IngredientList`**

Create `components/IngredientList.tsx`:

```typescript
'use client';

import { UtensilsCrossed } from 'lucide-react';
import { useBlacklistContext } from '@/app/providers';
import { IngredientPill } from '@/components/IngredientPill';

export function IngredientList() {
  const { items, remove } = useBlacklistContext();
  const sorted = [...items].sort((a, b) => a.localeCompare(b));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <UtensilsCrossed size={40} strokeWidth={1.5} />
        <p className="text-sm">No ingredients yet. Add one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? 'ingredient' : 'ingredients'}
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((name) => (
          <IngredientPill key={name} name={name} onRemove={remove} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/components/IngredientList.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/IngredientList.tsx __tests__/components/IngredientList.test.tsx
git commit -m "feat(e3): add IngredientList component with TDD"
```

---

## Task 7: `/ingredients` Page + Integration Tests (TDD)

**Files:**
- Create: `__tests__/app/ingredients/page.test.tsx`
- Create: `app/ingredients/page.tsx`

- [ ] **Step 1: Write the failing integration tests**

Create `__tests__/app/ingredients/page.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IngredientsPage from '@/app/ingredients/page';
import { BlacklistProvider } from '@/app/providers';
import * as storage from '@/lib/storage';

// Mock storage so tests start with a clean slate
vi.mock('@/lib/storage', () => ({
  getBlacklist: vi.fn(),
  saveBlacklist: vi.fn(),
}));

const mockGetBlacklist = vi.mocked(storage.getBlacklist);

// Render the page inside the real BlacklistProvider backed by mocked storage
function renderPage() {
  return render(
    <BlacklistProvider>
      <IngredientsPage />
    </BlacklistProvider>
  );
}

describe('IngredientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlacklist.mockReturnValue([]);
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /my ingredients/i })).toBeInTheDocument();
  });

  it('shows empty state on first visit', () => {
    renderPage();
    expect(screen.getByText(/no ingredients yet/i)).toBeInTheDocument();
  });

  it('adds an ingredient via the Add button', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'peanuts');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByText('peanuts')).toBeInTheDocument();
  });

  it('adds an ingredient via the Enter key', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'dairy{Enter}');
    expect(screen.getByText('dairy')).toBeInTheDocument();
  });

  it('clears the input after adding', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'gluten{Enter}');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('removes an ingredient when × is clicked', async () => {
    mockGetBlacklist.mockReturnValue(['peanuts']);
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Remove peanuts' }));
    expect(screen.queryByText('peanuts')).not.toBeInTheDocument();
    expect(screen.getByText(/no ingredients yet/i)).toBeInTheDocument();
  });

  it('shows correct count after adding items', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'nuts{Enter}');
    await userEvent.type(screen.getByRole('textbox'), 'soy{Enter}');
    expect(screen.getByText('2 ingredients')).toBeInTheDocument();
  });

  it('does not add a duplicate ingredient', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('textbox'), 'nuts{Enter}');
    await userEvent.type(screen.getByRole('textbox'), 'nuts{Enter}');
    expect(screen.getByText('1 ingredient')).toBeInTheDocument();
  });

  it('pre-populates with existing blacklist from storage', () => {
    mockGetBlacklist.mockReturnValue(['dairy', 'eggs']);
    renderPage();
    expect(screen.getByText('dairy')).toBeInTheDocument();
    expect(screen.getByText('eggs')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/app/ingredients/page.test.tsx
```

Expected: FAIL — `Cannot find module '@/app/ingredients/page'`

- [ ] **Step 3: Implement `app/ingredients/page.tsx`**

Create `app/ingredients/page.tsx`:

```typescript
'use client';

import { IngredientInput } from '@/components/IngredientInput';
import { IngredientList } from '@/components/IngredientList';

export default function IngredientsPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Ingredients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dishes containing these ingredients will be flagged during menu analysis.
            </p>
          </div>
          <IngredientInput />
          <IngredientList />
        </div>
      </div>
    </main>
  );
}
```

> **Note:** Page metadata (`<title>`) cannot be set with `export const metadata` in a `"use client"` component. The page title will be inherited from the root layout (`"FoodFilter"`) for now. If a custom page title is needed, extract a server wrapper component in a follow-up task.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/app/ingredients/page.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: All tests PASS (no regressions).

- [ ] **Step 6: Commit**

```bash
git add app/ingredients/page.tsx __tests__/app/ingredients/page.test.tsx
git commit -m "feat(e3): add /ingredients page with integration tests"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 2: Type-check the whole project**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Start the dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/ingredients` and verify:
- Page heading "My Ingredients" is visible
- Empty state message shows on first visit
- Typing an ingredient and clicking Add adds a pill
- Pressing Enter in the input adds a pill
- Clicking × on a pill removes it
- Items are sorted alphabetically
- Count updates correctly
- Refreshing the page restores the saved ingredients (localStorage persisted)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(e3): complete ingredient blacklist epic"
```
