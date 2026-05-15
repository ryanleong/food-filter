import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canAnalyze } from '@/lib/subscription-guard';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { ScanInput } from '@/components/ScanInput';

export const metadata: Metadata = {
  title: 'Scan | Mind Your Food',
  description: 'Capture or upload a menu photo to prepare it for ingredient analysis.',
};

// Async inner component — all dynamic data access lives here, inside a Suspense boundary.
async function ScanContent({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [params, result] = await Promise.all([searchParams, canAnalyze(user.id)]);

  if (!result.allowed) {
    return <SubscriptionGate reason={result.reason} resetAt={result.resetAt} />;
  }

  return (
    <div className="flex flex-col gap-8">
      {params.checkout === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Subscription active! You now have 200 scans available.
        </div>
      )}
      <div>
        <h1 className="font-display text-3xl font-semibold">Scan a Menu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture a fresh photo or upload an existing menu image before running analysis.
        </p>
      </div>
      <ScanInput />
    </div>
  );
}

// Sync outer component — statically renderable shell with Suspense wrapping the dynamic content.
export default function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
          <ScanContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
