-- Module 20: persist Business OS dashboard snapshots.
-- The worker computed the counts and only logged them, so there was no
-- history. Store each run so the dashboard can show a trend.
create table if not exists business_os_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  metrics jsonb not null default '{}'::jsonb
);

create index if not exists idx_business_os_snapshots_captured
  on business_os_snapshots(captured_at desc);

alter table business_os_snapshots enable row level security;

-- Platform-internal data: the admin API reads it with the service role, so
-- no member/anon policy is granted.
create policy "bos_admin_select" on business_os_snapshots for select using (false);
