import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Gemini module before importing the route
vi.mock('@/lib/gemini');

import { analyzeMenu } from '@/lib/gemini';
import { POST } from '../../../../app/api/analyze/route';
import type { DishResult } from '@/lib/types';

const mockAnalyzeMenu = vi.mocked(analyzeMenu);

// Creates a Request with a multipart/form-data body
function makeRequest(fields: Record<string, string | File>): Request {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    body: form,
  });
}

// A minimal valid image File for use in tests
const sampleImage = new File([new Uint8Array(100)], 'menu.jpg', {
  type: 'image/jpeg',
});

const sampleDish: DishResult = {
  name: 'Pasta Carbonara',
  riskLevel: 'medium',
  blacklistedFound: ['dairy'],
  allIngredients: ['pasta', 'egg', 'guanciale', 'pecorino'],
  source: 'model',
};

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  // --- 400 validation ---

  it('returns 400 with descriptive error when image field is missing', async () => {
    const req = makeRequest({ blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('image is required');
  });

  it('returns 400 when image field is not a File (sent as plain string)', async () => {
    const req = makeRequest({ image: 'not-a-file', blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('image is required');
  });

  it('returns 400 with descriptive error when blacklist field is missing', async () => {
    const req = makeRequest({ image: sampleImage });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('blacklist is required and must be a JSON array');
  });

  it('returns 400 when blacklist is not valid JSON', async () => {
    const req = makeRequest({ image: sampleImage, blacklist: '{invalid}' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('blacklist is required and must be a JSON array');
  });

  it('returns 400 when blacklist parses to a non-array JSON value', async () => {
    const req = makeRequest({ image: sampleImage, blacklist: '"peanuts"' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('blacklist is required and must be a JSON array');
  });

  // --- 200 success ---

  it('returns 200 with dishes on a successful analysis', async () => {
    mockAnalyzeMenu.mockResolvedValue([sampleDish]);
    const req = makeRequest({ image: sampleImage, blacklist: '["dairy"]' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dishes).toEqual([sampleDish]);
  });

  it('returns 200 with an empty dishes array when Gemini finds no dishes', async () => {
    mockAnalyzeMenu.mockResolvedValue([]);
    const req = makeRequest({ image: sampleImage, blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dishes).toEqual([]);
  });

  it('calls analyzeMenu with the image bytes and parsed blacklist', async () => {
    mockAnalyzeMenu.mockResolvedValue([]);
    const req = makeRequest({ image: sampleImage, blacklist: '["gluten","nuts"]' });
    await POST(req);
    expect(mockAnalyzeMenu).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      'image/jpeg',
      ['gluten', 'nuts']
    );
  });

  // --- 500 errors ---

  it('returns 500 with a safe message when GEMINI_API_KEY is not set', async () => {
    mockAnalyzeMenu.mockRejectedValue(new Error('GEMINI_API_KEY not set'));
    const req = makeRequest({ image: sampleImage, blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Server configuration error');
  });

  it('returns 500 with a safe message when analysis fails', async () => {
    mockAnalyzeMenu.mockRejectedValue(new Error('Failed to parse AI response'));
    const req = makeRequest({ image: sampleImage, blacklist: '[]' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Analysis failed. Please try again.');
  });
});
