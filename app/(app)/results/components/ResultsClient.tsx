'use client';

import Link from 'next/link';
import { useResults } from '@/lib/hooks/useResults';
import { ScanResultsSection } from '@/components/ScanResultsSection';

export function ResultsClient() {
  const { record, loaded } = useResults();

  if (!loaded || !record) {
    return null;
  }

  const scanButton = (
    <Link
      href="/scan"
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
    >
      Scan Another Menu
    </Link>
  );

  return (
    <ScanResultsSection
      record={record}
      topAction={scanButton}
      bottomAction={scanButton}
    />
  );
}
