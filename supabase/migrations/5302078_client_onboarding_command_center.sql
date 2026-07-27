-- Client Onboarding Command Center (Module #2)
-- Repeatable workspace for client discovery, M365 setup, access collection, network baseline, documentation, security baseline, and support handoff.

begin;

-- =========================================================
-- client_onboarding_command_center_records
-- =========================================================
create table if not exists client_onboarding_command_center_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_name text not null,
  client_domain text,
  client_contact_email text,
  client_contact_phone text,
  onboarding_lead_id uuid references auth.users(id),
  status text not null default 'discovery',
  phase text not null default 'discovery',
  risk_level text not null default 'medium',
  discovery_notes text,
  m365_setup_status text not null default 'not_started',
  m365_tenant_id text,
  m365_licenses jsonb not null default '{}'::jsonb,
  access_collection_status text not null default 'not_started',
  access_credentials jsonb not null default '{}'::jsonb,
  network_baseline_status text not null default 'not_started',
  network_diagram_url text,
  network_scan_results jsonb not null default '{}'::jsonb,
  documentation_status text not null default 'not_started',
  documentation_url text,
  security_baseline_status text not null default 'not_started',
  security_baseline_score integer,
  security_findings jsonb not null default '[]'::jsonb,
  support_handoff_status text not null default 'not_started',
  support_handoff_notes text,
  handoff_completed_at timestamptz,
  next_review_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_onboarding_org on client_onboarding_command_center_records(organization_id);
create index if not exists idx_client_onboarding_status on client_onboarding_command_center_records(status);
create index if not exists idx_client_onboarding_phase on client_onboarding_command_center_records(phase);
create index if not exists idx_client_onboarding_risk on client_onboarding_command_center_records(risk_level);
create index if not exists idx_client_onboarding_lead on client_onboarding_command_center_records(onboarding_lead_id);
create index if not exists idx_client_onboarding_next_review on client_onboarding_command_center_records(next_review_at);
create index if not exists idx_client_onboarding_created on client_onboarding_command_center_records(created_at desc);

alter table client_onboarding_command_center_records enable row level security;

create policy "client_onboarding_select_org" on client_onboarding_command_center_records for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "client_onboarding_insert_auth" on client_onboarding_command_center_records for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "client_onboarding_update_org" on client_onboarding_command_center_records for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "client_onboarding_delete_admin" on client_onboarding_command_center_records for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = client_onboarding_command_center_records.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- =========================================================
-- client_onboarding_checklist_items
-- =========================================================
create table if not exists client_onboarding_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  onboarding_record_id uuid not null references client_onboarding_command_center_records(id) on delete cascade,
  phase text not null,
  item_key text not null,
  label text not null,
  description text,
  is_required boolean not null default true,
  is_completed boolean not null default false,
  completed_by uuid references auth.users(id),
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(onboarding_record_id, item_key)
);

create index if not exists idx_onboarding_checklist_record on client_onboarding_checklist_items(onboarding_record_id);
create index if not exists idx_onboarding_checklist_phase on client_onboarding_checklist_items(phase);

alter table client_onboarding_checklist_items enable row level security;

create policy "client_onboarding_checklist_select_org" on client_onboarding_checklist_items for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "client_onboarding_checklist_insert_auth" on client_onboarding_checklist_items for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "client_onboarding_checklist_update_org" on client_onboarding_checklist_items for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "client_onboarding_checklist_delete_admin" on client_onboarding_checklist_items for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = client_onboarding_checklist_items.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

commit;