'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image';
import { analyzeMenu as analyzeMenuAction } from '@/lib/actions/analyze';

export type AnalyzeStatus = 'idle' | 'loading' | 'error';

export interface UseAnalyzeReturn {
  status: AnalyzeStatus;
  error: string | null;
  /** Resolves `true` on success, `false` on any error. */
  analyze: (file: File, blacklist: string[]) => Promise<boolean>;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const router = useRouter();
  const [status, setStatus] = useState<AnalyzeStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File, blacklist: string[]): Promise<boolean> {
    setStatus('loading');
    setError(null);

    try {
      // Step 1: Compress image to ≤ 1 MB JPEG
      const compressed = await compressImage(file);

      // Step 2: Build multipart form data
      const body = new FormData();
      body.append('image', compressed, 'menu.jpg');
      body.append('blacklist', JSON.stringify(blacklist));

      // Step 3: Call the Server Action
      const result = await analyzeMenuAction(body);

      if (!result.success) {
        setError(result.error);
        setStatus('error');
        return false;
      }

      // Step 4: Write to sessionStorage for the results page handoff
      try {
        sessionStorage.setItem('foodfilter_current_scan', JSON.stringify(result.record));
      } catch {
        // sessionStorage unavailable (private browsing quota reached) — navigate anyway
        console.warn('[useAnalyze] Failed to write to sessionStorage');
      }

      // Step 5: Navigate to results, then reset so the router cache doesn't
      // preserve the 'loading' state when the user returns to /scan.
      router.push('/results');
      setStatus('idle');
      setError(null);
      return true;
    } catch {
      // Unexpected error (e.g. compressImage failure)
      setError('Something went wrong. Please try again.');
      setStatus('error');
      return false;
    }
  }

  function reset(): void {
    setStatus('idle');
    setError(null);
  }

  return { status, error, analyze, reset };
}
