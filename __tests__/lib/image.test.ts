import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressImage } from '../../lib/image';

// --- Shared mock references ---

// Reusable per-test toBlob mock — default returns a small (100-byte) JPEG blob
const mockToBlob = vi.fn<[BlobCallback, string?, number?], void>();

// drawImage spy (we just want to confirm it is called)
const mockDrawImage = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();

  // Default: toBlob returns a 100-byte blob (well under any limit)
  mockToBlob.mockImplementation((callback: BlobCallback) => {
    callback(new Blob([new Uint8Array(100)], { type: 'image/jpeg' }));
  });

  // Spy on HTMLCanvasElement prototype methods (jsdom provides the class)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(mockToBlob);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: mockDrawImage,
  } as unknown as CanvasRenderingContext2D);

  // URL stubs (jsdom does not implement these)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  // Mock Image constructor: setting src fires onload asynchronously
  vi.stubGlobal(
    'Image',
    class MockImage {
      naturalWidth = 200;
      naturalHeight = 150;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_val: string) {
        // Use Promise.resolve so callers awaiting the promise receive control after onload
        Promise.resolve().then(() => this.onload?.());
      }
      get src() {
        return '';
      }
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --- Tests ---

describe('compressImage', () => {
  it('throws if the file is not an image MIME type', async () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    await expect(compressImage(file)).rejects.toThrow('File must be an image');
  });

  it('returns a Blob with type image/jpeg for a valid image file', async () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const result = await compressImage(file);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('image/jpeg');
  });

  it('encodes with drawImage called once when already under the size limit', async () => {
    // Default blob is 100 bytes, default limit is 1024 KB — well under
    const file = new File(['data'], 'small.jpg', { type: 'image/jpeg' });
    await compressImage(file);
    expect(mockDrawImage).toHaveBeenCalledTimes(1);
  });

  it('re-encodes when the first blob exceeds maxSizeKB', async () => {
    // First call: 2 MB blob (over the 1 MB limit). Second call: 100 bytes.
    let callCount = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => {
        callCount++;
        const size = callCount === 1 ? 2 * 1024 * 1024 : 100;
        callback(new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
      }
    );

    const file = new File(['data'], 'large.jpg', { type: 'image/jpeg' });
    const result = await compressImage(file);

    expect(result).toBeInstanceOf(Blob);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('respects a custom maxSizeKB parameter', async () => {
    // toBlob always returns 500 bytes; set maxSizeKB to 0.1 KB (100 bytes) — 500 bytes exceeds it
    // But the MockImage has naturalWidth=200 and naturalHeight=150.
    // The loop shrinks by 0.9× each iteration. After enough iterations the shorter side < 100px.
    // At that point the oversized blob is returned as-is.
    let callCount = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => {
        callCount++;
        callback(new Blob([new Uint8Array(500)], { type: 'image/jpeg' }));
      }
    );

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    // maxSizeKB = 0.1 KB = 102 bytes, blob is always 500 bytes
    // Loop should exit when shorter dimension < 100px
    const result = await compressImage(file, 0.1);
    expect(result).toBeInstanceOf(Blob);
    expect(callCount).toBeGreaterThan(1); // Confirmed looping happened
  });

  it('preserves aspect ratio when resizing across multiple iterations', async () => {
    // Use a 400×200 image (2:1 ratio) and always return an oversized blob
    // so the loop runs at least twice before the floor stops it.
    vi.stubGlobal(
      'Image',
      class MockImageWide {
        naturalWidth = 400;
        naturalHeight = 200;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          Promise.resolve().then(() => this.onload?.());
        }
        get src() { return ''; }
      }
    );

    // Always return a blob larger than maxSizeKB so the loop keeps shrinking
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => {
        callback(new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/jpeg' }));
      }
    );

    // Capture every drawImage(img, 0, 0, width, height) call
    const drawImageCalls: Array<{ width: number; height: number }> = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: (_img: unknown, _x: unknown, _y: unknown, width: number, height: number) => {
        drawImageCalls.push({ width, height });
      },
    } as unknown as CanvasRenderingContext2D);

    const file = new File(['data'], 'wide.jpg', { type: 'image/jpeg' });
    // maxSizeKB = 1 KB — blob is always 2 MB, so loop runs until floor
    await compressImage(file, 1);

    // Must have looped at least twice
    expect(drawImageCalls.length).toBeGreaterThanOrEqual(2);

    // Every call must maintain the original 2:1 aspect ratio (±0.1 tolerance for rounding)
    for (const { width, height } of drawImageCalls) {
      expect(width / height).toBeCloseTo(2, 1);
    }
  });
});
