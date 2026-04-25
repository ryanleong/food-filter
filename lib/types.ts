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
  blacklistedFound: Ingredient[]; // subset of blacklist detected in this dish
  allIngredients: Ingredient[];   // full ingredient list (blacklisted + safe)
  source: IngredientSource;
}

// A complete scan result stored in history (no image data)
export interface ScanRecord {
  id: string;                    // UUIDv4
  timestamp: string;             // ISO 8601
  dishes: DishResult[];
  blacklistSnapshot: Ingredient[]; // copy of the blacklist at time of scan
}
