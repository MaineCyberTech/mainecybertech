-- Change Advisory Mini-CAB (#33)
--
-- Tables for scheduling CAB meetings and recording decisions on change-requests.
-- Idempotent: guards on table/policy existence so the migration can be re-applied.

begin;

-- ===== cab_meetings =====
create table if not exists cab_meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  scheduled_at timestamptz,
  status text not null default 'scheduled',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_cab_meetings_org on cab_meetings(organization_id);
alter table cab_meetings enable row level security;
drop policy if exists "cab_meetings_select_org" on cab_meetings;
create policy "cab_meetings_select_org" on cab_meetings for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
drop policy if exists "cab_meetings_insert_org" on cab_meetings;
create policy "cab_meetings_insert_org" on cab_meetings for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
drop policy if exists "cab_meetings_update_org" on cab_meetings;
create policy "cab_meetings_update_org" on cab_meetings for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
drop policy if exists "cab_meetings_delete_org" on cab_meetings;
create policy "cab_meetings_delete_org" on cab_meetings for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

-- ===== cab_agenda_items =====
create table if not exists cab_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references cab_meetings(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  change_request_id uuid not null references change_requests(id) on delete cascade,
  decision text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_cab_agenda_items_meeting on cab_agenda_items(meeting_id);
create index if not exists idx_cab_agenda_items_org on cab_agenda_items(organization_id);
alter table cab_agenda_items enable row level security;
drop policy if exists "cab_agenda_items_select_org" on cab_agenda_items;
create policy "cab_agenda_items_select_org" on cab_agenda_items for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
drop policy if exists "cab_agenda_items_insert_org" on cab_agenda_items;
create policy "cab_agenda_items_insert_org" on cab_agenda_items for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
drop policy if exists "cab_agenda_items_update_org" on cab_agenda_items;
create policy "cab_agenda_items_update_org" on cab_agenda_items for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
drop policy if exists "cab_agenda_items_delete_org" on cab_agenda_items;
create policy "cab_agenda_items_delete_org" on cab_agenda_items for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
