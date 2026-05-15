'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  reason: 'no-subscription' | 'quota-exhausted';
  resetAt?: Date | null;
}

export function SubscriptionGate({ reason, resetAt }: SubscriptionGateProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubscribe() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = (await response.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }

  const formattedResetDate = resetAt
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(resetAt instanceof Date ? resetAt : new Date(resetAt))
    : null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-8 flex flex-col items-center text-center gap-4">
      {reason === 'no-subscription' ? (
        <>
          <h2 className="font-display text-2xl font-semibold">Subscribe to analyze menus</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Get 200 menu scans per month for $3/month.
          </p>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isLoading}
            className="mt-2 inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Subscribe for $3/month
          </button>
        </>
      ) : (
        <>
          <h2 className="font-display text-2xl font-semibold">
            You&apos;ve used all 200 scans this period
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            {formattedResetDate
              ? `Your quota resets on ${formattedResetDate}.`
              : 'Your quota resets at the start of your next billing period.'}
          </p>
        </>
      )}
    </div>
  );
}
