import type { Metadata } from 'next';
import { ResultsClient } from './components/ResultsClient';

export const metadata: Metadata = {
  title: 'Results | FoodFilter',
};

export default function ResultsPage() {
  return <ResultsClient />;
}
