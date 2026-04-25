# E1 — Project Scaffold & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Supabase/auth code and configure the project as a clean FoodFilter base.

**Architecture:** Pure file deletions, component rewrites for Navigation/Footer, package.json dependency removal, and README/env-example replacement.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS

---

## File Map

| Action | Path |
|--------|------|
| Delete | `app/auth/` (entire directory) |
| Delete | `app/protected/` (entire directory) |
| Delete | `components/login-form.tsx` |
| Delete | `components/sign-up-form.tsx` |
| Delete | `components/forgot-password-form.tsx` |
| Delete | `components/update-password-form.tsx` |
| Delete | `components/auth-button.tsx` |
| Delete | `components/logout-button.tsx` |
| Delete | `components/deploy-button.tsx` |
| Delete | `components/env-var-warning.tsx` |
| Delete | `components/supabase-logo.tsx` |
| Delete | `components/next-logo.tsx` |
| Delete | `components/tutorial/` (entire directory) |
| Delete | `lib/supabase/` (entire directory) |
| Modify | `components/Navigation.tsx` — remove auth imports, simplify to app name only |
| Modify | `components/Footer.tsx` — remove Supabase branding |
| Modify | `lib/utils.ts` — remove `hasEnvVars` export |
| Create | `.env.local.example` |
| Modify | `README.md` — replace with FoodFilter setup docs |
| Modify | `package.json` — remove `@supabase/ssr` and `@supabase/supabase-js` |

---

### Task 1: Delete Auth Routes and Protected Directory

**Files:**
- Delete: `app/auth/` (entire tree)
- Delete: `app/protected/` (entire tree)

- [ ] **Step 1: Delete directories**

```bash
rm -rf app/auth app/protected
```

- [ ] **Step 2: Verify deletion**

```bash
ls app/
```
Expected: no `auth/` or `protected/` entries.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore(e1-s1): remove auth and protected routes"
```

---

### Task 2: Delete Auth & Scaffold Components

**Files:**
- Delete: `components/login-form.tsx`, `components/sign-up-form.tsx`, `components/forgot-password-form.tsx`, `components/update-password-form.tsx`
- Delete: `components/auth-button.tsx`, `components/logout-button.tsx`
- Delete: `components/deploy-button.tsx`, `components/env-var-warning.tsx`, `components/supabase-logo.tsx`, `components/next-logo.tsx`
- Delete: `components/tutorial/` (entire directory)

- [ ] **Step 1: Delete files**

```bash
rm components/login-form.tsx components/sign-up-form.tsx components/forgot-password-form.tsx components/update-password-form.tsx components/auth-button.tsx components/logout-button.tsx components/deploy-button.tsx components/env-var-warning.tsx components/supabase-logo.tsx components/next-logo.tsx
rm -rf components/tutorial
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore(e1-s1): remove auth and scaffold components"
```

---

### Task 3: Rewrite Navigation and Footer

**Files:**
- Modify: `components/Navigation.tsx`
- Modify: `components/Footer.tsx`

- [ ] **Step 1: Rewrite Navigation.tsx**

Replace entire file with:

```tsx
import Link from "next/link";

const Navigation = () => {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <Link href="/" className="font-bold text-base">
          FoodFilter
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
```

- [ ] **Step 2: Rewrite Footer.tsx**

Replace entire file with:

```tsx
import { ThemeSwitcher } from "@/components/theme-switcher";

const Footer = () => {
  return (
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
      <ThemeSwitcher />
    </footer>
  );
};

export default Footer;
```

- [ ] **Step 3: Commit**

```bash
git add components/Navigation.tsx components/Footer.tsx
git commit -m "chore(e1-s1): remove supabase branding from Navigation and Footer"
```

---

### Task 4: Remove Supabase lib Directory and Clean Utils

**Files:**
- Delete: `lib/supabase/` (entire directory)
- Modify: `lib/utils.ts` — remove `hasEnvVars`

- [ ] **Step 1: Delete lib/supabase**

```bash
rm -rf lib/supabase
```

- [ ] **Step 2: Rewrite lib/utils.ts**

Replace with:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore(e1-s1): remove lib/supabase and hasEnvVars from utils"
```

---

### Task 5: Create .env.local.example

**Files:**
- Create: `.env.local.example`

- [ ] **Step 1: Create file**

```
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "chore(e1-s2): add .env.local.example for FoodFilter"
```

---

### Task 6: Rewrite README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README**

```md
# FoodFilter

Filter restaurant menus by your personal ingredient blacklist using AI.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and fill in your key:
   ```bash
   cp .env.local.example .env.local
   ```
4. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (server-side only) |

## Deployment (Vercel)

Set `GEMINI_API_KEY` as an environment variable in your Vercel project settings. No other environment variables are required.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "chore(e1-s2): rewrite README for FoodFilter"
```

---

### Task 7: Remove Supabase Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall Supabase packages**

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

Expected output: updated `package.json` and `package-lock.json` with neither package present.

- [ ] **Step 2: Verify no Supabase imports remain**

```bash
grep -r "@supabase" --include="*.ts" --include="*.tsx" .
```

Expected: no output.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with zero errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(e1-s3): remove @supabase/supabase-js and @supabase/ssr"
```
