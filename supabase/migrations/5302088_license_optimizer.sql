create table if not exists public.license_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  software_name text not null,
  license_type text not null default 'per_seat',
  total_seats integer not null default 1,
  used_seats integer default 0,
  cost_per_seat numeric(10,2),
  billing_cycle text default 'monthly',
  last_audit_date timestamptz,
  status text default 'active',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_license_allocations_org on public.license_allocations (organization_id);
alter table public.license_allocations enable row level security;
create policy "license_org_select" on public.license_allocations for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = license_allocations.organization_id AND memberships.user_id = auth.uid()));
create policy "license_org_insert" on public.license_allocations for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = license_allocations.organization_id AND memberships.user_id = auth.uid()));
create policy "license_org_update" on public.license_allocations for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = license_allocations.organization_id AND memberships.user_id = auth.uid()));
create policy "license_admin_delete" on public.license_allocations for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = license_allocations.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));
