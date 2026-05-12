import type { Metadata } from 'next';
import { ScanInput } from '@/components/ScanInput';

export const metadata: Metadata = {
  title: 'Scan a Menu | FoodFilter',
  description: 'Capture or upload a menu photo to prepare it for ingredient analysis.',
};

export default function ScanPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-display text-3xl font-semibold">Scan a Menu</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture a fresh photo or upload an existing menu image before running analysis.
            </p>
          </div>
          <ScanInput />
        </div>
      </div>
    </main>
  );
}