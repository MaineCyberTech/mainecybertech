-- Backup Disaster Recovery Review (#15)
create table if not exists backup_status (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  system_name text not null,
  backup_type text default 'full',
  last_backup_at timestamptz,
  last_backup_status text default 'unknown',
  last_backup_size_gb numeric(8,2),
  next_scheduled_at timestamptz,
  recovery_point_objective_hours integer,
  recovery_time_objective_hours integer,
  retention_days integer default 30,
  restore_tested_at timestamptz,
  restore_test_result text,
  offsite_replicated boolean default false,
  encryption_enabled boolean default false,
  notes text,
  status text not null default 'monitored',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_backup_status_org on backup_status(organization_id);
create index if not exists idx_backup_status_next on backup_status(next_scheduled_at);

alter table backup_status enable row level security;
create policy "backup_select_org" on backup_status for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "backup_insert_auth" on backup_status for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "backup_update_org" on backup_status for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
