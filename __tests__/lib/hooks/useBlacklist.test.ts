import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBlacklist } from '@/lib/hooks/useBlacklist';

const mockGetBlacklist = vi.hoisted(() => vi.fn<() => Promise<string[]>>());
const mockAddItem = vi.hoisted(() => vi.fn<() => Promise<void>>());
const mockRemoveItem = vi.hoisted(() => vi.fn<() => Promise<void>>());

vi.mock('@/lib/db/blacklist', () => ({
  getBlacklist: mockGetBlacklist,
  addItem: mockAddItem,
  removeItem: mockRemoveItem,
}));

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

const fakeUser = { id: 'user-123' };

describe('useBlacklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlacklist.mockResolvedValue([]);
    mockAddItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ user: fakeUser, signOut: vi.fn() });
  });

  describe('initialization', () => {
    it('hydrates items from getBlacklist() after mount', async () => {
      mockGetBlacklist.mockResolvedValue(['nuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => {
        expect(result.current.items).toEqual(['nuts', 'dairy']);
      });
      expect(mockGetBlacklist).toHaveBeenCalledWith('user-123');
    });

    it('initializes to [] when DB returns empty array', async () => {
      mockGetBlacklist.mockResolvedValue([]);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.items).toEqual([]);
    });

    it('loading is true during initial fetch, false after', async () => {
      let resolve: (v: string[]) => void;
      mockGetBlacklist.mockReturnValue(new Promise((res) => { resolve = res; }));
      const { result } = renderHook(() => useBlacklist());
      expect(result.current.loading).toBe(true);
      act(() => resolve!([]));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('add', () => {
    it('normalizes and calls addItem', async () => {
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => result.current.add('  PEANUTS  '));
      expect(mockAddItem).toHaveBeenCalledWith('user-123', 'peanuts');
    });

    it('optimistically updates state before DB call resolves', async () => {
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.loading).toBe(false));
      act(() => result.current.add('peanuts'));
      expect(result.current.items).toContain('peanuts');
    });

    it('reverts optimistic update on DB error', async () => {
      mockAddItem.mockRejectedValue(new Error('DB error'));
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => result.current.add('peanuts'));
      await waitFor(() => expect(result.current.items).not.toContain('peanuts'));
    });

    it('silently ignores empty string', async () => {
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.loading).toBe(false));
      act(() => result.current.add(''));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('silently ignores whitespace-only string', async () => {
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.loading).toBe(false));
      act(() => result.current.add('   '));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('silently ignores exact duplicate', async () => {
      mockGetBlacklist.mockResolvedValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.items).toContain('peanuts'));
      vi.clearAllMocks();
      act(() => result.current.add('peanuts'));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('deduplicates case-insensitively', async () => {
      mockGetBlacklist.mockResolvedValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.items).toContain('peanuts'));
      act(() => result.current.add('PEANUTS'));
      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('calls removeItem with normalized ingredient', async () => {
      mockGetBlacklist.mockResolvedValue(['peanuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.items).toContain('peanuts'));
      await act(async () => result.current.remove('PEANUTS'));
      expect(mockRemoveItem).toHaveBeenCalledWith('user-123', 'peanuts');
    });

    it('optimistically removes from state', async () => {
      mockGetBlacklist.mockResolvedValue(['peanuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.items).toContain('peanuts'));
      act(() => result.current.remove('peanuts'));
      expect(result.current.items).not.toContain('peanuts');
      expect(result.current.items).toContain('dairy');
    });

    it('does nothing if item is not in the list', async () => {
      mockGetBlacklist.mockResolvedValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.items).toContain('peanuts'));
      act(() => result.current.remove('gluten'));
      expect(result.current.items).toEqual(['peanuts']);
    });

    it('removes case-insensitively (normalizes input)', async () => {
      mockGetBlacklist.mockResolvedValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => expect(result.current.items).toContain('peanuts'));
      act(() => result.current.remove('PEANUTS'));
      expect(result.current.items).not.toContain('peanuts');
    });
  });

  describe('when user is null', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, signOut: vi.fn() });
    });

    it('returns empty items', () => {
      const { result } = renderHook(() => useBlacklist());
      expect(result.current.items).toEqual([]);
    });

    it('does not call getBlacklist', () => {
      renderHook(() => useBlacklist());
      expect(mockGetBlacklist).not.toHaveBeenCalled();
    });

    it('add is a no-op (does not call addItem)', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('peanuts'));
      expect(mockAddItem).not.toHaveBeenCalled();
      expect(result.current.items).toEqual([]);
    });

    it('remove is a no-op (does not call removeItem)', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.remove('peanuts'));
      expect(mockRemoveItem).not.toHaveBeenCalled();
    });
  });
});
