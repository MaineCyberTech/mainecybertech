-- Phase 3 Field Services: ISP Assessment (#4) + UniFi Survey (#5) + Port Map (#29) + Camera Calc (#30) + Hardware Staging (#45) + Network Diagram (#47)
begin;

create table if not exists isp_assessments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade,
  client_name text not null, current_provider text, current_cost numeric(12,2), recommended_provider text, recommended_cost numeric(12,2),
  services text, bandwidth_current text, bandwidth_needed text, contract_status text default 'unknown',
  phone_lines integer default 0, voip_ready boolean default false, notes text, status text not null default 'draft',
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_isp_assessments_org on isp_assessments(organization_id);
alter table isp_assessments enable row level security;
create policy "isp_select_org" on isp_assessments for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "isp_insert_auth" on isp_assessments for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "isp_update_org" on isp_assessments for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists unifi_surveys (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade,
  site_name text not null, site_address text, access_points integer default 0, switches integer default 0,
  cameras integer default 0, nvr_estimated_storage_tb numeric(6,2), outdoor_aps integer default 0,
  cable_runs_estimated integer default 0, poe_budget_watts integer, survey_date date,
  notes text, status text not null default 'draft', created_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_unifi_surveys_org on unifi_surveys(organization_id);
alter table unifi_surveys enable row level security;
create policy "us_select_org" on unifi_surveys for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "us_insert_auth" on unifi_surveys for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "us_update_org" on unifi_surveys for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists port_maps (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade,
  switch_name text not null, port_number integer not null, vlan_id integer, vlan_name text,
  wall_jack_label text, connected_device text, device_type text, uplink boolean default false,
  poe_enabled boolean default false, speed text default '1G', notes text,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_port_maps_org on port_maps(organization_id);
alter table port_maps enable row level security;
create policy "pm_select_org" on port_maps for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "pm_insert_auth" on port_maps for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "pm_update_org" on port_maps for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists camera_calculations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade,
  site_name text not null, camera_count integer default 1, avg_bitrate_mbps numeric(6,2) default 4,
  resolution text default '4MP', retention_days integer default 30, estimated_storage_tb numeric(8,2),
  recommended_nvr text, notes text, status text not null default 'draft',
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_camera_calculations_org on camera_calculations(organization_id);
alter table camera_calculations enable row level security;
create policy "cc_select_org" on camera_calculations for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cc_insert_auth" on camera_calculations for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cc_update_org" on camera_calculations for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists hardware_staging (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade,
  device_type text not null, device_name text not null, serial_number text, asset_tag text,
  configured boolean default false, tested boolean default false, labeled boolean default false,
  imaged boolean default false, qa_verified boolean default false, staged_by uuid references auth.users(id),
  staged_at timestamptz, notes text, status text not null default 'pending',
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_hardware_staging_org on hardware_staging(organization_id);
alter table hardware_staging enable row level security;
create policy "hs_select_org" on hardware_staging for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "hs_insert_auth" on hardware_staging for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "hs_update_org" on hardware_staging for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists network_diagrams (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade,
  site_name text not null, diagram_data jsonb not null default '{}'::jsonb, device_count integer default 0,
  vlan_count integer default 0, wan_count integer default 0, wireless_zones integer default 0,
  camera_zones integer default 0, notes text, status text not null default 'draft',
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_network_diagrams_org on network_diagrams(organization_id);
alter table network_diagrams enable row level security;
create policy "nd_select_org" on network_diagrams for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "nd_insert_auth" on network_diagrams for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "nd_update_org" on network_diagrams for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
