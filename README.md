# FoodFilter

A Progressive Web App (PWA) that lets users maintain a personal ingredient blacklist and scan restaurant menus using Google Gemini Vision. Photograph a menu, and the app identifies which dishes contain your blacklisted ingredients with a High / Medium / Low risk rating.

## Features

- Manage a personal ingredient blacklist (stored in `localStorage`)
- Scan menus via camera capture or file upload
- AI-powered dish analysis using Google Gemini 3.1 Flash-lite
- Per-dish risk levels with full ingredient breakdowns
- Scan history (no images stored)
- Installable PWA — works on mobile and desktop

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the project root:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Commands

| Task         | Command              |
| ------------ | -------------------- |
| Dev server   | `npm run dev`        |
| Build        | `npm run build`      |
| Test (once)  | `npm test`           |
| Test (watch) | `npm run test:watch` |
| Lint         | `npm run lint`       |

## Environment Variables

| Variable         | Required | Description                                                     |
| ---------------- | -------- | --------------------------------------------------------------- |
| `GEMINI_API_KEY` | Yes      | Google Gemini API key — used server-side only in `/api/analyze` |

## Project Structure

```
app/            Next.js App Router pages and API routes
lib/            Business logic (storage, gemini, image processing, hooks)
components/     UI components (shadcn/ui + custom)
__tests__/      Vitest + Testing Library tests (mirrors source structure)
docs/           PRD, epic plans, and design specs
```

## Deployment (Vercel)

1. Import the repository into [Vercel](https://vercel.com/new)
2. Add `GEMINI_API_KEY` as an environment variable (Settings → Environment Variables)
3. Deploy — Vercel auto-detects Next.js and runs `next build`

The PWA service worker is automatically enabled in production (`NODE_ENV=production`). No other environment variables are required.
