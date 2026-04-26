import type { Metadata } from 'next';
import { HistoryDetailClient } from '@/app/history/[id]/components/HistoryDetailClient';

export const metadata: Metadata = {
  title: 'History Details | FoodFilter',
};

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <HistoryDetailClient id={id} />;
}