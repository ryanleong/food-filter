'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ScanRecord } from '@/lib/types';

const SESSION_KEY = 'foodfilter_current_scan';

const RISK_LABELS: Record<string, string> = {
  high: '🔴 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
};

export function ResultsClient() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [record, setRecord] = useState<ScanRecord | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      router.push('/scan');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.push('/scan');
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('dishes' in parsed) ||
      !Array.isArray((parsed as Record<string, unknown>).dishes)
    ) {
      router.push('/scan');
      return;
    }

    setRecord(parsed as ScanRecord);
    setLoaded(true);
  }, [router]);

  if (!loaded || !record) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Results</h1>

      <p className="mb-4 text-muted-foreground">{record.dishes.length} dishes analyzed</p>

      <ul className="mb-8 space-y-2">
        {record.dishes.map((dish, index) => (
          <li
            key={index}
            className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
          >
            <span className="font-medium">{dish.name}</span>
            <span>{RISK_LABELS[dish.riskLevel] ?? dish.riskLevel}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/scan"
        className="text-sm font-medium underline underline-offset-4"
      >
        Scan Another Menu
      </Link>
    </main>
  );
}
