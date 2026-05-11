import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '@/lib/hooks/useHistory';

// ----- DB layer mock -----
const mockGetHistory = vi.hoisted(() => vi.fn());
const mockDeleteRecord = vi.hoisted(() => vi.fn());
const mockClearHistory = vi.hoisted(() => vi.fn());
const mockGetRecord = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db/history', () => ({
  getHistory: mockGetHistory,
  addRecord: vi.fn(),
  deleteRecord: mockDeleteRecord,
  clearHistory: mockClearHistory,
  getRecord: mockGetRecord,
}));

// ----- useAuth mock -----
const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// ----- next/navigation mock -----
const mockPush = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ----- Shared fixtures -----
const MOCK_USER = { id: 'user-1' };

const SCAN_RECORD = {
  id: 'rec-1',
  createdAt: '2024-01-01T00:00:00Z',
  dishes: [],
  blacklistSnapshot: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: MOCK_USER, signOut: vi.fn() });
  mockGetHistory.mockResolvedValue([SCAN_RECORD]);
  mockDeleteRecord.mockResolvedValue(undefined);
  mockClearHistory.mockResolvedValue(undefined);
});

// ----- useHistory -----
describe('useHistory', () => {
  it('fetches history for current user on mount', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(mockGetHistory).toHaveBeenCalledWith('user-1');
    expect(result.current.records).toEqual([SCAN_RECORD]);
  });

  it('returns empty records when user is null', async () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() });

    const { result } = renderHook(() => useHistory());

    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(mockGetHistory).not.toHaveBeenCalled();
    expect(result.current.records).toEqual([]);
  });

  it('removeRecord calls deleteRecord and removes the record from state', async () => {
    const { result } = renderHook(() => useHistory());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.removeRecord('rec-1'));

    expect(mockDeleteRecord).toHaveBeenCalledWith('user-1', 'rec-1');
    expect(result.current.records).toEqual([]);
  });

  it('removeAll calls clearHistory and clears state', async () => {
    const { result } = renderHook(() => useHistory());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.removeAll());

    expect(mockClearHistory).toHaveBeenCalledWith('user-1');
    expect(result.current.records).toEqual([]);
  });

  it('removeRecord does nothing when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() });

    const { result } = renderHook(() => useHistory());
    act(() => result.current.removeRecord('rec-1'));

    expect(mockDeleteRecord).not.toHaveBeenCalled();
  });
});
