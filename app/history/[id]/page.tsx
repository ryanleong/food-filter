import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HistoryDetailClient } from '@/app/history/[id]/components/HistoryDetailClient';

export const metadata: Metadata = {
  title: 'History Details | FoodFilter',
};

export default function HistoryDetailPage() {
  return (
    <Suspense>
      <HistoryDetailClient />
    </Suspense>
  );
}