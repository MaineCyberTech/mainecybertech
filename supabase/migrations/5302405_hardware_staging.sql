-- Hardware Staging Checklist (GAP module 45)
-- Idempotent table + org-scoped RLS.
begin;

create table if not exists public.hardware_staging_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  device_name text not null,
  asset_tag text,
  status text not null default 'pending',
  checklist jsonb default '[]'::jsonb,
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hardware_staging_checks_org on public.hardware_staging_checks(organization_id);
create index if not exists idx_hardware_staging_checks_status on public.hardware_staging_checks(status);

alter table public.hardware_staging_checks enable row level security;

drop policy if exists "hardware_staging_checks_select_org" on public.hardware_staging_checks;
create policy "hardware_staging_checks_select_org" on public.hardware_staging_checks for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "hardware_staging_checks_insert_org" on public.hardware_staging_checks;
create policy "hardware_staging_checks_insert_org" on public.hardware_staging_checks for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "hardware_staging_checks_update_org" on public.hardware_staging_checks;
create policy "hardware_staging_checks_update_org" on public.hardware_staging_checks for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "hardware_staging_checks_delete_admin" on public.hardware_staging_checks;
create policy "hardware_staging_checks_delete_admin" on public.hardware_staging_checks for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = hardware_staging_checks.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

commit;
