'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ScanLine } from 'lucide-react';
import { getBlacklist } from '@/lib/db/blacklist';
import { getHistory } from '@/lib/db/history';
import { useAuth } from '@/lib/hooks/useAuth';
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
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [recentRecord, setRecentRecord] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [blacklist, history] = await Promise.all([
        getBlacklist(user!.id),
        getHistory(user!.id),
      ]);
      setBlacklistCount(blacklist.length);
      setTotalScans(history.length);
      setRecentRecord(history.length > 0 ? history[0] : null);
      setLoaded(true);
    }

    load();
  }, [user]);

  if (!loaded) return null;

  const blacklistEmpty = blacklistCount === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary text-secondary-foreground rounded-xl px-4 py-4 flex flex-col gap-2">
          <ShieldCheck className="w-5 h-5 opacity-70" />
          <span className="font-display text-3xl font-bold leading-none">{blacklistCount}</span>
          <span className="text-xs text-muted-foreground font-sans">ingredients blocked</span>
        </div>
        <div className="bg-secondary text-secondary-foreground rounded-xl px-4 py-4 flex flex-col gap-2">
          <ScanLine className="w-5 h-5 opacity-70" />
          <span className="font-display text-3xl font-bold leading-none">{totalScans}</span>
          <span className="text-xs text-muted-foreground font-sans">total scans</span>
        </div>
      </div>

      {/* Empty blacklist nudge */}
      {blacklistEmpty && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-sans">
          Start by adding ingredients you want to avoid.{' '}
          <Link href="/ingredients" className="font-semibold underline underline-offset-4">
            Manage Ingredients
          </Link>
        </div>
      )}

      {/* Recent scan card */}
      {recentRecord && (
        <div className="bg-card border border-border rounded-xl px-4 py-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-sans font-medium uppercase tracking-wide">
              Latest Scan
            </p>
            <p className="font-display font-semibold text-base text-foreground">
              {formatDate(recentRecord.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              {formatSummary(recentRecord.dishes)}
            </p>
          </div>
          <Link
            href={`/history/${recentRecord.id}`}
            className="shrink-0 text-sm font-medium text-primary font-sans"
          >
            View
          </Link>
        </div>
      )}
    </div>
  );
}
