import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — must appear before the module under test is imported
vi.mock('@google/genai');

import { GoogleGenAI } from '@google/genai';
import { analyzeMenu } from '../../lib/gemini';
import type { DishResult } from '../../lib/types';

// Type-narrow the mocked constructor
const MockedGoogleGenAI = vi.mocked(GoogleGenAI);

// The mock for ai.models.generateContent
const mockGenerateContent = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GEMINI_API_KEY = 'test-key';

  MockedGoogleGenAI.mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  }) as unknown as InstanceType<typeof GoogleGenAI>);
});

// A valid dish fixture that passes all field validation
const validDish: DishResult = {
  name: 'Pad Thai',
  riskLevel: 'high',
  blacklistedFound: ['peanuts'],
  allIngredients: ['rice noodles', 'peanuts', 'egg', 'tofu'],
  source: 'menu',
};

describe('analyzeMenu', () => {
  it('throws when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      analyzeMenu(new ArrayBuffer(0), 'image/jpeg', [])
    ).rejects.toThrow('GEMINI_API_KEY not set');
  });

  it('returns an empty array when Gemini responds with an empty JSON array', async () => {
    mockGenerateContent.mockResolvedValue({ text: '[]' });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toEqual([]);
  });

  it('returns parsed dish results for a valid JSON response', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify([validDish]) });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', ['peanuts']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pad Thai');
    expect(result[0].riskLevel).toBe('high');
  });

  it('strips markdown fences before parsing', async () => {
    const wrapped = '```json\n' + JSON.stringify([validDish]) + '\n```';
    mockGenerateContent.mockResolvedValue({ text: wrapped });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(1);
  });

  it('strips plain code fences before parsing', async () => {
    const wrapped = '```\n' + JSON.stringify([validDish]) + '\n```';
    mockGenerateContent.mockResolvedValue({ text: wrapped });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(1);
  });

  it('throws when the response is not valid JSON', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not-json' });
    await expect(
      analyzeMenu(new ArrayBuffer(0), 'image/jpeg', [])
    ).rejects.toThrow();
  });

  it('throws when the response is not a JSON array', async () => {
    mockGenerateContent.mockResolvedValue({ text: '{"name":"Burger"}' });
    await expect(
      analyzeMenu(new ArrayBuffer(0), 'image/jpeg', [])
    ).rejects.toThrow();
  });

  it('filters out dishes missing required fields', async () => {
    const incompleteDish = { name: 'Burger' }; // missing riskLevel, blacklistedFound, etc.
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([incompleteDish, validDish]),
    });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pad Thai');
  });

  it('filters out dishes with an invalid riskLevel value', async () => {
    const badDish = { ...validDish, riskLevel: 'critical' };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([badDish]),
    });
    const result = await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', []);
    expect(result).toHaveLength(0);
  });

  it('passes the blacklist to generateContent', async () => {
    mockGenerateContent.mockResolvedValue({ text: '[]' });
    await analyzeMenu(new ArrayBuffer(0), 'image/jpeg', ['gluten', 'dairy']);

    const call = mockGenerateContent.mock.calls[0][0] as { contents: unknown[] };
    const contentsStr = JSON.stringify(call.contents);
    expect(contentsStr).toContain('gluten');
    expect(contentsStr).toContain('dairy');
  });
});
