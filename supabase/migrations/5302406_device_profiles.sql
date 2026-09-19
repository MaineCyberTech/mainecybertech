-- Device Profile Library: canonical device_profiles table.
-- Replaces the earlier final-module device_profiles (different column set) with the
-- Device Profile Library schema. Idempotent: drops any prior table + policies first.

drop table if exists public.device_profiles cascade;

create table public.device_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text,
  manufacturer text,
  model text,
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_device_profiles_organization_id on public.device_profiles(organization_id);

alter table public.device_profiles enable row level security;

-- Org-scoped policies: members can read/write their org's profiles; admins may delete.
drop policy if exists "device_profiles_select" on public.device_profiles;
create policy "device_profiles_select" on public.device_profiles
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

drop policy if exists "device_profiles_insert" on public.device_profiles;
create policy "device_profiles_insert" on public.device_profiles
  for insert with check (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

drop policy if exists "device_profiles_update" on public.device_profiles;
create policy "device_profiles_update" on public.device_profiles
  for update using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

drop policy if exists "device_profiles_delete" on public.device_profiles;
create policy "device_profiles_delete" on public.device_profiles
  for delete using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
        and m.organization_id = device_profiles.organization_id
        and r.key in ('super_admin', 'admin')
    )
  );

-- Demo data for the Device Profile Library.
insert into public.device_profiles (id, organization_id, name, type, manufacturer, model, specs) values
  ('82010000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Workstation Standard', 'workstation', 'Dell', 'OptiPlex 7020', jsonb_build_object('bitlocker', true, 'edr', true, 'local_admin', false)),
  ('82010000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Terminal Standard', 'pos_terminal', 'NCR', 'POS-X', jsonb_build_object('pos_lockdown', true, 'edr', true)),
  ('82010000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptop Standard', 'laptop', 'Lenovo', 'ThinkPad X1', jsonb_build_object('bitlocker', true, 'edr', true, 'mdm', true)),
  ('82010000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Standard', 'workstation', 'HP', 'EliteDesk 800', jsonb_build_object('screen_lock_minutes', 5)),
  ('82010000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Standard', 'workstation', 'Dell', 'OptiPlex 5000', jsonb_build_object('usb_write_blocked', true))
on conflict (id) do nothing;
