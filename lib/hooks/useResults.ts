'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScanRecord } from '@/lib/types';

export const SESSION_KEY = 'foodfilter_current_scan';

export interface UseResultsReturn {
  record: ScanRecord | null;
  loaded: boolean;
}

export function useResults(): UseResultsReturn {
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      router.push('/scan');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.push('/scan');
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null
    ) {
      router.push('/scan');
      return;
    }

    const obj = parsed as Record<string, unknown>;

    if (
      !Array.isArray(obj.dishes) ||
      typeof obj.id !== 'string' ||
      !Array.isArray(obj.blacklistSnapshot)
    ) {
      router.push('/scan');
      return;
    }

    setRecord(parsed as ScanRecord);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { record, loaded };
}
