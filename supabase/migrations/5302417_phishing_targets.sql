-- Module 37: phishing simulation targets.
-- The campaign table tracked counts but had no recipient list, so the worker
-- could never actually send a simulation. This adds the target list.
create table if not exists phishing_targets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references phishing_campaigns(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  name text,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create index if not exists idx_phishing_targets_campaign on phishing_targets(campaign_id);
create index if not exists idx_phishing_targets_status on phishing_targets(status);

alter table phishing_targets enable row level security;

create policy "pt_select_org" on phishing_targets
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );
create policy "pt_insert_org" on phishing_targets
  for insert with check (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );
create policy "pt_delete_org" on phishing_targets
  for delete using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );
