import type {
  DishResult,
  IngredientSource,
  RiskLevel,
  ScanRecord,
} from '@/lib/types';

const RISK_ORDER: Record<RiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isIngredientSource(value: unknown): value is IngredientSource {
  return value === 'menu' || value === 'model' || value === 'both';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isDishResult(value: unknown): value is DishResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dish = value as Record<string, unknown>;

  return (
    typeof dish.name === 'string' &&
    isRiskLevel(dish.riskLevel) &&
    isStringArray(dish.blacklistedFound) &&
    isStringArray(dish.allIngredients) &&
    isIngredientSource(dish.source)
  );
}

export function isScanRecord(value: unknown): value is ScanRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.createdAt === 'string' &&
    Array.isArray(record.dishes) &&
    record.dishes.every((dish) => isDishResult(dish)) &&
    isStringArray(record.blacklistSnapshot)
  );
}

export function sortDishesByRisk(dishes: DishResult[]): DishResult[] {
  return [...dishes].sort(
    (left, right) => RISK_ORDER[left.riskLevel] - RISK_ORDER[right.riskLevel],
  );
}

export function getRiskSummary(dishes: DishResult[]) {
  const totalCount = dishes.length;
  const highCount = dishes.filter((dish) => dish.riskLevel === 'high').length;
  const mediumCount = dishes.filter((dish) => dish.riskLevel === 'medium').length;
  const lowCount = dishes.filter((dish) => dish.riskLevel === 'low').length;

  return {
    totalCount,
    highCount,
    mediumCount,
    lowCount,
    allLow: totalCount > 0 && highCount === 0 && mediumCount === 0,
    noDishes: totalCount === 0,
  };
}

export function getHistorySummary(record: ScanRecord): string {
  const { totalCount, highCount, mediumCount } = getRiskSummary(record.dishes);
  return `${totalCount} ${totalCount === 1 ? 'dish' : 'dishes'} · ${highCount} High Risk · ${mediumCount} Medium Risk`;
}

export function formatScanDate(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);

  return `${datePart} · ${timePart}`;
}

export function formatScanDateOnly(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}