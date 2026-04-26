'use client';

import Link from 'next/link';
import { useResults } from '@/lib/hooks/useResults';
import { DishCard } from '@/components/DishCard';
import { Button } from '@/components/ui/button';
import type { RiskLevel } from '@/lib/types';

const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export function ResultsClient() {
  const { record, loaded } = useResults();

  if (!loaded || !record) {
    return null;
  }

  const sorted = [...record.dishes].sort(
    (a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel],
  );

  const highCount   = sorted.filter((d) => d.riskLevel === 'high').length;
  const mediumCount = sorted.filter((d) => d.riskLevel === 'medium').length;
  const lowCount    = sorted.filter((d) => d.riskLevel === 'low').length;
  const allLow      = highCount === 0 && mediumCount === 0 && sorted.length > 0;
  const noDishes    = sorted.length === 0;

  return (
    <div>
      {/* Sticky summary bar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <p className="text-sm font-medium">
          {sorted.length} {sorted.length === 1 ? 'dish' : 'dishes'}
          {highCount > 0 && (
            <> · <span className="text-red-600">{highCount} High Risk</span></>
          )}
          {mediumCount > 0 && (
            <> · <span className="text-amber-600">{mediumCount} Medium Risk</span></>
          )}
          {lowCount > 0 && (
            <> · <span className="text-green-600">{lowCount} Safe</span></>
          )}
        </p>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Button asChild variant="default">
          <Link href="/scan">Scan Another Menu</Link>
        </Button>

        {noDishes && (
          <p className="text-sm text-muted-foreground">
            No dishes could be identified in this image. Try a clearer photo.
          </p>
        )}

        {allLow && (
          <p className="text-sm font-medium text-green-600">
            Great news — no blacklisted ingredients detected!
          </p>
        )}

        {sorted.map((dish, index) => (
          <DishCard key={index} dish={dish} />
        ))}

        {sorted.length > 0 && (
          <Button asChild variant="default">
            <Link href="/scan">Scan Another Menu</Link>
          </Button>
        )}
      </main>
    </div>
  );
}
