'use client';

import Link from 'next/link';
import { useResults } from '@/lib/hooks/useResults';
import { ScanResultsSection } from '@/components/ScanResultsSection';
import { Button } from '@/components/ui/button';

export function ResultsClient() {
  const { record, loaded } = useResults();

  if (!loaded || !record) {
    return null;
  }

  return (
    <ScanResultsSection
      record={record}
      topAction={
        <Button asChild variant="default">
          <Link href="/scan">Scan Another Menu</Link>
        </Button>
      }
      bottomAction={
        <Button asChild variant="default">
          <Link href="/scan">Scan Another Menu</Link>
        </Button>
      }
    />
  );
}
