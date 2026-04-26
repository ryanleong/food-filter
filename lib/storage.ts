import type { ScanRecord } from './types';

const BLACKLIST_KEY = 'foodfilter_blacklist';
const HISTORY_KEY = 'foodfilter_history';

/** Returns false in SSR environments where localStorage is unavailable. */
export function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Dispatches a custom DOM event so the StorageBanner can react to write failures. */
function notifyStorageError(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('foodfilter:storage-error'));
  }
}

export function getBlacklist(): string[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(BLACKLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[storage] Failed to parse blacklist from localStorage');
    return [];
  }
}

export function saveBlacklist(items: string[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify(items));
  } catch {
    console.warn('[storage] Failed to save blacklist to localStorage');
    notifyStorageError();
  }
}

export function getHistory(): ScanRecord[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[storage] Failed to parse history from localStorage');
    return [];
  }
}

// Prepends the new record so the array is always newest-first
export function addScanRecord(record: ScanRecord): void {
  if (!isStorageAvailable()) return;
  const history = getHistory();
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
  } catch {
    console.warn('[storage] Failed to save history to localStorage');
    notifyStorageError();
  }
}

export function deleteScanRecord(id: string): void {
  if (!isStorageAvailable()) return;
  const history = getHistory();
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.filter((r) => r.id !== id))
    );
  } catch {
    console.warn('[storage] Failed to save history to localStorage');
    notifyStorageError();
  }
}

export function clearHistory(): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    console.warn('[storage] Failed to clear history from localStorage');
    notifyStorageError();
  }
}
