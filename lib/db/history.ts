import { createClient } from '@/lib/supabase/client';
import type { ScanRecord, DishResult } from '@/lib/types';

interface DbRow {
  id: string;
  created_at: string;
  user_id: string;
  dishes: DishResult[];
  blacklist_snapshot: string[];
}

function toScanRecord(row: DbRow): ScanRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    dishes: row.dishes,
    blacklistSnapshot: row.blacklist_snapshot,
  };
}

/** Returns all scan records for a user, sorted by created_at descending. */
export async function getHistory(userId: string): Promise<ScanRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scan_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbRow[]).map(toScanRecord);
}

/** Returns a single scan record by id for a user, or null if not found. */
export async function getRecord(
  userId: string,
  recordId: string,
): Promise<ScanRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scan_records')
    .select('*')
    .eq('id', recordId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toScanRecord(data as DbRow);
}

/** Inserts a new scan record. Returns the saved record with DB-generated id and created_at. */
export async function addRecord(
  userId: string,
  record: Omit<ScanRecord, 'id' | 'createdAt'>,
): Promise<ScanRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scan_records')
    .insert({
      user_id: userId,
      dishes: record.dishes,
      blacklist_snapshot: record.blacklistSnapshot,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toScanRecord(data as DbRow);
}

/** Deletes a record by id for a user. Silently ignores if not found. */
export async function deleteRecord(
  userId: string,
  recordId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('scan_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

/** Deletes all records for a user. */
export async function clearHistory(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('scan_records')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
