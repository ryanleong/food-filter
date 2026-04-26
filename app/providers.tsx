'use client';

import { createContext, useContext } from 'react';
import { useBlacklist, type UseBlacklistReturn } from '@/lib/hooks/useBlacklist';

export const BlacklistContext = createContext<UseBlacklistReturn | null>(null);

export function BlacklistProvider({ children }: { children: React.ReactNode }) {
  const value = useBlacklist();
  return (
    <BlacklistContext.Provider value={value}>
      {children}
    </BlacklistContext.Provider>
  );
}

export function useBlacklistContext(): UseBlacklistReturn {
  const ctx = useContext(BlacklistContext);
  if (!ctx) {
    throw new Error('useBlacklistContext must be used inside <BlacklistProvider>');
  }
  return ctx;
}
