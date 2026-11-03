-- =========================================================
-- 5302460: drop the orphaned portal_module_settings table (FEAT-P3-004)
--
-- 5302058 introduced `portal_module_settings` for per-organization module
-- configuration, but no application code ever read or wrote it — only the demo
-- seeds inserted rows. Per-org module enablement is derived by
-- `deriveEnabledModules()` from the subscription plan plus
-- `client_portal_entitlements` (apps/api/src/lib/entitlements.ts), which is the
-- single source of truth for module enablement.
--
-- The table carried RLS policies (5302058 / 5302112 / 5302129); dropping the
-- table removes them with it. The seed inserts were removed in the same change.
--
-- Rollback: re-create the 5302058 shape (id, organization_id, module_key,
-- enabled, created_at/updated_at) and its 5302058/5302112/5302129 RLS policies,
-- then restore rows from backup/PITR — the dropped rows are gone. The table was
-- orphaned in application code, so no code change is needed for the restore.
-- =========================================================

begin;

drop table if exists public.portal_module_settings cascade;

commit;
