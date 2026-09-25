-- Module 1: per-tenant client-portal module entitlements.
-- The bootstrap payload previously derived enabled modules purely from the
-- subscription status; this lets an MSP admin provision/disable modules per
-- organisation. When an org has rows here they win over the default set.
create table if not exists client_portal_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, module_key)
);

create index if not exists idx_client_portal_entitlements_org
  on client_portal_entitlements(organization_id);

alter table client_portal_entitlements enable row level security;

create policy "cpe_select_org" on client_portal_entitlements
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );
create policy "cpe_insert_org" on client_portal_entitlements
  for insert with check (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );
create policy "cpe_update_org" on client_portal_entitlements
  for update using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );
