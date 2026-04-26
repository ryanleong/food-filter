import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBlacklist } from '@/lib/hooks/useBlacklist';
import * as storage from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  getBlacklist: vi.fn(),
  saveBlacklist: vi.fn(),
}));

const mockGetBlacklist = vi.mocked(storage.getBlacklist);
const mockSaveBlacklist = vi.mocked(storage.saveBlacklist);

describe('useBlacklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlacklist.mockReturnValue([]);
  });

  describe('initialization', () => {
    it('hydrates items from getBlacklist() after mount', async () => {
      mockGetBlacklist.mockReturnValue(['nuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      await waitFor(() => {
        expect(result.current.items).toEqual(['nuts', 'dairy']);
      });
    });

    it('initializes to [] when storage is empty', () => {
      mockGetBlacklist.mockReturnValue([]);
      const { result } = renderHook(() => useBlacklist());
      expect(result.current.items).toEqual([]);
    });
  });

  describe('add', () => {
    it('adds a new ingredient', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('peanuts'));
      expect(result.current.items).toContain('peanuts');
    });

    it('trims whitespace before adding', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('  peanuts  '));
      expect(result.current.items).toContain('peanuts');
      expect(result.current.items).not.toContain('  peanuts  ');
    });

    it('lowercases the ingredient before adding', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('Peanuts'));
      expect(result.current.items).toContain('peanuts');
      expect(result.current.items).not.toContain('Peanuts');
    });

    it('silently ignores empty string', () => {
      const { result } = renderHook(() => useBlacklist());
      vi.clearAllMocks(); // clear the initial mount call
      act(() => result.current.add(''));
      expect(result.current.items).toHaveLength(0);
      expect(mockSaveBlacklist).not.toHaveBeenCalled();
    });

    it('silently ignores whitespace-only string', () => {
      const { result } = renderHook(() => useBlacklist());
      vi.clearAllMocks();
      act(() => result.current.add('   '));
      expect(result.current.items).toHaveLength(0);
      expect(mockSaveBlacklist).not.toHaveBeenCalled();
    });

    it('silently ignores exact duplicate', () => {
      const { result } = renderHook(() => useBlacklist());
      act(() => result.current.add('peanuts')); // first add triggers save
      vi.clearAllMocks();
      act(() => result.current.add('peanuts')); // duplicate should NOT trigger save
      expect(result.current.items).toHaveLength(1);
      expect(mockSaveBlacklist).not.toHaveBeenCalled();
    });

    it('deduplicates case-insensitively', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => {
        result.current.add('peanuts');
      });
      act(() => result.current.add('PEANUTS'));
      expect(result.current.items).toHaveLength(1);
    });

    it('calls saveBlacklist with the updated array', () => {
      const { result } = renderHook(() => useBlacklist());
      vi.clearAllMocks(); // clear mount call
      act(() => result.current.add('gluten'));
      expect(mockSaveBlacklist).toHaveBeenCalledWith(['gluten']);
    });
  });

  describe('remove', () => {
    it('removes the matching ingredient', () => {
      mockGetBlacklist.mockReturnValue(['peanuts', 'dairy']);
      const { result } = renderHook(() => useBlacklist());
      act(() => {
        result.current.add('peanuts');
        result.current.add('dairy');
      });
      act(() => result.current.remove('peanuts'));
      expect(result.current.items).not.toContain('peanuts');
      expect(result.current.items).toContain('dairy');
    });

    it('calls saveBlacklist with the filtered array', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      vi.clearAllMocks(); // clear mount call
      act(() => result.current.remove('peanuts'));
      expect(mockSaveBlacklist).toHaveBeenCalledWith([]);
    });

    it('does nothing if item is not in the list', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => {
        result.current.add('peanuts');
      });
      act(() => result.current.remove('gluten'));
      expect(result.current.items).toEqual(['peanuts']);
    });

    it('removes case-insensitively (normalizes input)', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => {
        result.current.add('peanuts');
      });
      act(() => result.current.remove('PEANUTS'));
      expect(result.current.items).not.toContain('peanuts');
      expect(result.current.items).toHaveLength(0);
    });

    it('does not call saveBlacklist when item is not in the list', () => {
      mockGetBlacklist.mockReturnValue(['peanuts']);
      const { result } = renderHook(() => useBlacklist());
      act(() => {
        result.current.add('peanuts');
      });
      vi.clearAllMocks();
      act(() => result.current.remove('gluten'));
      expect(mockSaveBlacklist).not.toHaveBeenCalled();
    });
  });

  it('does not save an empty blacklist before hydration completes', async () => {
    mockGetBlacklist.mockReturnValue(['nuts']);
    renderHook(() => useBlacklist());
    await waitFor(() => {
      expect(mockSaveBlacklist).toHaveBeenCalledWith(['nuts']);
    });
    expect(mockSaveBlacklist).not.toHaveBeenCalledWith([]);
  });
});
