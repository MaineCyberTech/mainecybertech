-- MSP Proposal Builder Pricing Engine (#10)
-- Proposals, phases, line items, pricing for client-facing MSP proposals
begin;

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft',
  visibility text not null default 'internal',
  total_labor numeric(12,2) default 0,
  total_materials numeric(12,2) default 0,
  total_recurring numeric(12,2) default 0,
  total_one_time numeric(12,2) default 0,
  grand_total numeric(12,2) default 0,
  valid_until timestamptz,
  sent_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  approval_request_id uuid references approval_requests(id) on delete set null,
  owner_user_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_org on proposals(organization_id);
create index if not exists idx_proposals_status on proposals(status);
create index if not exists idx_proposals_owner on proposals(owner_user_id);
create index if not exists idx_proposals_valid_until on proposals(valid_until);

alter table proposals enable row level security;

create policy "proposals_select_org" on proposals for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "proposals_insert_auth" on proposals for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "proposals_update_org" on proposals for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "proposals_delete_admin" on proposals for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = proposals.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- Proposal phases / sections
create table if not exists proposal_phases (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  description text,
  assumptions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposal_phases_proposal on proposal_phases(proposal_id);

alter table proposal_phases enable row level security;

create policy "proposal_phases_select_org" on proposal_phases for select
  using (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships where user_id = auth.uid()
      )
    )
  );

create policy "proposal_phases_insert_auth" on proposal_phases for insert
  with check (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships where user_id = auth.uid()
      )
    )
  );

create policy "proposal_phases_update_org" on proposal_phases for update
  using (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships where user_id = auth.uid()
      )
    )
  );

create policy "proposal_phases_delete_admin" on proposal_phases for delete
  using (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships m
        join roles r on m.role_id = r.id
        where m.user_id = auth.uid()
        and r.key in ('super_admin', 'admin')
      )
    )
  );

-- Line items within each phase
create table if not exists proposal_line_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  phase_id uuid references proposal_phases(id) on delete set null,
  sort_order integer not null default 0,
  item_type text not null default 'labor',
  name text not null,
  description text,
  quantity numeric(12,2) default 1,
  unit_price numeric(12,2) default 0,
  total_price numeric(12,2) default 0,
  is_optional boolean not null default false,
  is_recurring boolean not null default false,
  recurring_interval text default 'monthly',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposal_line_items_proposal on proposal_line_items(proposal_id);
create index if not exists idx_proposal_line_items_phase on proposal_line_items(phase_id);

alter table proposal_line_items enable row level security;

create policy "proposal_line_items_select_org" on proposal_line_items for select
  using (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships where user_id = auth.uid()
      )
    )
  );

create policy "proposal_line_items_insert_auth" on proposal_line_items for insert
  with check (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships where user_id = auth.uid()
      )
    )
  );

create policy "proposal_line_items_update_org" on proposal_line_items for update
  using (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships where user_id = auth.uid()
      )
    )
  );

create policy "proposal_line_items_delete_admin" on proposal_line_items for delete
  using (
    proposal_id in (
      select id from proposals where organization_id in (
        select organization_id from memberships m
        join roles r on m.role_id = r.id
        where m.user_id = auth.uid()
        and r.key in ('super_admin', 'admin')
      )
    )
  );

commit;
