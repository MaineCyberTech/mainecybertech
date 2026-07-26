-- M365 Tenant Hardening (#3) + Security Incident Response (#7) + Anti-Vishing (#16) + Endpoint Security (#51)
begin;

create table if not exists m365_hardening (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  tenant_domain text not null,
  mfa_enforced boolean default false,
  conditional_access_configured boolean default false,
  legacy_auth_blocked boolean default false,
  admin_count integer default 0,
  guest_count integer default 0,
  shared_mailbox_count integer default 0,
  audit_logging_enabled boolean default false,
  dlp_configured boolean default false,
  defender_configured boolean default false,
  last_assessment_at timestamptz,
  next_review_at timestamptz,
  overall_score integer,
  status text not null default 'needs_review',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_m365_hardening_org on m365_hardening(organization_id);
alter table m365_hardening enable row level security;
create policy "m365_select_org" on m365_hardening for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "m365_insert_auth" on m365_hardening for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "m365_update_org" on m365_hardening for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists incident_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  incident_type text not null,
  title text not null,
  description text,
  severity text not null default 'medium',
  detected_at timestamptz,
  contained_at timestamptz,
  eradicated_at timestamptz,
  recovered_at timestamptz,
  closed_at timestamptz,
  affected_systems text,
  root_cause text,
  lessons_learned text,
  status text not null default 'detected',
  lead_user_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_incident_responses_org on incident_responses(organization_id);
create index if not exists idx_incident_responses_status on incident_responses(status);
alter table incident_responses enable row level security;
create policy "incident_select_org" on incident_responses for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "incident_insert_auth" on incident_responses for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "incident_update_org" on incident_responses for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists identity_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requestor_name text not null,
  requestor_email text,
  verification_method text not null,
  verification_pass boolean default false,
  action_authorized text,
  authorized_by uuid references auth.users(id),
  authorized_at timestamptz,
  notes text,
  status text not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_identity_verifications_org on identity_verifications(organization_id);
alter table identity_verifications enable row level security;
create policy "idverify_select_org" on identity_verifications for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "idverify_insert_auth" on identity_verifications for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "idverify_update_org" on identity_verifications for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists endpoint_security (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  device_group text not null,
  total_endpoints integer default 0,
  av_installed integer default 0,
  disk_encrypted integer default 0,
  mdm_enrolled integer default 0,
  local_admin_removed integer default 0,
  firewall_enabled integer default 0,
  edr_deployed integer default 0,
  coverage_pct numeric(5,2),
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_endpoint_security_org on endpoint_security(organization_id);
alter table endpoint_security enable row level security;
create policy "ep_select_org" on endpoint_security for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ep_insert_auth" on endpoint_security for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "ep_update_org" on endpoint_security for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
