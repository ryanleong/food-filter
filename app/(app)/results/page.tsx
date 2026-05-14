import type { Metadata } from 'next';
import { ResultsClient } from './components/ResultsClient';

export const metadata: Metadata = {
  title: 'Results | Mind Your Food',
};

export default function ResultsPage() {
  return <ResultsClient />;
}
