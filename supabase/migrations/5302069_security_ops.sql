-- M365 Offboarding (#36) + Break Glass Register (#58) + Onboarding Checklist (#2) + Patch Compliance (#50)
begin;

create table if not exists offboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  employee_name text not null,
  employee_email text,
  department text,
  offboarding_date date,
  account_disabled boolean default false,
  mailbox_converted boolean default false,
  onedrive_transferred boolean default false,
  license_reclaimed boolean default false,
  access_reviewed boolean default false,
  evidence_collected boolean default false,
  completed_at timestamptz,
  status text not null default 'in_progress',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_offboarding_checklists_org on offboarding_checklists(organization_id);
alter table offboarding_checklists enable row level security;
create policy "offboarding_select_org" on offboarding_checklists for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "offboarding_insert_auth" on offboarding_checklists for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "offboarding_update_org" on offboarding_checklists for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists break_glass_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  account_name text not null,
  system text not null,
  custodian_name text,
  last_rotated_at timestamptz,
  next_rotation_at timestamptz,
  last_used_at timestamptz,
  last_tested_at timestamptz,
  access_procedure text,
  test_notes text,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_break_glass_org on break_glass_accounts(organization_id);
alter table break_glass_accounts enable row level security;
create policy "break_glass_select_org" on break_glass_accounts for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "break_glass_insert_auth" on break_glass_accounts for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "break_glass_update_org" on break_glass_accounts for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists onboarding_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_name text not null,
  discovery_complete boolean default false,
  m365_setup_complete boolean default false,
  network_documented boolean default false,
  security_baseline_applied boolean default false,
  documentation_prepared boolean default false,
  backup_configured boolean default false,
  handoff_complete boolean default false,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'discovery',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_onboarding_clients_org on onboarding_clients(organization_id);
alter table onboarding_clients enable row level security;
create policy "onboarding_select_org" on onboarding_clients for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "onboarding_insert_auth" on onboarding_clients for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "onboarding_update_org" on onboarding_clients for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists patch_compliance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  device_group text not null,
  total_devices integer default 0,
  patched_devices integer default 0,
  pending_patches integer default 0,
  critical_patches integer default 0,
  last_patch_date date,
  next_maintenance_window timestamptz,
  exception_count integer default 0,
  compliance_pct numeric(5,2),
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_patch_compliance_org on patch_compliance(organization_id);
alter table patch_compliance enable row level security;
create policy "patch_select_org" on patch_compliance for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "patch_insert_auth" on patch_compliance for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "patch_update_org" on patch_compliance for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
