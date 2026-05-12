'use client';

import { X } from 'lucide-react';

interface IngredientPillProps {
  name: string;
  onRemove: (name: string) => void;
}

export function IngredientPill({ name, onRemove }: IngredientPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-sm font-medium">
      <span className="break-words">{name}</span>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(name)}
        className="flex items-center justify-center rounded-full text-secondary-foreground/60 hover:text-secondary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-[14px] -m-[14px]"
      >
        <X size={13} />
      </button>
    </span>
  );
}
