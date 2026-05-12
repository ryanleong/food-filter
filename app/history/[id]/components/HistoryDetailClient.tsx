'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ScanResultsSection } from '@/components/ScanResultsSection';
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
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to History
        </Link>

        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold">Scan Details</h1>
          <p className="text-sm text-muted-foreground">{formatScanDate(record.createdAt)}</p>
        </div>

        <section className="bg-card border border-border rounded-xl p-4">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            aria-expanded={showBlacklist}
            onClick={() => setShowBlacklist((current) => !current)}
          >
            {showBlacklist ? 'Hide saved blacklist' : 'Show saved blacklist'}
          </button>

          {showBlacklist && (
            <div className="mt-3">
              {record.blacklistSnapshot.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {record.blacklistSnapshot.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No ingredients were saved for this scan.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <ScanResultsSection record={record} />
    </div>
  );
}