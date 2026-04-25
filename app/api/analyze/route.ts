import { NextResponse } from 'next/server';
import { analyzeMenu } from '@/lib/gemini';

export async function POST(request: Request) {
  // --- Parse FormData ---
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // --- Validate image ---
  const imageField = formData.get('image');
  if (
    !imageField ||
    !(imageField instanceof File) ||
    !imageField.type.startsWith('image/')
  ) {
    return NextResponse.json({ error: 'image is required' }, { status: 400 });
  }

  // Reject oversized images before reading bytes into memory (DoS protection)
  const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
  if (imageField.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'image is required' }, { status: 400 });
  }

  // --- Validate blacklist ---
  const blacklistField = formData.get('blacklist');
  if (!blacklistField || typeof blacklistField !== 'string') {
    return NextResponse.json(
      { error: 'blacklist is required and must be a JSON array' },
      { status: 400 }
    );
  }

  let blacklist: unknown;
  try {
    blacklist = JSON.parse(blacklistField);
  } catch {
    return NextResponse.json(
      { error: 'blacklist is required and must be a JSON array' },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(blacklist) ||
    !blacklist.every((item) => typeof item === 'string')
  ) {
    return NextResponse.json(
      { error: 'blacklist is required and must be a JSON array' },
      { status: 400 }
    );
  }

  // --- Call Gemini ---
  // Convert image to ArrayBuffer — image bytes are never logged or stored
  const imageBytes = await imageField.arrayBuffer();

  try {
    const dishes = await analyzeMenu(imageBytes, imageField.type, blacklist);
    return NextResponse.json({ dishes });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';

    if (message === 'GEMINI_API_KEY not set') {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
