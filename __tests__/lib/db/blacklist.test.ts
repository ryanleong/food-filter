import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBlacklist, addItem, removeItem } from '@/lib/db/blacklist';

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}));

describe('lib/db/blacklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBlacklist', () => {
    function setupGetChain(resolvedValue: { data: { ingredient: string }[] | null; error: Error | null }) {
      const mockOrder = vi.fn().mockResolvedValue(resolvedValue);
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });
      return { mockOrder, mockEq, mockSelect };
    }

    it('returns sorted string[] from DB rows', async () => {
      const { mockSelect, mockEq, mockOrder } = setupGetChain({
        data: [{ ingredient: 'dairy' }, { ingredient: 'nuts' }],
        error: null,
      });

      const result = await getBlacklist('user-123');

      expect(mockFrom).toHaveBeenCalledWith('blacklist_items');
      expect(mockSelect).toHaveBeenCalledWith('ingredient');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockOrder).toHaveBeenCalledWith('ingredient', { ascending: true });
      expect(result).toEqual(['dairy', 'nuts']);
    });

    it('returns empty array when no rows', async () => {
      setupGetChain({ data: [], error: null });
      const result = await getBlacklist('user-123');
      expect(result).toEqual([]);
    });

    it('throws on DB error', async () => {
      setupGetChain({ data: null, error: new Error('DB error') });
      await expect(getBlacklist('user-123')).rejects.toThrow('DB error');
    });
  });

  describe('addItem', () => {
    function setupUpsertChain(resolvedValue: { error: Error | null }) {
      const mockUpsert = vi.fn().mockResolvedValue(resolvedValue);
      mockFrom.mockReturnValue({ upsert: mockUpsert });
      return { mockUpsert };
    }

    it('normalizes ingredient and calls upsert', async () => {
      const { mockUpsert } = setupUpsertChain({ error: null });

      await addItem('user-123', '  NUTS  ');

      expect(mockFrom).toHaveBeenCalledWith('blacklist_items');
      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: 'user-123', ingredient: 'nuts' },
        { onConflict: 'user_id,ingredient', ignoreDuplicates: true },
      );
    });

    it('normalizes to lowercase+trim before inserting', async () => {
      const { mockUpsert } = setupUpsertChain({ error: null });

      await addItem('user-123', '  Peanuts  ');

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: 'user-123', ingredient: 'peanuts' },
        expect.any(Object),
      );
    });

    it('does not throw on duplicate (upsert with ignoreDuplicates)', async () => {
      setupUpsertChain({ error: null });
      await expect(addItem('user-123', 'nuts')).resolves.not.toThrow();
    });

    it('throws on unexpected DB error', async () => {
      setupUpsertChain({ error: new Error('unexpected') });
      await expect(addItem('user-123', 'nuts')).rejects.toThrow('unexpected');
    });
  });

  describe('removeItem', () => {
    function setupDeleteChain(resolvedValue: { error: Error | null }) {
      const mockSecondEq = vi.fn().mockResolvedValue(resolvedValue);
      const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockFirstEq });
      mockFrom.mockReturnValue({ delete: mockDelete });
      return { mockDelete, mockFirstEq, mockSecondEq };
    }

    it('calls delete with correct filters', async () => {
      const { mockDelete, mockFirstEq, mockSecondEq } = setupDeleteChain({ error: null });

      await removeItem('user-123', 'nuts');

      expect(mockFrom).toHaveBeenCalledWith('blacklist_items');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockFirstEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSecondEq).toHaveBeenCalledWith('ingredient', 'nuts');
    });

    it('does not throw when item does not exist', async () => {
      setupDeleteChain({ error: null });
      await expect(removeItem('user-123', 'nonexistent')).resolves.not.toThrow();
    });

    it('normalizes ingredient before deleting', async () => {
      const { mockSecondEq } = setupDeleteChain({ error: null });

      await removeItem('user-123', '  NUTS  ');

      expect(mockSecondEq).toHaveBeenCalledWith('ingredient', 'nuts');
    });

    it('throws on unexpected DB error', async () => {
      setupDeleteChain({ error: new Error('delete failed') });
      await expect(removeItem('user-123', 'nuts')).rejects.toThrow('delete failed');
    });
  });
});
