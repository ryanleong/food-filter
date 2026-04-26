import type { Metadata } from 'next';
import { HistoryClient } from '@/app/history/components/HistoryClient';

export const metadata: Metadata = {
  title: 'History | FoodFilter',
};

export default function HistoryPage() {
  return <HistoryClient />;
}