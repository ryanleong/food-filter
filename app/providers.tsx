'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useBlacklist, type UseBlacklistReturn } from '@/lib/hooks/useBlacklist';
import { AuthContext, type UseAuthReturn } from '@/lib/hooks/useAuth';

export { AuthContext };

export const BlacklistContext = createContext<UseBlacklistReturn | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value: UseAuthReturn = { user, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

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
