-- Migration: Auth schema for FoodFilter
-- Creates blacklist_items and scan_records tables with RLS policies

-- ============================================================
-- blacklist_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blacklist_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient  text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blacklist_items_user_ingredient_unique UNIQUE (user_id, ingredient)
);

ALTER TABLE public.blacklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blacklist items"
  ON public.blacklist_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blacklist items"
  ON public.blacklist_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blacklist items"
  ON public.blacklist_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- scan_records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scan_records (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  dishes             jsonb       NOT NULL,
  blacklist_snapshot text[]      NOT NULL DEFAULT '{}'
);

ALTER TABLE public.scan_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scan records"
  ON public.scan_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan records"
  ON public.scan_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan records"
  ON public.scan_records
  FOR DELETE
  USING (auth.uid() = user_id);
