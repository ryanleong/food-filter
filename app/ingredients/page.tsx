'use client';

import { IngredientInput } from '@/components/IngredientInput';
import { IngredientList } from '@/components/IngredientList';

export default function IngredientsPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Ingredients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dishes containing these ingredients will be flagged during menu analysis.
            </p>
          </div>
          <IngredientInput />
          <IngredientList />
        </div>
      </div>
    </main>
  );
}
