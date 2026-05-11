'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface UseAuthReturn {
  user: User | null;
  signOut: () => Promise<void>;
}

/**
 * Context populated by AuthProvider in app/providers.tsx.
 * Exported here so providers.tsx can import it without a circular dependency.
 */
export const AuthContext = createContext<UseAuthReturn | null>(null);

/** Read auth state from the nearest AuthProvider. Throws if used outside one. */
export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
