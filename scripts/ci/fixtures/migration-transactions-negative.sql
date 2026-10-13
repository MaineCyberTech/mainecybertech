-- Negative fixture for scripts/ci/check-migration-transactions.sh (DATA-P2-002).
-- Migration-shaped file that must FAIL the guard: it drops a table and runs an
-- ALTER TABLE ... DROP COLUMN with no enclosing begin;/commit;. Keep it out of
-- supabase/migrations/ — it is intentionally unsafe.

drop table if exists public.example_stale_table cascade;

alter table public.example_live_table
  drop column if exists example_stale_column;
