'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useBlacklistContext } from '@/app/providers';

export function IngredientInput() {
  const { add } = useBlacklistContext();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    add(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. peanuts, gluten, dairy…"
        aria-label="Ingredient to avoid"
        className="flex-1 border border-border bg-card rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
      />
      <button
        type="button"
        onClick={submit}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus size={16} aria-hidden="true" />
        Add
      </button>
    </div>
  );
}
