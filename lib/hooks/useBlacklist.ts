'use client';

import { useEffect, useState } from 'react';
import { getBlacklist, saveBlacklist } from '@/lib/storage';

export interface UseBlacklistReturn {
  items: string[];
  add: (raw: string) => void;
  remove: (name: string) => void;
}

export function useBlacklist(): UseBlacklistReturn {
  const [items, setItems] = useState<string[]>(() => getBlacklist());

  // Sync to localStorage whenever items change (pure updater pattern — no side effects in setItems)
  useEffect(() => {
    saveBlacklist(items);
  }, [items]);

  function add(raw: string): void {
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    setItems((prev) => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized];
    });
  }

  function remove(name: string): void {
    const normalized = name.trim().toLowerCase();
    setItems((prev) => {
      const updated = prev.filter((item) => item !== normalized);
      // Return prev unchanged if item wasn't in the list (avoids spurious re-renders + saves)
      if (updated.length === prev.length) return prev;
      return updated;
    });
  }

  return { items, add, remove };
}
