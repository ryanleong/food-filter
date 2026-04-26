'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useHistory } from '@/lib/hooks/useHistory';
import {
  formatScanDate,
  formatScanDateOnly,
  getHistorySummary,
} from '@/lib/scan-records';

export function HistoryClient() {
  const { records, loaded, removeRecord, removeAll } = useHistory();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (!loaded) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Scan History</h1>

        {records.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Clear All History</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all scan history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={removeAll}>
                  Confirm Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No scans yet. Scan a menu to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const dateOnly = formatScanDateOnly(record.createdAt);
            const isConfirmingDelete = pendingDeleteId === record.id;

            return (
              <section key={record.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{formatScanDate(record.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getHistorySummary(record)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                      <Link href={`/history/${record.id}`}>View</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete scan from ${dateOnly}`}
                      onClick={() => setPendingDeleteId(record.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {isConfirmingDelete && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                    <p className="text-sm">Are you sure?</p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        removeRecord(record.id);
                        setPendingDeleteId(null);
                      }}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}