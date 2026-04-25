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
