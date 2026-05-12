'use client';

import { useState, useId } from 'react';
import { RiskBadge } from '@/components/RiskBadge';
import { cn } from '@/lib/utils';
import type { DishResult, IngredientSource } from '@/lib/types';

interface DishCardProps {
  dish: DishResult;
}

const SOURCE_LABELS: Record<IngredientSource, string> = {
  menu:  'Sourced from menu text',
  model: 'Sourced from AI knowledge',
  both:  'Sourced from menu + AI knowledge',
};

const BORDER_COLORS: Record<string, string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-500',
  low:    'border-l-green-500',
};

export function DishCard({ dish }: DishCardProps) {
  const [expanded, setExpanded] = useState(false);
  const expandableId = useId();

  const { name, riskLevel, blacklistedFound, allIngredients, source } = dish;
  const showBlacklisted = riskLevel !== 'low' && blacklistedFound.length > 0;

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 shadow-sm overflow-hidden',
        BORDER_COLORS[riskLevel],
      )}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold break-words text-foreground leading-snug">
            {name}
          </h3>
          <RiskBadge level={riskLevel} />
        </div>

        {showBlacklisted && (
          <p
            className={cn(
              'mt-2 text-sm font-medium break-words',
              riskLevel === 'high' ? 'text-red-600' : 'text-amber-600',
            )}
          >
            Contains: {blacklistedFound.join(', ')}
          </p>
        )}

        {expanded && (
          <div id={expandableId} className="mt-3 space-y-1.5">
            <p className="text-sm text-muted-foreground break-words">
              {allIngredients.join(', ')}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {SOURCE_LABELS[source]}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={expandableId}
          className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {expanded
            ? 'Hide ingredients'
            : `Show all ingredients (${allIngredients.length})`}
        </button>
      </div>
    </div>
  );
}
