begin;

create table if not exists score_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category text not null,
  score integer not null,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_score_history_org on score_history(organization_id);
alter table score_history enable row level security;
create policy "sh_org" on score_history for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "sh_org_i" on score_history for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create table if not exists badges_earned (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  badge_name text not null,
  category text,
  earned_at timestamptz not null default now(),
  points integer not null default 0
);
create index if not exists idx_badges_earned_org on badges_earned(organization_id);
alter table badges_earned enable row level security;
create policy "be_org" on badges_earned for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "be_org_i" on badges_earned for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
