'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearHistory, deleteScanRecord, getHistory } from '@/lib/storage';
import { isScanRecord } from '@/lib/scan-records';
import type { ScanRecord } from '@/lib/types';

export interface UseHistoryReturn {
  records: ScanRecord[];
  loaded: boolean;
  removeRecord: (id: string) => void;
  removeAll: () => void;
}

export interface UseHistoryRecordReturn {
  record: ScanRecord | null;
  loaded: boolean;
}

export function useHistory(): UseHistoryReturn {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRecords(getHistory().filter((record) => isScanRecord(record)));
    setLoaded(true);
  }, []);

  function removeRecord(id: string): void {
    deleteScanRecord(id);
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  function removeAll(): void {
    clearHistory();
    setRecords([]);
  }

  return {
    records,
    loaded,
    removeRecord,
    removeAll,
  };
}

export function useHistoryRecord(id: string): UseHistoryRecordReturn {
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const foundRecord = getHistory()
      .filter((entry) => isScanRecord(entry))
      .find((entry) => entry.id === id);

    if (!foundRecord) {
      router.push('/history');
      return;
    }

    setRecord(foundRecord);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { record, loaded };
}