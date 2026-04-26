'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ScanResultsSection } from '@/components/ScanResultsSection';
import { Button } from '@/components/ui/button';
import { useHistoryRecord } from '@/lib/hooks/useHistory';
import { formatScanDate } from '@/lib/scan-records';

export function HistoryDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { record, loaded } = useHistoryRecord(id);
  const [showBlacklist, setShowBlacklist] = useState(false);

  if (!loaded || !record) {
    return null;
  }

  return (
    <div className="pb-6">
      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-4">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/history">Back to History</Link>
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Scan Details</h1>
          <p className="text-sm text-muted-foreground">{formatScanDate(record.createdAt)}</p>
        </div>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <button
            type="button"
            className="text-sm font-medium underline underline-offset-2"
            aria-expanded={showBlacklist}
            onClick={() => setShowBlacklist((current) => !current)}
          >
            {showBlacklist ? 'Hide saved blacklist' : 'Show saved blacklist'}
          </button>

          {showBlacklist && (
            <div className="mt-3 text-sm text-muted-foreground">
              {record.blacklistSnapshot.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {record.blacklistSnapshot.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="rounded-full border px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No ingredients were saved for this scan.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <ScanResultsSection record={record} stickySummary={false} />
    </div>
  );
}