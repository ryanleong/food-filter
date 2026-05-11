# Issue 2: Database schema & RLS policies

## Parent

None

## What to build

Create the two Supabase tables (`blacklist_items` and `scan_records`) and enable Row-Level Security so each user can only access their own rows. This is a database migration — no application code changes yet. The schema must exactly match the types defined in `lib/types.ts` so that the DB layer built in later issues can map rows to TypeScript types without transformation.

## Acceptance criteria

- [ ] `blacklist_items` table exists with columns: `id` (uuid PK), `user_id` (uuid FK → `auth.users`), `ingredient` (text), `created_at` (timestamptz default `now()`)
- [ ] Unique constraint on `(user_id, ingredient)` in `blacklist_items`
- [ ] `scan_records` table exists with columns: `id` (uuid PK), `user_id` (uuid FK → `auth.users`), `created_at` (timestamptz default `now()`), `dishes` (jsonb), `blacklist_snapshot` (text[])
- [ ] RLS is enabled on both tables
- [ ] RLS policy on `blacklist_items`: authenticated users may `SELECT`, `INSERT`, `DELETE` rows where `user_id = auth.uid()`
- [ ] RLS policy on `scan_records`: authenticated users may `SELECT`, `INSERT`, `DELETE` rows where `user_id = auth.uid()`
- [ ] Migration SQL is committed to the repo (e.g. in `supabase/migrations/`)
- [ ] A `CASCADE` delete rule removes all rows for a user when the `auth.users` row is deleted

## Blocked by

- Blocked by #1 (Supabase project must exist and be connected before migrations can run)
