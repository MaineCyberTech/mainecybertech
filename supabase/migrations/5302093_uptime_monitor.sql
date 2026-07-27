create table if not exists public.uptime_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  check_type text default 'http',
  check_interval_minutes integer default 60,
  expected_status_code integer default 200,
  timeout_seconds integer default 10,
  status text default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_uptime_checks_org on public.uptime_checks (organization_id);
alter table public.uptime_checks enable row level security;
create policy "uptime_checks_org_select" on public.uptime_checks for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = uptime_checks.organization_id AND memberships.user_id = auth.uid()));
create policy "uptime_checks_org_insert" on public.uptime_checks for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = uptime_checks.organization_id AND memberships.user_id = auth.uid()));
create policy "uptime_checks_org_update" on public.uptime_checks for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = uptime_checks.organization_id AND memberships.user_id = auth.uid()));
create policy "uptime_checks_admin_delete" on public.uptime_checks for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = uptime_checks.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));

create table if not exists public.uptime_results (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.uptime_checks(id) on delete cascade,
  response_status integer,
  response_time_ms integer,
  ssl_expiry_date date,
  ssl_days_remaining integer,
  is_up boolean not null default false,
  error_message text,
  checked_at timestamptz default now()
);
create index if not exists idx_uptime_results_check on public.uptime_results (check_id, checked_at desc);
alter table public.uptime_results enable row level security;
create policy "uptime_results_org_select" on public.uptime_results for select using (EXISTS (SELECT 1 FROM uptime_checks uc JOIN memberships m ON m.organization_id = uc.organization_id WHERE uc.id = uptime_results.check_id AND m.user_id = auth.uid()));
create policy "uptime_results_org_insert" on public.uptime_results for insert with check (EXISTS (SELECT 1 FROM uptime_checks uc JOIN memberships m ON m.organization_id = uc.organization_id WHERE uc.id = uptime_results.check_id AND m.user_id = auth.uid()));
