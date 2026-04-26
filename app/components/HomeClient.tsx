'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlacklist, getHistory } from '@/lib/storage';
import type { ScanRecord } from '@/lib/types';

/** Formats a dish summary line, e.g. "5 dishes · 2 High · 1 Medium · 2 Safe" */
function formatSummary(dishes: ScanRecord['dishes']): string {
  const high = dishes.filter((d) => d.riskLevel === 'high').length;
  const medium = dishes.filter((d) => d.riskLevel === 'medium').length;
  const low = dishes.filter((d) => d.riskLevel === 'low').length;
  return `${dishes.length} dishes · ${high} High · ${medium} Medium · ${low} Safe`;
}

/** Formats an ISO timestamp to a human-readable string, e.g. "Apr 25, 2026 · 14:32" */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${date} · ${time}`;
}

export default function HomeClient() {
  const [loaded, setLoaded] = useState(false);
  const [blacklistEmpty, setBlacklistEmpty] = useState(false);
  const [recentRecord, setRecentRecord] = useState<ScanRecord | null>(null);

  useEffect(() => {
    const blacklist = getBlacklist();
    const history = getHistory();
    setBlacklistEmpty(blacklist.length === 0);
    setRecentRecord(history.length > 0 ? history[0] : null);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="flex flex-col gap-4">
      {blacklistEmpty && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          Start by adding ingredients you want to avoid.{' '}
          <Link href="/ingredients" className="font-medium underline underline-offset-4">
            Manage Ingredients
          </Link>
        </div>
      )}

      {recentRecord && (
        <div className="rounded-lg border px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Recent Scan
            </p>
            <p className="text-sm font-medium">{formatDate(recentRecord.createdAt)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatSummary(recentRecord.dishes)}
            </p>
          </div>
          <Link
            href={`/history/${recentRecord.id}`}
            className="shrink-0 text-sm font-medium underline underline-offset-4"
          >
            View
          </Link>
        </div>
      )}
    </div>
  );
}
