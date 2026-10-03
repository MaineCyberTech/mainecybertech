-- GAP-3: Compliance Readiness Lite backend.
--
-- Two org-scoped tables: compliance_frameworks (a framework/category) and
-- compliance_controls (individual controls under a framework, each with a
-- status, owner, and due date). The portal compliance-readiness page reads
-- these via the API SDK.
--
-- RLS: org-scoped policies using DROP POLICY IF EXISTS guards (mirrors the
-- org-scoped policy style used across the schema). Service role (API server)
-- performs writes; members of the organization can read.

create table if not exists public.compliance_frameworks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_controls (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.compliance_frameworks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  status text not null default 'not_started',
  owner text,
  due_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_compliance_frameworks_organization
  on public.compliance_frameworks (organization_id);

create index if not exists idx_compliance_controls_framework
  on public.compliance_controls (framework_id);

create index if not exists idx_compliance_controls_organization
  on public.compliance_controls (organization_id);

alter table public.compliance_frameworks enable row level security;
alter table public.compliance_controls enable row level security;

drop policy if exists "compliance_frameworks_select_org_members" on public.compliance_frameworks;
create policy "compliance_frameworks_select_org_members"
  on public.compliance_frameworks
  for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_org_member(organization_id)
  );

drop policy if exists "compliance_frameworks_insert_org_admins" on public.compliance_frameworks;
create policy "compliance_frameworks_insert_org_admins"
  on public.compliance_frameworks
  for insert
  to authenticated
  with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );

drop policy if exists "compliance_frameworks_update_org_admins" on public.compliance_frameworks;
create policy "compliance_frameworks_update_org_admins"
  on public.compliance_frameworks
  for update
  to authenticated
  using (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  )
  with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );

drop policy if exists "compliance_frameworks_delete_org_admins" on public.compliance_frameworks;
create policy "compliance_frameworks_delete_org_admins"
  on public.compliance_frameworks
  for delete
  to authenticated
  using (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );

drop policy if exists "compliance_controls_select_org_members" on public.compliance_controls;
create policy "compliance_controls_select_org_members"
  on public.compliance_controls
  for select
  to authenticated
  using (
    public.is_super_admin()
    or public.is_org_member(organization_id)
  );

drop policy if exists "compliance_controls_insert_org_admins" on public.compliance_controls;
create policy "compliance_controls_insert_org_admins"
  on public.compliance_controls
  for insert
  to authenticated
  with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );

drop policy if exists "compliance_controls_update_org_admins" on public.compliance_controls;
create policy "compliance_controls_update_org_admins"
  on public.compliance_controls
  for update
  to authenticated
  using (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  )
  with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );

drop policy if exists "compliance_controls_delete_org_admins" on public.compliance_controls;
create policy "compliance_controls_delete_org_admins"
  on public.compliance_controls
  for delete
  to authenticated
  using (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );
