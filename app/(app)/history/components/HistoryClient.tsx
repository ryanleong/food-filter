'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useHistory } from '@/lib/hooks/useHistory';
import {
  formatScanDate,
  formatScanDateOnly,
  getHistorySummary,
} from '@/lib/scan-records';

export function HistoryClient() {
  const { records, loaded, removeRecord, removeAll } = useHistory();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  if (!loaded) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Scan History</h1>

        {records.length > 0 && (
          <button
            type="button"
            onClick={() => setClearAllDialogOpen(true)}
            className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Clear All History
          </button>
        )}
      </div>

      <ConfirmDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        title="Clear all scan history?"
        description="This cannot be undone."
        confirmLabel="Confirm Clear History"
        destructive
        onConfirm={() => {
          removeAll();
          setClearAllDialogOpen(false);
        }}
      />

      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Clock className="w-10 h-10 opacity-40" />
          <p className="text-sm">No scans yet. Scan a menu to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const dateOnly = formatScanDateOnly(record.createdAt);
            const isConfirmingDelete = pendingDeleteId === record.id;

            return (
              <section key={record.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-display font-semibold text-sm text-foreground">{formatScanDate(record.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getHistorySummary(record)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/history/${record.id}`}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete scan from ${dateOnly}`}
                      onClick={() => setPendingDeleteId(record.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isConfirmingDelete && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <p className="text-sm">Are you sure?</p>
                    <button
                      type="button"
                      onClick={() => {
                        removeRecord(record.id);
                        setPendingDeleteId(null);
                      }}
                      className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold hover:bg-destructive/90 transition-colors"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
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