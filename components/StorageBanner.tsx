'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { isStorageAvailable } from '@/lib/storage';

export function StorageBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isStorageAvailable()) {
      setVisible(true);
      return;
    }

    function handleStorageError() {
      setVisible(true);
    }

    window.addEventListener('foodfilter:storage-error', handleStorageError);
    return () => window.removeEventListener('foodfilter:storage-error', handleStorageError);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p>Your data cannot be saved in this browser session.</p>
      <button
        type="button"
        aria-label="Dismiss storage warning"
        onClick={() => setVisible(false)}
        className="shrink-0 rounded text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
