import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalyze } from '@/lib/hooks/useAnalyze';
import * as storage from '@/lib/storage';
import * as imageLib from '@/lib/image';

// ---- Module mocks ----

vi.mock('@/lib/storage', () => ({
  addScanRecord: vi.fn(),
}));

vi.mock('@/lib/image', () => ({
  compressImage: vi.fn(),
}));

// Mock next/navigation router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---- Helpers ----

const mockAddScanRecord = vi.mocked(storage.addScanRecord);
const mockCompressImage = vi.mocked(imageLib.compressImage);

/** Returns a minimal 1×1 JPEG Blob */
function fakeBlob(): Blob {
  return new Blob(['fake-image-data'], { type: 'image/jpeg' });
}

/** Returns a File wrapping fakeBlob */
function fakeFile(): File {
  return new File([fakeBlob()], 'menu.jpg', { type: 'image/jpeg' });
}

const FIXED_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const FIXED_ISO  = '2026-04-26T12:00:00.000Z';

const DISHES = [
  {
    name: 'Pad Thai',
    riskLevel: 'high' as const,
    blacklistedFound: ['peanuts'],
    allIngredients: ['peanuts', 'rice noodles', 'tofu'],
    source: 'both' as const,
  },
];

/** Configures global.fetch to resolve with a successful dishes response */
function mockFetchSuccess() {
  (global.fetch as Mock).mockResolvedValueOnce(
    new Response(JSON.stringify({ dishes: DISHES }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/** Configures global.fetch to resolve with the given HTTP status */
function mockFetchStatus(status: number) {
  (global.fetch as Mock).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: 'fail' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/** Configures global.fetch to reject (network failure) */
function mockFetchNetworkError() {
  (global.fetch as Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));
}

// ---- Setup ----

beforeEach(() => {
  vi.clearAllMocks();

  // Default: compression succeeds
  mockCompressImage.mockResolvedValue(fakeBlob());

  // Stable UUID and timestamp for deterministic assertions
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(FIXED_UUID);
  vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

  global.fetch = vi.fn();

  // Reset sessionStorage between tests
  sessionStorage.clear();
});

// ---- Tests ----

describe('useAnalyze', () => {
  it('T1: initial state is idle with no error', () => {
    const { result } = renderHook(() => useAnalyze());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('T2: status transitions to loading while fetch is in flight', async () => {
    // Fetch never resolves during this test — we inspect the in-flight state
    (global.fetch as Mock).mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useAnalyze());
    act(() => {
      result.current.analyze(fakeFile(), ['peanuts']);
    });

    expect(result.current.status).toBe('loading');
  });

  it('T3: on success — saves record, writes sessionStorage, navigates to /results', async () => {
    mockFetchSuccess();

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), ['peanuts']);
    });

    // addScanRecord called with correct record shape
    expect(mockAddScanRecord).toHaveBeenCalledOnce();
    const savedRecord = mockAddScanRecord.mock.calls[0][0];
    expect(savedRecord).toEqual({
      id: FIXED_UUID,
      timestamp: FIXED_ISO,
      dishes: DISHES,
      blacklistSnapshot: ['peanuts'],
    });

    // sessionStorage written with the same record
    const stored = sessionStorage.getItem('foodfilter_current_scan');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(savedRecord);

    // navigated to results
    expect(mockPush).toHaveBeenCalledWith('/results');
  });

  it('T4: network error → status=error with correct message', async () => {
    mockFetchNetworkError();

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Could not reach the analysis service. Check your connection and try again.'
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('T5: HTTP 400 → status=error with correct message', async () => {
    mockFetchStatus(400);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Invalid request. Please re-select your image and try again.'
    );
  });

  it('T6: HTTP 500 → status=error with correct message', async () => {
    mockFetchStatus(500);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Analysis failed. Please try again.');
  });

  it('T6b: HTTP 503 (Gemini quota exceeded) → status=error with rate limit message', async () => {
    mockFetchStatus(503);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'AI service quota exceeded. Please wait a moment and try again.'
    );
  });

  it('T7: reset() clears error and returns to idle', async () => {
    mockFetchStatus(500);

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('T8: sessionStorage failure does not prevent navigation to /results', async () => {
    mockFetchSuccess();

    // Force sessionStorage.setItem to throw
    vi.spyOn(sessionStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), ['peanuts']);
    });

    // Navigation still happens despite sessionStorage failure
    expect(mockPush).toHaveBeenCalledWith('/results');
    // addScanRecord (localStorage) was still called
    expect(mockAddScanRecord).toHaveBeenCalledOnce();
  });

  it('T9: compressImage failure → status=error with generic message', async () => {
    mockCompressImage.mockRejectedValueOnce(new Error('Canvas unavailable'));

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Something went wrong. Please try again.');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
