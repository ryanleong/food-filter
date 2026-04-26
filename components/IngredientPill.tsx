'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientPillProps {
  name: string;
  onRemove: (name: string) => void;
}

export function IngredientPill({ name, onRemove }: IngredientPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-sm',
        'transition-colors hover:bg-muted/80',
      )}
    >
      <span className="break-words">{name}</span>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(name)}
        className="flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring p-[15px] -m-[15px]"
      >
        <X size={14} />
      </button>
    </span>
  );
}
