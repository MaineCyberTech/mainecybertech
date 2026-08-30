-- AI Ticket Intake Triage Assistant (#21)
begin;

create table if not exists ticket_triage_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  raw_description text not null,
  suggested_category text,
  suggested_priority text default 'normal',
  suggested_subject text,
  missing_info text[],
  first_response_draft text,
  confidence_score integer default 0,
  status text not null default 'draft',
  converted_ticket_id uuid references tickets(id) on delete set null,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ticket_triage_drafts_org on ticket_triage_drafts(organization_id);
create index if not exists idx_ticket_triage_drafts_status on ticket_triage_drafts(status);

alter table ticket_triage_drafts enable row level security;

create policy "triage_drafts_select_org" on ticket_triage_drafts for select
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "triage_drafts_insert_auth" on ticket_triage_drafts for insert
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "triage_drafts_update_org" on ticket_triage_drafts for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

commit;
