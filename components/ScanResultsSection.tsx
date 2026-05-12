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
}

export function ScanResultsSection({
  record,
  topAction,
  bottomAction,
}: ScanResultsSectionProps) {
  const sortedDishes = sortDishesByRisk(record.dishes);
  const { totalCount, highCount, mediumCount, lowCount, allLow, noDishes } = getRiskSummary(sortedDishes);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      {/* Stat card summary */}
      {!noDishes && (
        <div className="flex flex-wrap gap-2">
          <StatCard value={totalCount} label={totalCount === 1 ? 'dish' : 'dishes'} />
          {highCount > 0 && (
            <StatCard
              value={highCount}
              label="High Risk"
              className="border-red-200 bg-red-50"
              valueClassName="text-red-600"
              labelClassName="text-red-400"
            />
          )}
          {mediumCount > 0 && (
            <StatCard
              value={mediumCount}
              label="Medium"
              className="border-amber-200 bg-amber-50"
              valueClassName="text-amber-600"
              labelClassName="text-amber-400"
            />
          )}
          {lowCount > 0 && (
            <StatCard
              value={lowCount}
              label="Safe"
              className="border-green-200 bg-green-50"
              valueClassName="text-green-600"
              labelClassName="text-green-500"
            />
          )}
        </div>
      )}

      {topAction}

      {noDishes && (
        <p className="text-sm text-muted-foreground">
          No dishes could be identified in this image. Try a clearer photo.
        </p>
      )}

      {allLow && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-700">
            All clear — no blacklisted ingredients detected!
          </p>
        </div>
      )}

      {sortedDishes.map((dish, index) => (
        <DishCard key={`${dish.name}-${index}`} dish={dish} />
      ))}

      {sortedDishes.length > 0 && bottomAction}
    </div>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

function StatCard({ value, label, className, valueClassName, labelClassName }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-border bg-card px-5 py-3 min-w-[76px]',
        className,
      )}
    >
      <span className={cn('text-2xl font-bold font-display leading-none text-foreground', valueClassName)}>
        {value}
      </span>
      <span className={cn('text-[11px] uppercase tracking-widest mt-1 text-muted-foreground', labelClassName)}>
        {label}
      </span>
    </div>
  );
}