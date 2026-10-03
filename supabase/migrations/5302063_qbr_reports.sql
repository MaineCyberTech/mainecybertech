-- QBR Executive Report Generator (#11)
begin;

create table if not exists qbr_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  period_start date,
  period_end date,
  status text not null default 'draft',
  visibility text not null default 'internal',
  summary text,
  report_data jsonb not null default '{}'::jsonb,
  generated_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  sent_to_client_at timestamptz,
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_qbr_reports_org on qbr_reports(organization_id);
create index if not exists idx_qbr_reports_status on qbr_reports(status);
create index if not exists idx_qbr_reports_created on qbr_reports(created_at desc);

alter table qbr_reports enable row level security;

create policy "qbr_reports_select_org" on qbr_reports for select
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "qbr_reports_insert_auth" on qbr_reports for insert
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "qbr_reports_update_org" on qbr_reports for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "qbr_reports_delete_admin" on qbr_reports for delete
  using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = qbr_reports.organization_id and r.key in ('super_admin', 'admin')));

commit;
