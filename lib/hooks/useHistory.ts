'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  clearHistory,
  deleteRecord,
  getHistory,
  getRecord,
} from '@/lib/db/history';
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
  const { user } = useAuth();
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoaded(true);
      return;
    }
    getHistory(user.id).then((data) => {
      setRecords(data);
      setLoaded(true);
    });
  }, [user]);

  function removeRecord(id: string): void {
    if (!user) return;
    void deleteRecord(user.id, id);
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  function removeAll(): void {
    if (!user) return;
    void clearHistory(user.id);
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
  const { user } = useAuth();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    getRecord(user.id, id).then((found) => {
      if (!found) {
        router.push('/history');
        return;
      }
      setRecord(found);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  return { record, loaded };
}