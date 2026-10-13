-- =========================================================
-- 5302407: Network Diagram Builder (GAP module 47)
--
-- Redefines the `network_diagrams` table with the diagram-builder
-- schema (name + description + diagram jsonb of nodes/edges),
-- replacing the earlier field-services staging columns.
--
-- Re-runnable but destructive: DROP TABLE IF EXISTS precedes the CREATE, so
-- re-applying drops the current table (and every row in it) before recreating
-- it. The begin;/commit; wrapper keeps a fresh replay atomic (DATA-P2-002).
--
-- Rollback: drop this table, re-create the 5302072 field-services shape
-- (site_name / diagram_data / device_count / vlan_count / wan_count /
-- wireless_zones / camera_zones / notes / status / created_by) and the
-- "nd_*" policies, then restore rows from the pre-migration backup — the
-- drop discards them (see docs/migrations/README.md).
-- =========================================================

begin;

drop table if exists network_diagrams;

create table network_diagrams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  diagram jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_network_diagrams_org on network_diagrams(organization_id);

alter table network_diagrams enable row level security;

-- Org-scoped RLS: a user may only see / mutate diagrams belonging to
-- organizations they are a member of.
drop policy if exists network_diagrams_select on network_diagrams;
create policy network_diagrams_select on network_diagrams
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

drop policy if exists network_diagrams_insert on network_diagrams;
create policy network_diagrams_insert on network_diagrams
  for insert with check (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

drop policy if exists network_diagrams_update on network_diagrams;
create policy network_diagrams_update on network_diagrams
  for update using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

drop policy if exists network_diagrams_delete on network_diagrams;
create policy network_diagrams_delete on network_diagrams
  for delete using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

commit;
