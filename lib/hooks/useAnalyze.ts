'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image';
import { addScanRecord } from '@/lib/storage';
import type { ScanRecord } from '@/lib/types';

export type AnalyzeStatus = 'idle' | 'loading' | 'error';

export interface UseAnalyzeReturn {
  status: AnalyzeStatus;
  error: string | null;
  analyze: (file: File, blacklist: string[]) => Promise<void>;
  reset: () => void;
}

function mapError(status?: number): string {
  if (status === 400) {
    return 'Invalid request. Please re-select your image and try again.';
  }
  if (status === 503) {
    return 'AI service quota exceeded. Please wait a moment and try again.';
  }
  if (status !== undefined) {
    // 500 or any other non-OK status
    return 'Analysis failed. Please try again.';
  }
  // Network-level failure (fetch threw)
  return 'Could not reach the analysis service. Check your connection and try again.';
}

export function useAnalyze(): UseAnalyzeReturn {
  const router = useRouter();
  const [status, setStatus] = useState<AnalyzeStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File, blacklist: string[]): Promise<void> {
    setStatus('loading');
    setError(null);

    try {
      // Step 1: Compress image to ≤ 1 MB JPEG
      const compressed = await compressImage(file);

      // Step 2: Build multipart form data
      const body = new FormData();
      body.append('image', compressed, 'menu.jpg');
      body.append('blacklist', JSON.stringify(blacklist));

      // Step 3: Call the server proxy
      const response = await fetch('/api/analyze', { method: 'POST', body });

      if (!response.ok) {
        setError(mapError(response.status));
        setStatus('error');
        return;
      }

      const json = (await response.json()) as { dishes: ScanRecord['dishes'] };

      // Step 4: Build and persist the scan record
      const record: ScanRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        dishes: json.dishes,
        blacklistSnapshot: [...blacklist],
      };

      // Persist to localStorage history (fire-and-forget; storage.ts handles errors)
      addScanRecord(record);

      // Write to sessionStorage for the results page handoff
      try {
        sessionStorage.setItem('foodfilter_current_scan', JSON.stringify(record));
      } catch {
        // sessionStorage unavailable (private browsing quota reached) — navigate anyway
        console.warn('[useAnalyze] Failed to write to sessionStorage');
      }

      // Step 5: Navigate to results
      router.push('/results');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // True network failure — fetch itself threw
        setError('Could not reach the analysis service. Check your connection and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStatus('error');
    }
  }

  function reset(): void {
    setStatus('idle');
    setError(null);
  }

  return { status, error, analyze, reset };
}
