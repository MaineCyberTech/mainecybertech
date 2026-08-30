-- Dynamic Client Forms Builder
-- Form definitions with JSONB schema + form submissions from clients

create table if not exists dynamic_client_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  form_type text not null default 'intake',
  status text not null default 'draft',
  fields jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  closes_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dynamic_client_forms_org on dynamic_client_forms(organization_id);
create index if not exists idx_dynamic_client_forms_status on dynamic_client_forms(status);
create index if not exists idx_dynamic_client_forms_type on dynamic_client_forms(form_type);

alter table dynamic_client_forms enable row level security;

create policy "dynamic_client_forms_org_read" on dynamic_client_forms
  for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "dynamic_client_forms_org_insert" on dynamic_client_forms
  for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "dynamic_client_forms_org_update" on dynamic_client_forms
  for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "dynamic_client_forms_org_delete" on dynamic_client_forms
  for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

-- Form submissions
create table if not exists dynamic_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references dynamic_client_forms(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  respondent_id uuid references auth.users(id),
  respondent_email text,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dynamic_form_submissions_form on dynamic_form_submissions(form_id);
create index if not exists idx_dynamic_form_submissions_org on dynamic_form_submissions(organization_id);
create index if not exists idx_dynamic_form_submissions_status on dynamic_form_submissions(status);

alter table dynamic_form_submissions enable row level security;

create policy "dynamic_form_submissions_org_read" on dynamic_form_submissions
  for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "dynamic_form_submissions_org_insert" on dynamic_form_submissions
  for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "dynamic_form_submissions_org_update" on dynamic_form_submissions
  for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "dynamic_form_submissions_org_delete" on dynamic_form_submissions
  for delete using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
