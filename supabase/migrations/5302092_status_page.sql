create table if not exists public.status_components (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  component_type text default 'service',
  status text default 'operational',
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_status_components_org on public.status_components (organization_id);
alter table public.status_components enable row level security;
create policy "status_org_select" on public.status_components for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = status_components.organization_id AND memberships.user_id = auth.uid()));
create policy "status_org_insert" on public.status_components for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = status_components.organization_id AND memberships.user_id = auth.uid()));
create policy "status_org_update" on public.status_components for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = status_components.organization_id AND memberships.user_id = auth.uid()));
create policy "status_admin_delete" on public.status_components for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = status_components.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));

create table if not exists public.status_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  severity text default 'minor',
  status text default 'investigating',
  affected_component_ids uuid[] default '{}',
  started_at timestamptz default now(),
  resolved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_status_incidents_org on public.status_incidents (organization_id);
alter table public.status_incidents enable row level security;
create policy "incidents_org_select" on public.status_incidents for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = status_incidents.organization_id AND memberships.user_id = auth.uid()));
create policy "incidents_org_insert" on public.status_incidents for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = status_incidents.organization_id AND memberships.user_id = auth.uid()));
create policy "incidents_org_update" on public.status_incidents for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = status_incidents.organization_id AND memberships.user_id = auth.uid()));
create policy "incidents_admin_delete" on public.status_incidents for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = status_incidents.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));

create table if not exists public.maintenance_notices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status text default 'scheduled',
  affected_component_ids uuid[] default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_maintenance_notices_org on public.maintenance_notices (organization_id);
alter table public.maintenance_notices enable row level security;
create policy "maintenance_org_select" on public.maintenance_notices for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = maintenance_notices.organization_id AND memberships.user_id = auth.uid()));
create policy "maintenance_org_insert" on public.maintenance_notices for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = maintenance_notices.organization_id AND memberships.user_id = auth.uid()));
create policy "maintenance_org_update" on public.maintenance_notices for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = maintenance_notices.organization_id AND memberships.user_id = auth.uid()));
create policy "maintenance_admin_delete" on public.maintenance_notices for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = maintenance_notices.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));
