'use server'

import { createClient } from '@/lib/supabase/server';
import { analyzeMenu as analyzeMenuWithGemini } from '@/lib/gemini';
import type { ScanRecord } from '@/lib/types';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function analyzeMenu(
  formData: FormData,
): Promise<{ success: true; record: ScanRecord } | { success: false; error: string }> {
  // 1. Auth check — must come first to avoid calling Gemini for unauthenticated users
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate image
  const imageField = formData.get('image');
  if (
    !imageField ||
    !(imageField instanceof Blob) ||
    !imageField.type.startsWith('image/')
  ) {
    return { success: false, error: 'image is required' };
  }

  if (imageField.size > MAX_IMAGE_BYTES) {
    return { success: false, error: 'image is required' };
  }

  // 3. Validate blacklist
  const blacklistField = formData.get('blacklist');
  if (!blacklistField || typeof blacklistField !== 'string') {
    return { success: false, error: 'blacklist is required and must be a JSON array' };
  }

  let blacklist: string[];
  try {
    const parsed = JSON.parse(blacklistField) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      return { success: false, error: 'blacklist is required and must be a JSON array' };
    }
    blacklist = parsed as string[];
  } catch {
    return { success: false, error: 'blacklist is required and must be a JSON array' };
  }

  // 4. Call Gemini — image bytes are never logged or stored
  const imageBytes = await imageField.arrayBuffer();
  let dishes: ScanRecord['dishes'];
  try {
    dishes = await analyzeMenuWithGemini(imageBytes, imageField.type, blacklist);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Analysis failed. Please try again.';
    return { success: false, error: message };
  }

  // 5. Persist to DB using the authenticated server client (browser client has no session in server context)
  const { data: inserted, error: dbError } = await supabase
    .from('scan_records')
    .insert({
      user_id: user.id,
      dishes,
      blacklist_snapshot: blacklist,
    })
    .select()
    .single();

  if (dbError) {
    return { success: false, error: 'Failed to save scan record.' };
  }

  const record: ScanRecord = {
    id: (inserted as { id: string }).id,
    createdAt: (inserted as { created_at: string }).created_at,
    dishes,
    blacklistSnapshot: blacklist,
  };

  return { success: true, record };
}
