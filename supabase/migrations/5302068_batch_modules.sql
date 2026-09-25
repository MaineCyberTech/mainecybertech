-- License Optimizer (#22) + Public Status Page (#27) + Website Monitor (#28) + DMARC Coach (#23)
begin;

create table if not exists license_tracking (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vendor text not null,
  product_name text not null,
  total_seats integer default 0,
  assigned_seats integer default 0,
  unused_seats integer default 0,
  cost_per_seat numeric(12,2),
  annual_cost numeric(12,2),
  renewal_date date,
  status text not null default 'active',
  optimization_notes text,
  reclaimable_savings numeric(12,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_license_tracking_org on license_tracking(organization_id);
alter table license_tracking enable row level security;
create policy "license_tracking_select_org" on license_tracking for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "license_tracking_insert_auth" on license_tracking for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "license_tracking_update_org" on license_tracking for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists status_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'info',
  status text not null default 'active',
  is_public boolean default false,
  is_resolved boolean default false,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  resolved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_status_items_org on status_items(organization_id);
create index if not exists idx_status_items_public on status_items(is_public);
alter table status_items enable row level security;
create policy "status_items_select_org" on status_items for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "status_items_insert_auth" on status_items for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "status_items_update_org" on status_items for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists website_monitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  url text not null,
  display_name text,
  status text not null default 'active',
  last_status text default 'unknown',
  last_response_ms integer,
  ssl_expires date,
  ssl_valid boolean default true,
  lighthouse_score integer,
  check_interval_hours integer default 6,
  last_checked_at timestamptz,
  next_check_at timestamptz,
  alerts_enabled boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_monitors_org on website_monitors(organization_id);
alter table website_monitors enable row level security;
create policy "website_monitors_select_org" on website_monitors for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "website_monitors_insert_auth" on website_monitors for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "website_monitors_update_org" on website_monitors for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists dmarc_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  domain text not null,
  spf_record text,
  spf_valid boolean default false,
  dkim_configured boolean default false,
  dkim_selector text,
  dmarc_record text,
  dmarc_policy text,
  dmarc_valid boolean default false,
  dmarc_pct integer,
  bimi_configured boolean default false,
  recommendation_notes text,
  last_checked_at timestamptz,
  status text not null default 'needs_review',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dmarc_assessments_org on dmarc_assessments(organization_id);
create index if not exists idx_dmarc_assessments_domain on dmarc_assessments(domain);
alter table dmarc_assessments enable row level security;
create policy "dmarc_assessments_select_org" on dmarc_assessments for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "dmarc_assessments_insert_auth" on dmarc_assessments for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "dmarc_assessments_update_org" on dmarc_assessments for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
