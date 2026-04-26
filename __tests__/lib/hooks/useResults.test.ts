import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useResults, SESSION_KEY } from '@/lib/hooks/useResults';
import type { ScanRecord } from '@/lib/types';

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter, // stable reference — avoids infinite re-render from [router] dep
}));

const VALID_RECORD: ScanRecord = {
  id: 'abc-123',
  createdAt: '2026-04-26T12:00:00.000Z',
  dishes: [
    {
      name: 'Pad Thai',
      riskLevel: 'high',
      blacklistedFound: ['peanuts'],
      allIngredients: ['peanuts', 'noodles'],
      source: 'both',
    },
  ],
  blacklistSnapshot: ['peanuts'],
};

describe('useResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('returns the expected shape with loaded and record properties', () => {
    const { result } = renderHook(() => useResults());
    expect(result.current).toHaveProperty('loaded');
    expect(result.current).toHaveProperty('record');
  });

  it('sets record and loaded=true when sessionStorage has valid data', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(VALID_RECORD));
    const { result } = renderHook(() => useResults());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.record).toEqual(VALID_RECORD);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to /scan when the sessionStorage key is missing', async () => {
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when sessionStorage value is malformed JSON', async () => {
    sessionStorage.setItem(SESSION_KEY, 'not-valid-json{{{');
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when the parsed object has no dishes field', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: 'abc', createdAt: '2026-01-01' }));
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when dishes is not an array', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: 'abc', dishes: 'not-an-array' }));
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when id is missing', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ dishes: [], blacklistSnapshot: [] }));
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when blacklistSnapshot is not an array', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: 'abc', dishes: [], blacklistSnapshot: 'bad' }));
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });

  it('redirects to /scan when createdAt is missing', async () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: 'abc', dishes: [], blacklistSnapshot: [] })
    );
    renderHook(() => useResults());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/scan'));
  });
});
