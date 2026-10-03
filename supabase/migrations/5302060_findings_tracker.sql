-- Open Findings Audit Remediation Tracker (#19)
-- P0/P1/P2/P3 finding lifecycle across assessments
begin;

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'p2',
  status text not null default 'open',
  source text not null default 'security',
  visibility text not null default 'internal',
  finding_category text,
  remediation_plan text,
  remediation_deadline timestamptz,
  verification_steps text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  affected_systems text,
  controls_impacted text,
  owner_user_id uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_findings_org on findings(organization_id);
create index if not exists idx_findings_status on findings(status);
create index if not exists idx_findings_severity on findings(severity);
create index if not exists idx_findings_source on findings(source);
create index if not exists idx_findings_owner on findings(owner_user_id);
create index if not exists idx_findings_deadline on findings(remediation_deadline);

alter table findings enable row level security;

create policy "findings_select_org" on findings for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "findings_insert_auth" on findings for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "findings_update_org" on findings for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "findings_delete_admin" on findings for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = findings.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

commit;
