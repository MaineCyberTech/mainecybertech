-- =========================================================
-- 5302463: make the notifications dedup index usable as an ON CONFLICT
--          target (PostgreSQL 42P10)
--
-- 5302107 created the dedup index with a predicate:
--
--   create unique index idx_notifications_key
--     on notifications (notification_key)
--     where notification_key is not null;
--
-- The in-app dedup path upserts with ON CONFLICT (notification_key):
--
--   apps/api/src/lib/notify.ts            (notifyAndEmail)
--   apps/worker/src/notification-store.ts (insertNotification)
--
-- PostgreSQL cannot infer a PARTIAL unique index from a bare conflict target,
-- so every deduped insert fails with:
--
--   42P10 there is no unique or exclusion constraint matching the ON CONFLICT
--         specification
--
-- and no notification row is written. The worker had logged 536 of these on
-- the dev environment (e.g. every "Scheduled automation due" notification);
-- the in-app channel silently recorded "failed" delivery metrics instead.
--
-- Replace the partial index with a full unique index. NULLs are distinct in
-- a unique index, so rows without a dedup key can still hold multiple NULLs —
-- the predicate never carried its weight.
--
-- Idempotent: drop-then-create, safe to replay.
-- Rollback: drop this index and recreate the partial definition from 5302107.
-- =========================================================

begin;

drop index if exists public.idx_notifications_key;

create unique index if not exists idx_notifications_key
  on public.notifications (notification_key);

commit;
