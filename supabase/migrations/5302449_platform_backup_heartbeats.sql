-- =========================================================
-- 5302449: platform backup heartbeat table
--
-- DR-P2-008: the `backup_status` module is client-facing product data
-- (seeded per-organization rows). Nothing in the platform ever wrote it, so
-- the worker's `backup-dr-check` was watching seed data while the REAL
-- platform backup (db-backup.yml) could stop unnoticed.
--
-- This table is the platform's own heartbeat: the db-backup workflow upserts
-- its row via scripts/record-backup-heartbeat.sh after a successful run, and
-- `backup-dr-check` fails when the row is missing or older than its freshness
-- window. The client module stays separate and clearly labelled.
-- =========================================================

begin;

create table if not exists public.platform_backup_heartbeats (
  workflow text primary key,
  last_success_at timestamptz not null,
  run_id text,
  run_url text,
  recorded_at timestamptz not null default now()
);

comment on table public.platform_backup_heartbeats is
  'Platform backup heartbeat (DR-P2-008): one row per backup workflow, upserted after a successful run by scripts/record-backup-heartbeat.sh. Not client data — backup_status is the client-facing product surface.';

alter table public.platform_backup_heartbeats enable row level security;

-- Platform admins may read the heartbeat; every write goes through
-- service_role (PostgREST or direct SQL), so no insert/update/delete policies
-- exist.
drop policy if exists "platform_backup_heartbeats_select_super_admin" on public.platform_backup_heartbeats;
create policy "platform_backup_heartbeats_select_super_admin" on public.platform_backup_heartbeats
  for select using (public.is_super_admin());

commit;
