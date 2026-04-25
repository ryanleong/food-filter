// Global test setup — runs in each test file's own environment.
//
// Issue: request.formData() hangs in Vitest (all environments) when the
// Request was created with a FormData body that contains File objects.
// Root cause: undici's multipart body serialisation uses File.stream() which
// returns a WHATWG ReadableStream; in Vitest's worker context, the internal
// read loop that drains that stream never advances past the first microtask
// boundary, so the Promise never settles.
//
// Fix: replace Request.prototype.formData with a thin shim that reconstructs
// the FormData from the original body object (stored on the Request's __body
// property that we save at Request construction time via a Request wrapper),
// bypassing the stream-based multipart round-trip entirely.
//
// Because the test helper (makeRequest) passes a real FormData as the body,
// we can recover it directly and return it unchanged, avoiding all streaming.

const OriginalRequest = globalThis.Request;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class PatchedRequest extends OriginalRequest {
  // Store the raw body init so formData() can short-circuit
  readonly _rawBody?: FormData | string | null;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    // Save the raw body before it gets consumed by the superclass
    if (init?.body instanceof FormData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)._rawBody = init.body;
    }
  }

  async formData(): Promise<FormData> {
    // If we have the original FormData, return it directly (avoids the
    // stream hang caused by undici's multipart round-trip in Vitest workers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this as any)._rawBody instanceof FormData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this as any)._rawBody as FormData;
    }
    return super.formData();
  }
}

// Override the global Request used by test code
Object.defineProperty(globalThis, 'Request', {
  value: PatchedRequest,
  writable: true,
  configurable: true,
});


