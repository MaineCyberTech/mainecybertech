-- SLA tracking for ticket response and resolution
create table if not exists sla_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid references tickets(id) on delete cascade,
  metric text not null check (metric in ('first_response', 'resolution', 'triage')),
  target_minutes int not null default 60,
  actual_minutes int,
  breached boolean not null default false,
  breached_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for dashboard queries
create index if not exists idx_sla_logs_org on sla_logs(organization_id, created_at desc);
create index if not exists idx_sla_logs_breached on sla_logs(organization_id, breached);

-- Enable RLS
alter table sla_logs enable row level security;

-- RLS policies
create policy "sla_logs_select_org" on sla_logs for select
  using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
    )
  );

create policy "sla_logs_insert_admin" on sla_logs for insert
  with check (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = sla_logs.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- Function: calculate SLA breach status
create or replace function calculate_sla_breach(
  p_created_at timestamptz,
  p_target_minutes int
) returns boolean as $$
begin
  return extract(epoch from (now() - p_created_at)) / 60 > p_target_minutes;
end;
$$ language plpgsql stable;
