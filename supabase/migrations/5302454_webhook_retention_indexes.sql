-- =========================================================
-- 5302454: webhook retention indexes (WH-P3-009)
--
-- The retention worker now purges `webhook_deliveries` (90-day default) and
-- `webhook_dead_letters` (180-day default) in bounded batches. Both purges
-- select by `created_at` alone, so add the supporting indexes — the existing
-- indexes are (webhook_id, created_at desc) on deliveries and
-- (webhook_id, created_at desc) on dead letters, neither of which can be
-- range-scanned by a bare created_at predicate.
--
-- The purge windows are documented in docs/modules/webhooks.md and remain
-- overridable through the `retention_policies` registry; this migration only
-- adds indexes (no RLS change, so no policy count moves).
-- =========================================================

begin;

create index if not exists idx_webhook_deliveries_created_at
  on public.webhook_deliveries (created_at);

create index if not exists idx_webhook_dead_letters_created_at
  on public.webhook_dead_letters (created_at);

commit;
