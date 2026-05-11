# Issue 7: Blacklist DB layer & useBlacklist hook migration

## Parent

None

## What to build

Replace all `localStorage` blacklist access with a Supabase-backed DB layer. Create `lib/db/blacklist.ts` with functions that read and write the `blacklist_items` table. Update `useBlacklist` to call this DB layer instead of `lib/storage.ts`. Inputs are still normalised (lowercase + trimmed) before write, matching existing behaviour. Remove all blacklist-related code from `lib/storage.ts`.

## Acceptance criteria

- [ ] `lib/db/blacklist.ts` exports `getBlacklist(userId)`, `addItem(userId, ingredient)`, `removeItem(userId, ingredient)`
- [ ] `getBlacklist` returns a `string[]` of ingredients for the given user, sorted alphabetically
- [ ] `addItem` normalises the ingredient (lowercase + trim) before inserting; duplicate inserts are silently ignored (upsert)
- [ ] `removeItem` deletes the matching row; deleting a non-existent item does not throw
- [ ] `useBlacklist` hook hydrates from `lib/db/blacklist.ts` on mount instead of `localStorage`
- [ ] `useBlacklist` `add()` and `remove()` call the DB layer and update local state on success
- [ ] `useBlacklist` exposes a loading state during the initial fetch
- [ ] Blacklist-related functions are removed from `lib/storage.ts`
- [ ] Tests cover all four public functions of `lib/db/blacklist.ts` (see PRD Testing Decisions)
- [ ] Tests for `useBlacklist` are updated to mock `lib/db/blacklist.ts` instead of `localStorage`
- [ ] TypeScript compiles without errors

## Blocked by

- Blocked by #2 (requires `blacklist_items` table and RLS policies)
- Blocked by #6 (requires `useAuth` to get `userId` inside the hook)
