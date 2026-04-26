import type { ReactNode } from 'react';
import { DishCard } from '@/components/DishCard';
import { cn } from '@/lib/utils';
import {
  getRiskSummary,
  sortDishesByRisk,
} from '@/lib/scan-records';
import type { ScanRecord } from '@/lib/types';

interface ScanResultsSectionProps {
  record: ScanRecord;
  topAction?: ReactNode;
  bottomAction?: ReactNode;
  stickySummary?: boolean;
}

export function ScanResultsSection({
  record,
  topAction,
  bottomAction,
  stickySummary = true,
}: ScanResultsSectionProps) {
  const sortedDishes = sortDishesByRisk(record.dishes);
  const { totalCount, highCount, mediumCount, lowCount, allLow, noDishes } = getRiskSummary(sortedDishes);

  return (
    <div>
      <div
        className={cn(
          'border-b bg-background/95 px-4 py-3',
          stickySummary && 'sticky top-0 z-10 backdrop-blur-sm',
        )}
      >
        <p className="text-sm font-medium">
          {totalCount} {totalCount === 1 ? 'dish' : 'dishes'}
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

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {topAction}

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

        {sortedDishes.map((dish, index) => (
          <DishCard key={`${dish.name}-${index}`} dish={dish} />
        ))}

        {sortedDishes.length > 0 && bottomAction}
      </div>
    </div>
  );
}