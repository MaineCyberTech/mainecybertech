-- Fix permissive RLS on store_* tables (P0-6 from comprehensive audit)
--
-- PROBLEM: store_quotes had "FOR ALL USING (true)" which allowed anon to read/update/delete
-- all quotes. store_promotions had "FOR ALL USING (true)" which gave anon full access.
--
-- FIX: Drop permissive policies and replace with role-scoped policies.

-- ===== store_quotes =====
-- Drop the overly permissive "Service role full access" policy (applies to ALL roles)
DROP POLICY IF EXISTS "Service role full access" ON store_quotes;

-- anon: INSERT only (public quote submission)
CREATE POLICY "anon_insert_quotes" ON store_quotes
  FOR INSERT TO anon
  WITH CHECK (true);

-- service_role: full access (admin management)
CREATE POLICY "service_role_all_quotes" ON store_quotes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== store_promotions =====
-- Drop the overly permissive "Service role full access" policy (applies to ALL roles)
DROP POLICY IF EXISTS "Service role full access" ON store_promotions;

-- service_role: full access (admin management)
CREATE POLICY "service_role_all_promotions" ON store_promotions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: "Anyone can view active promotions" policy already correctly restricts
-- SELECT to active promotions only for anon/authenticated roles.
