import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as geminiLib from '@/lib/gemini';
import * as historyLib from '@/lib/db/history';
import { analyzeMenu } from '@/lib/actions/analyze';
import type { ScanRecord } from '@/lib/types';

// ---- Module mocks ----

const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@/lib/gemini');
vi.mock('@/lib/db/history');

// ---- Helpers ----

const mockAnalyzeMenu = vi.mocked(geminiLib.analyzeMenu);
const mockAddRecord = vi.mocked(historyLib.addRecord);

const FIXED_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const FIXED_ISO = '2026-04-26T12:00:00.000Z';

const DISHES: ScanRecord['dishes'] = [
  {
    name: 'Pad Thai',
    riskLevel: 'high',
    blacklistedFound: ['peanuts'],
    allIngredients: ['peanuts', 'rice noodles'],
    source: 'both',
  },
];

const MOCK_RECORD: ScanRecord = {
  id: FIXED_UUID,
  createdAt: FIXED_ISO,
  dishes: DISHES,
  blacklistSnapshot: ['peanuts'],
};

function fakeFormData(options?: { includeImage?: boolean; includeBlacklist?: boolean }): FormData {
  const opts = { includeImage: true, includeBlacklist: true, ...options };
  const fd = new FormData();
  if (opts.includeImage) {
    fd.append('image', new Blob(['fake-image'], { type: 'image/jpeg' }), 'menu.jpg');
  }
  if (opts.includeBlacklist) {
    fd.append('blacklist', JSON.stringify(['peanuts']));
  }
  return fd;
}

function mockAuthenticated(userId = 'user-123') {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
}

// ---- Setup ----

beforeEach(() => {
  vi.clearAllMocks();
  mockAnalyzeMenu.mockResolvedValue(DISHES);
  mockAddRecord.mockResolvedValue(MOCK_RECORD);
});

// ---- Tests ----

describe('analyzeMenu (Server Action)', () => {
  it('T1: unauthenticated call returns Unauthorized without calling Gemini', async () => {
    mockUnauthenticated();

    const result = await analyzeMenu(fakeFormData());

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockAnalyzeMenu).not.toHaveBeenCalled();
  });

  it('T2: authenticated call with valid FormData calls Gemini and returns { success: true, record }', async () => {
    mockAuthenticated();

    const result = await analyzeMenu(fakeFormData());

    expect(result).toEqual({ success: true, record: MOCK_RECORD });
    expect(mockAnalyzeMenu).toHaveBeenCalledOnce();
  });

  it('T3: authenticated call persists scan via addRecord', async () => {
    mockAuthenticated('user-abc');

    await analyzeMenu(fakeFormData());

    expect(mockAddRecord).toHaveBeenCalledOnce();
    expect(mockAddRecord).toHaveBeenCalledWith('user-abc', {
      dishes: DISHES,
      blacklistSnapshot: ['peanuts'],
    });
  });

  it('T4: Gemini failure returns error without calling addRecord', async () => {
    mockAuthenticated();
    mockAnalyzeMenu.mockRejectedValueOnce(new Error('Quota exceeded'));

    const result = await analyzeMenu(fakeFormData());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
    expect(mockAddRecord).not.toHaveBeenCalled();
  });

  it('T5: missing image field returns error without calling Gemini', async () => {
    mockAuthenticated();

    const result = await analyzeMenu(fakeFormData({ includeImage: false }));

    expect(result).toEqual({ success: false, error: 'image is required' });
    expect(mockAnalyzeMenu).not.toHaveBeenCalled();
  });
});
