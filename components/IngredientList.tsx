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
        <UtensilsCrossed size={36} strokeWidth={1.5} />
        <p className="text-sm">No ingredients yet. Add one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {items.length} {items.length === 1 ? 'ingredient' : 'ingredients'} blocked
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((name) => (
          <IngredientPill key={name} name={name} onRemove={remove} />
        ))}
      </div>
    </div>
  );
}
