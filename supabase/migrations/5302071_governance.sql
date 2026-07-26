-- Mini-CAB (#33) + Risk Register (#52) + Data Retention (#53) + Tabletop Exercises (#59)
begin;

create table if not exists change_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  change_type text not null default 'standard',
  risk_level text default 'low',
  rollback_plan text,
  implementation_date timestamptz,
  verification_steps text,
  status text not null default 'draft',
  requester_id uuid references auth.users(id),
  approver_id uuid references auth.users(id),
  implemented_by uuid references auth.users(id),
  implemented_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_change_requests_org on change_requests(organization_id);
alter table change_requests enable row level security;
create policy "cr_select_org" on change_requests for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cr_insert_auth" on change_requests for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "cr_update_org" on change_requests for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists risk_register (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  risk_description text not null,
  risk_category text not null default 'security',
  likelihood text default 'medium',
  impact text default 'medium',
  risk_score integer,
  mitigating_controls text,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  acceptance_expires timestamptz,
  compensating_controls text,
  status text not null default 'identified',
  owner_user_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_risk_register_org on risk_register(organization_id);
alter table risk_register enable row level security;
create policy "risk_select_org" on risk_register for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "risk_insert_auth" on risk_register for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "risk_update_org" on risk_register for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists retention_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  data_category text not null,
  system_name text not null,
  retention_period_days integer not null,
  disposal_method text,
  is_regulated boolean default false,
  regulation_reference text,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_retention_policies_org on retention_policies(organization_id);
alter table retention_policies enable row level security;
create policy "retention_select_org" on retention_policies for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "retention_insert_auth" on retention_policies for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "retention_update_org" on retention_policies for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists tabletop_exercises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  scenario text not null,
  scenario_type text default 'cyber_incident',
  participants text,
  scheduled_date timestamptz,
  completed_at timestamptz,
  facilitator_id uuid references auth.users(id),
  notes text,
  action_items text,
  after_action_report text,
  status text not null default 'planned',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tabletop_exercises_org on tabletop_exercises(organization_id);
alter table tabletop_exercises enable row level security;
create policy "tt_select_org" on tabletop_exercises for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "tt_insert_auth" on tabletop_exercises for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "tt_update_org" on tabletop_exercises for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
