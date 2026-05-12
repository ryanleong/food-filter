/**
 * Gemini API client — SERVER-ONLY.
 * Do NOT import this file in any client component or page.
 */
import { GoogleGenAI } from "@google/genai";
import type { DishResult, IngredientSource, RiskLevel } from "./types";

// --- Prompt constants ---

const SYSTEM_INSTRUCTION =
  "You are a food safety assistant. Analyze restaurant menus and identify which dishes " +
  "may contain ingredients that a user wants to avoid. " +
  "Always respond with valid JSON only — no markdown fences, no commentary, no explanation. " +
  "Your entire response must be a JSON array.";

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

/**
 * Sanitizes a blacklist item to prevent prompt injection.
 * Strips newlines and control characters; truncates to 100 chars.
 */
function sanitizeIngredient(item: string): string {
  return item.replace(/[\r\n\t]/g, " ").slice(0, 100);
}

function buildPrompt(blacklist: string[]): string {
  // Sanitize each item before embedding in the prompt to prevent injection
  const safe = blacklist.map(sanitizeIngredient);
  const blacklistSection =
    safe.length > 0
      ? `Blacklisted ingredients to check for: ${safe.join(", ")}`
      : 'No blacklisted ingredients — return riskLevel: "low" and blacklistedFound: [] for all dishes.';

  return [
    OUTPUT_SCHEMA,
    RISK_RULES,
    SOURCE_RULES,
    blacklistSection,
    "Analyze every dish visible in the menu image.",
  ].join("\n\n");
}

/** Strips ```json ... ``` or ``` ... ``` fences that Gemini sometimes adds. */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

const VALID_RISK_LEVELS = new Set<RiskLevel>(["high", "medium", "low"]);
const VALID_SOURCES = new Set<IngredientSource>(["menu", "model", "both"]);

function isValidDish(dish: unknown): dish is DishResult {
  if (typeof dish !== "object" || dish === null) return false;
  const d = dish as Record<string, unknown>;

  if (typeof d.name !== "string") return false;
  if (!VALID_RISK_LEVELS.has(d.riskLevel as RiskLevel)) return false;
  if (!VALID_SOURCES.has(d.source as IngredientSource)) return false;
  if (!Array.isArray(d.blacklistedFound)) return false;
  if (!Array.isArray(d.allIngredients)) return false;
  // Verify array elements are strings to prevent downstream type errors
  if (!d.blacklistedFound.every((x: unknown) => typeof x === "string"))
    return false;
  if (!d.allIngredients.every((x: unknown) => typeof x === "string"))
    return false;

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
  blacklist: string[],
): Promise<DishResult[]> {
  let parsed: unknown;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const ai = new GoogleGenAI({ apiKey });

    // Convert ArrayBuffer → base64 string for the inline data part
    const base64Image = Buffer.from(imageBytes).toString("base64");
    const prompt = buildPrompt(blacklist);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview", // From May 25 2026 use: "gemini-3.1-flash-lite"
      contents: [
        {
          role: "user",
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

    const rawText = response.text ?? "";
    const cleaned = stripMarkdownFences(rawText);

    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[gemini] Failed to parse AI response:", err);
    throw err;
  }

  if (!Array.isArray(parsed)) throw new Error("Failed to parse AI response");

  const dishes: DishResult[] = [];
  for (const item of parsed) {
    if (isValidDish(item)) {
      dishes.push(item);
    } else {
      console.warn(
        "[gemini] Filtered out dish with missing or invalid fields:",
        item,
      );
    }
  }

  return dishes;
}
