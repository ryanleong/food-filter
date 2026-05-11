# Issue 8: History DB layer & useHistory hook migration

## Parent

None

## What to build

Replace all `localStorage` history access with a Supabase-backed DB layer. Create `lib/db/history.ts` with functions that read and write the `scan_records` table. Update `useHistory` and `useHistoryRecord` to call this DB layer. Remove all history-related code from `lib/storage.ts`. The returned `ScanRecord[]` type is unchanged — the DB layer is responsible for mapping rows to the existing type.

## Acceptance criteria

- [ ] `lib/db/history.ts` exports `getHistory(userId)`, `addRecord(userId, record)`, `deleteRecord(userId, recordId)`, `clearHistory(userId)`
- [ ] `getHistory` returns `ScanRecord[]` sorted by `created_at` descending
- [ ] `addRecord` inserts a new row and returns the saved `ScanRecord` (with DB-generated `id` and `created_at`)
- [ ] `deleteRecord` removes the row matching `recordId` for the given user; deleting a non-existent record does not throw
- [ ] `clearHistory` removes all scan records for the given user
- [ ] `useHistory` hydrates from `lib/db/history.ts` on mount instead of `localStorage`
- [ ] `useHistoryRecord(id)` fetches the single record from Supabase; redirects to `/history` if not found
- [ ] `useHistory` `removeRecord()` and `removeAll()` call the DB layer and update local state on success
- [ ] History-related functions are removed from `lib/storage.ts`
- [ ] Tests cover all four public functions of `lib/db/history.ts`
- [ ] Tests for `useHistory` and `useHistoryRecord` are updated to mock `lib/db/history.ts`
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #2 (requires `scan_records` table and RLS policies)
- Blocked by #6 (requires `useAuth` to get `userId` inside the hook)
