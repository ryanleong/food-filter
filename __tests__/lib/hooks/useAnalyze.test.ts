import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalyze } from '@/lib/hooks/useAnalyze';
import * as imageLib from '@/lib/image';
import * as analyzeAction from '@/lib/actions/analyze';
import type { ScanRecord } from '@/lib/types';

// ---- Module mocks ----

vi.mock('@/lib/actions/analyze', () => ({
  analyzeMenu: vi.fn(),
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

const mockAnalyzeMenu = vi.mocked(analyzeAction.analyzeMenu);
const mockCompressImage = vi.mocked(imageLib.compressImage);

/** Returns a minimal fake JPEG Blob */
function fakeBlob(): Blob {
  return new Blob(['fake-image-data'], { type: 'image/jpeg' });
}

/** Returns a File wrapping fakeBlob */
function fakeFile(): File {
  return new File([fakeBlob()], 'menu.jpg', { type: 'image/jpeg' });
}

const FIXED_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const FIXED_ISO  = '2026-04-26T12:00:00.000Z';

const DISHES: ScanRecord['dishes'] = [
  {
    name: 'Pad Thai',
    riskLevel: 'high',
    blacklistedFound: ['peanuts'],
    allIngredients: ['peanuts', 'rice noodles', 'tofu'],
    source: 'both',
  },
];

const MOCK_RECORD: ScanRecord = {
  id: FIXED_UUID,
  createdAt: FIXED_ISO,
  dishes: DISHES,
  blacklistSnapshot: ['peanuts'],
};

function mockActionSuccess() {
  mockAnalyzeMenu.mockResolvedValueOnce({ success: true, record: MOCK_RECORD });
}

function mockActionError(error = 'Analysis failed. Please try again.') {
  mockAnalyzeMenu.mockResolvedValueOnce({ success: false, error });
}

// ---- Setup ----

beforeEach(() => {
  vi.clearAllMocks();

  // Default: compression succeeds
  mockCompressImage.mockResolvedValue(fakeBlob());

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

  it('T2: status transitions to loading while action is in flight', async () => {
    // Action never resolves during this test — we inspect the in-flight state
    mockAnalyzeMenu.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useAnalyze());
    act(() => {
      result.current.analyze(fakeFile(), ['peanuts']);
    });

    expect(result.current.status).toBe('loading');
  });

  it('T3: on success — writes sessionStorage and navigates to /results', async () => {
    mockActionSuccess();

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), ['peanuts']);
    });

    // sessionStorage written with the record returned by the action
    const stored = sessionStorage.getItem('foodfilter_current_scan');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(MOCK_RECORD);

    // navigated to results
    expect(mockPush).toHaveBeenCalledWith('/results');
  });

  it('T4: action returns error → status=error with that error message', async () => {
    mockActionError('Could not reach the analysis service. Check your connection and try again.');

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Could not reach the analysis service. Check your connection and try again.',
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('T5: action returns validation error → status=error', async () => {
    mockActionError('Invalid request. Please re-select your image and try again.');

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Invalid request. Please re-select your image and try again.',
    );
  });

  it('T6: action returns generic failure → status=error', async () => {
    mockActionError('Analysis failed. Please try again.');

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), []);
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Analysis failed. Please try again.');
  });

  it('T7: reset() clears error and returns to idle', async () => {
    mockActionError();

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
    mockActionSuccess();

    vi.spyOn(sessionStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useAnalyze());
    await act(async () => {
      await result.current.analyze(fakeFile(), ['peanuts']);
    });

    expect(mockPush).toHaveBeenCalledWith('/results');
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

