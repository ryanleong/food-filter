import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHistory,
  getRecord,
  addRecord,
  deleteRecord,
  clearHistory,
} from '@/lib/db/history';

// ----- Supabase client mock -----
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}));

// Builds a fluent Supabase query builder chain that resolves to `result`.
// Every chainable method returns `chain` itself; the chain is thenable so
// `await chain.someMethod()` resolves with `result`.
function buildChain(result: { data?: unknown; error?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const m of [
    'select',
    'eq',
    'order',
    'insert',
    'delete',
    'single',
    'maybeSingle',
    'update',
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make the chain a thenable so `await chain` (and `await chain.method()`)
  // resolves with `result`.
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

// ----- Shared fixtures -----
const DB_ROW = {
  id: 'rec-1',
  created_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1',
  dishes: [
    {
      name: 'Pasta',
      riskLevel: 'low' as const,
      blacklistedFound: [],
      allIngredients: ['pasta'],
      source: 'menu' as const,
    },
  ],
  blacklist_snapshot: ['peanuts'],
};

const SCAN_RECORD = {
  id: 'rec-1',
  createdAt: '2024-01-01T00:00:00Z',
  dishes: DB_ROW.dishes,
  blacklistSnapshot: ['peanuts'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ----- getHistory -----
describe('getHistory', () => {
  it('returns records sorted by created_at desc, mapped to ScanRecord', async () => {
    const chain = buildChain({ data: [DB_ROW], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getHistory('user-1');

    expect(mockFrom).toHaveBeenCalledWith('scan_records');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual([SCAN_RECORD]);
  });

  it('throws on Supabase error', async () => {
    const chain = buildChain({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(chain);

    await expect(getHistory('user-1')).rejects.toThrow('DB error');
  });
});

// ----- getRecord -----
describe('getRecord', () => {
  it('returns a single record mapped to ScanRecord', async () => {
    const chain = buildChain({ data: DB_ROW, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getRecord('user-1', 'rec-1');

    expect(chain.eq).toHaveBeenCalledWith('id', 'rec-1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(chain.maybeSingle).toHaveBeenCalled();
    expect(result).toEqual(SCAN_RECORD);
  });

  it('returns null when record not found', async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getRecord('user-1', 'missing');

    expect(result).toBeNull();
  });

  it('throws on Supabase error', async () => {
    const chain = buildChain({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(chain);

    await expect(getRecord('user-1', 'rec-1')).rejects.toThrow('DB error');
  });
});

// ----- addRecord -----
describe('addRecord', () => {
  it('inserts and returns saved record with DB-generated id and created_at', async () => {
    const chain = buildChain({ data: DB_ROW, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await addRecord('user-1', {
      dishes: DB_ROW.dishes,
      blacklistSnapshot: ['peanuts'],
    });

    expect(chain.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      dishes: DB_ROW.dishes,
      blacklist_snapshot: ['peanuts'],
    });
    expect(chain.select).toHaveBeenCalled();
    expect(chain.single).toHaveBeenCalled();
    expect(result).toEqual(SCAN_RECORD);
  });

  it('throws on Supabase error', async () => {
    const chain = buildChain({ data: null, error: { message: 'Insert failed' } });
    mockFrom.mockReturnValue(chain);

    await expect(
      addRecord('user-1', { dishes: [], blacklistSnapshot: [] }),
    ).rejects.toThrow('Insert failed');
  });
});

// ----- deleteRecord -----
describe('deleteRecord', () => {
  it('calls delete with correct userId and recordId', async () => {
    const chain = buildChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await deleteRecord('user-1', 'rec-1');

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'rec-1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on Supabase error', async () => {
    const chain = buildChain({ error: { message: 'Delete failed' } });
    mockFrom.mockReturnValue(chain);

    await expect(deleteRecord('user-1', 'rec-1')).rejects.toThrow('Delete failed');
  });
});

// ----- clearHistory -----
describe('clearHistory', () => {
  it('deletes all records for user', async () => {
    const chain = buildChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await clearHistory('user-1');

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws on Supabase error', async () => {
    const chain = buildChain({ error: { message: 'Clear failed' } });
    mockFrom.mockReturnValue(chain);

    await expect(clearHistory('user-1')).rejects.toThrow('Clear failed');
  });
});
