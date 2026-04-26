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

1. Import the repository into [Vercel](https://vercel.com/new)
2. Add `GEMINI_API_KEY` as an environment variable in your Vercel project settings (Settings → Environment Variables)
3. Deploy — Vercel auto-detects Next.js and runs `next build`

No other environment variables are required. The PWA service worker is automatically enabled in production (`NODE_ENV=production`).
