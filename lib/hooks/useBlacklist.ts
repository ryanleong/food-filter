'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getBlacklist, addItem, removeItem } from '@/lib/db/blacklist';

export interface UseBlacklistReturn {
  items: string[];
  add: (raw: string) => void;
  remove: (name: string) => void;
  loading: boolean;
}

export function useBlacklist(): UseBlacklistReturn {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    getBlacklist(user.id)
      .then(setItems)
      .catch((err) => console.warn('Failed to load blacklist:', err))
      .finally(() => setLoading(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function add(raw: string): void {
    if (!user) return;
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    // Bail early if already present — no DB call needed
    if (items.includes(normalized)) return;
    // Optimistic update
    setItems((prev) => [...prev, normalized]);
    addItem(user.id, normalized).catch((err) => {
      console.warn('Failed to add item:', err);
      // Revert optimistic update on error
      setItems((prev) => prev.filter((item) => item !== normalized));
    });
  }

  function remove(name: string): void {
    if (!user) return;
    const normalized = name.trim().toLowerCase();
    const snapshot = items;
    // Optimistic update
    setItems((current) => current.filter((item) => item !== normalized));
    removeItem(user.id, normalized).catch((err) => {
      console.warn('Failed to remove item:', err);
      // Revert optimistic update on error
      setItems(snapshot);
    });
  }

  return { items, add, remove, loading };
}
