import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HistoryDetailClient } from './components/HistoryDetailClient';

export const metadata: Metadata = {
  title: 'History | Mind Your Food',
};

export default function HistoryDetailPage() {
  return (
    <Suspense>
      <HistoryDetailClient />
    </Suspense>
  );
}