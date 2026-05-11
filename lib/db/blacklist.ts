import { createClient } from '@/lib/supabase/client';

/**
 * Fetches all blacklist items for a user, sorted alphabetically.
 */
export async function getBlacklist(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('blacklist_items')
    .select('ingredient')
    .eq('user_id', userId)
    .order('ingredient', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: { ingredient: string }) => row.ingredient);
}

/**
 * Adds a normalized (lowercase + trimmed) ingredient.
 * Silently ignores duplicates via upsert with ignoreDuplicates.
 */
export async function addItem(userId: string, ingredient: string): Promise<void> {
  const normalized = ingredient.trim().toLowerCase();
  const supabase = createClient();
  const { error } = await supabase.from('blacklist_items').upsert(
    { user_id: userId, ingredient: normalized },
    { onConflict: 'user_id,ingredient', ignoreDuplicates: true },
  );

  if (error) throw error;
}

/**
 * Removes an ingredient. Silently ignores if not found.
 */
export async function removeItem(userId: string, ingredient: string): Promise<void> {
  const normalized = ingredient.trim().toLowerCase();
  const supabase = createClient();
  const { error } = await supabase
    .from('blacklist_items')
    .delete()
    .eq('user_id', userId)
    .eq('ingredient', normalized);

  if (error) throw error;
}
