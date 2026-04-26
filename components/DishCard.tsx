'use client';

import { useState, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/RiskBadge';
import { cn } from '@/lib/utils';
import type { DishResult, IngredientSource } from '@/lib/types';

interface DishCardProps {
  dish: DishResult;
}

const SOURCE_LABELS: Record<IngredientSource, string> = {
  menu:  'Source: menu text',
  model: 'Source: AI knowledge',
  both:  'Source: menu + AI knowledge',
};

export function DishCard({ dish }: DishCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expandableId = useId();

  const { name, riskLevel, blacklistedFound, allIngredients, source } = dish;
  const showBlacklisted = riskLevel !== 'low' && blacklistedFound.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold break-words">{name}</CardTitle>
        <RiskBadge level={riskLevel} />
      </CardHeader>
      <CardContent className="space-y-2">
        {showBlacklisted && (
          <p
            className={cn(
              'text-sm font-medium break-words',
              riskLevel === 'high'
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400',
            )}
          >
            Contains: {blacklistedFound.join(', ')}
          </p>
        )}

        {expanded && (
          <div id={expandableId}>
            <p className="text-sm text-muted-foreground break-words">
              {allIngredients.join(', ')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {SOURCE_LABELS[source]}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={expandableId}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        >
          {expanded
            ? 'Hide ingredients'
            : `Show all ingredients (${allIngredients.length})`}
        </button>
      </CardContent>
    </Card>
  );
}
