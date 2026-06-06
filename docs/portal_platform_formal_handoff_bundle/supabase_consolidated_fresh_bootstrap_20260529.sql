-- =========================================================
-- SUPABASE CONSOLIDATED FRESH BOOTSTRAP
-- Generated: 2026-05-29
--
-- PURPOSE
--   Fresh / empty environment consolidated bootstrap that merges:
--   - original base migrations 001-006
--   - projects extension schema/policies/RPCs
--   - documents schema/policy/storage alignment
--
-- DIFFERENCE FROM THE ORIGINAL BASE CHAIN
--   The document_visibility enum is created as:
--     private, org, internal, public
-- =========================================================

-- =========================================================
-- INIT: extensions + enums
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- =========================================================
-- ENUMS
-- =========================================================
create type public.membership_status as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type public.org_status as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type public.ticket_status as enum (
  'new',
  'triaged',
  'in_progress',
  'waiting_on_client',
  'resolved',
  'closed'
);

create type public.ticket_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type public.project_status as enum (
  'planned',
  'active',
  'blocked',
  'client_review',
  'completed',
  'archived'
);

create type public.task_status as enum (
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'done'
);

create type public.contract_status as enum (
  'draft',
  'in_review',
  'pending_signature',
  'signed',
  'expired',
  'cancelled'
);

create type public.invoice_status as enum (
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible',
  'overdue'
);

create type public.document_visibility as enum (
  'private',
  'org',
  'internal',
  'public'
);

create type public.comment_target_type as enum (
  'ticket',
  'project',
  'task',
  'document',
  'contract'
);

create type public.notification_channel as enum (
  'email',
  'sms',
  'in_app'
);

create type public.audit_actor_type as enum (
  'user',
  'system',
  'service'
);

-- =========================================================
-- CORE TENANCY / RBAC
-- =========================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  status public.org_status not null default 'pending',
  primary_domain citext,
  billing_email citext,
  support_plan text,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain citext not null unique,
  auto_approve boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_organization_domains_org_id
  on public.organization_domains (organization_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email citext,
  phone text,
  title text,
  avatar_url text,
  is_super_admin boolean not null default false,
  default_organization_id uuid references public.organizations(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  action_key text not null,
  description text,
  unique (module_key, action_key)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status public.membership_status not null default 'pending',
  invited_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  job_title text,
  is_billing_contact boolean not null default false,
  is_security_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_memberships_org_id on public.memberships (organization_id);
create index idx_memberships_user_id on public.memberships (user_id);

create table public.user_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  is_allowed boolean not null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, permission_id)
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  channel public.notification_channel not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, module_key, channel)
);

-- =========================================================
-- AUTH / PROFILE BOOTSTRAP
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    metadata
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- =========================================================
-- ONBOARDING
-- =========================================================

create table public.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  status text not null default 'draft',
  progress_percent int not null default 0,
  company_profile jsonb not null default '{}'::jsonb,
  contacts jsonb not null default '[]'::jsonb,
  technical_environment jsonb not null default '{}'::jsonb,
  service_requirements jsonb not null default '{}'::jsonb,
  security_requirements jsonb not null default '{}'::jsonb,
  uploaded_artifacts jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_onboarding_org_id on public.onboarding_submissions (organization_id);

-- =========================================================
-- SUPPORT TICKETS
-- =========================================================

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  external_jsm_issue_key text,
  title text not null,
  description text,
  status public.ticket_status not null default 'new',
  priority public.ticket_priority not null default 'normal',
  category text,
  source text not null default 'portal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_org_id on public.tickets (organization_id);
create index idx_tickets_status on public.tickets (status);

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_ticket_comments_ticket_id on public.ticket_comments (ticket_id);

-- =========================================================
-- PROJECTS / TASKS / GENERIC COMMENTS
-- =========================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  owner_id uuid references auth.users(id),
  external_jira_project_key text,
  name text not null,
  description text,
  status public.project_status not null default 'planned',
  start_date date,
  due_date date,
  progress_percent int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_org_id on public.projects (organization_id);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text,
  primary key (project_id, user_id)
);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  owner_id uuid references auth.users(id),
  external_jira_issue_key text,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  due_date date,
  sort_order int not null default 0,
  estimate_hours numeric(10,2),
  actual_hours numeric(10,2),
  approval_required boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_tasks_project_id on public.project_tasks (project_id);
create index idx_project_tasks_org_id on public.project_tasks (organization_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  target_type public.comment_target_type not null,
  target_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_org_target on public.comments (organization_id, target_type, target_id);

-- =========================================================
-- DOCUMENTS / FILES / VERSIONS / ACCESS
-- =========================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  name text not null,
  folder_path text,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  visibility public.document_visibility not null default 'org',
  current_version int not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_org_id on public.documents (organization_id);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number int not null,
  storage_path text not null,
  uploaded_by uuid not null references auth.users(id),
  checksum text,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table public.document_permissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_share boolean not null default false
);

create index idx_document_permissions_document_id on public.document_permissions (document_id);

-- =========================================================
-- CONTRACTS / ESIGN
-- =========================================================

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  status public.contract_status not null default 'draft',
  external_signature_provider text,
  external_envelope_id text,
  effective_date date,
  expiration_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contracts_org_id on public.contracts (organization_id);

create table public.contract_signers (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  user_id uuid references auth.users(id),
  email citext not null,
  signer_name text,
  signing_order int not null default 1,
  signed_at timestamptz,
  status text not null default 'pending'
);

create index idx_contract_signers_contract_id on public.contract_signers (contract_id);

-- =========================================================
-- APPOINTMENTS / CALENDAR
-- =========================================================

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  owner_id uuid references auth.users(id),
  external_calendar_event_id text,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  meeting_url text,
  type text not null default 'meeting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_org_id on public.appointments (organization_id);

-- =========================================================
-- BILLING / STRIPE MIRROR TABLES
-- =========================================================

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  billing_email citext,
  default_payment_method text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  plan_name text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  amount_cents bigint,
  currency text default 'usd',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_org_id on public.subscriptions (organization_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_invoice_id text unique,
  invoice_number text,
  status public.invoice_status not null default 'draft',
  subtotal_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,
  currency text not null default 'usd',
  hosted_invoice_url text,
  invoice_pdf_url text,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_org_id on public.invoices (organization_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  stripe_payment_intent_id text unique,
  amount_cents bigint not null,
  currency text not null default 'usd',
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_payments_org_id on public.payments (organization_id);

-- =========================================================
-- LIVE CHAT / MESSAGES
-- =========================================================

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chat_threads_org_id on public.chat_threads (organization_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid references auth.users(id),
  body text not null,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_thread_id on public.chat_messages (thread_id);

-- =========================================================
-- AUDIT LOGS
-- =========================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type public.audit_actor_type not null default 'user',
  action text not null,
  entity_type text not null,
  entity_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_org_created_at
  on public.audit_logs (organization_id, created_at desc);

create index idx_audit_logs_actor_user_id
  on public.audit_logs (actor_user_id);

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_super_admin = true
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_approved_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'approved'
  );
$$;

create or replace function public.user_has_role(org_id uuid, role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'approved'
      and r.key = any(role_keys)
  );
$$;

create or replace function public.user_has_permission(org_id uuid, module_name text, action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with base_permission as (
    select exists (
      select 1
      from public.memberships m
      join public.roles r on r.id = m.role_id
      join public.role_permissions rp on rp.role_id = r.id
      join public.permissions p on p.id = rp.permission_id
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and p.module_key = module_name
        and p.action_key = action_name
    ) as allowed
  ),
  override_permission as (
    select uo.is_allowed
    from public.user_permission_overrides uo
    join public.permissions p on p.id = uo.permission_id
    where uo.organization_id = org_id
      and uo.user_id = auth.uid()
      and p.module_key = module_name
      and p.action_key = action_name
    limit 1
  )
  select coalesce((select is_allowed from override_permission), (select allowed from base_permission), false);
$$;

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute procedure public.set_updated_at();

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger trg_memberships_updated_at
before update on public.memberships
for each row execute procedure public.set_updated_at();

create trigger trg_onboarding_updated_at
before update on public.onboarding_submissions
for each row execute procedure public.set_updated_at();

create trigger trg_tickets_updated_at
before update on public.tickets
for each row execute procedure public.set_updated_at();

create trigger trg_projects_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

create trigger trg_project_tasks_updated_at
before update on public.project_tasks
for each row execute procedure public.set_updated_at();

create trigger trg_documents_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();

create trigger trg_contracts_updated_at
before update on public.contracts
for each row execute procedure public.set_updated_at();

create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute procedure public.set_updated_at();

create trigger trg_billing_customers_updated_at
before update on public.billing_customers
for each row execute procedure public.set_updated_at();

create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute procedure public.set_updated_at();

create trigger trg_chat_threads_updated_at
before update on public.chat_threads
for each row execute procedure public.set_updated_at();

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.organizations enable row level security;
alter table public.organization_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.memberships enable row level security;
alter table public.user_permission_overrides enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.onboarding_submissions enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks enable row level security;
alter table public.comments enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_permissions enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_signers enable row level security;
alter table public.appointments enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.audit_logs enable row level security;

-- =========================================================
-- SYSTEM LOOKUP TABLE POLICIES
-- =========================================================

create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

create policy "permissions_select_authenticated"
on public.permissions
for select
to authenticated
using (true);

create policy "role_permissions_select_authenticated"
on public.role_permissions
for select
to authenticated
using (true);

-- =========================================================
-- ORGANIZATION / MEMBERSHIP / PROFILE POLICIES
-- =========================================================

create policy "organizations_select_same_org_or_super_admin"
on public.organizations
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(id)
);

create policy "organizations_insert_super_admin_only"
on public.organizations
for insert
to authenticated
with check (public.is_super_admin());

create policy "organizations_update_admin_or_super_admin"
on public.organizations
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(id, array['admin', 'super_admin', 'client_admin'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(id, array['admin', 'super_admin', 'client_admin'])
);

create policy "organization_domains_select_admins"
on public.organization_domains
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
);

create policy "organization_domains_manage_admins"
on public.organization_domains
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin'])
);

create policy "profiles_select_self_same_org_or_super_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.memberships m1
    join public.memberships m2 on m1.organization_id = m2.organization_id
    where m1.user_id = auth.uid()
      and m1.status = 'approved'
      and m2.user_id = profiles.id
      and m2.status = 'approved'
  )
);

create policy "profiles_update_self_or_super_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
)
with check (
  id = auth.uid()
  or public.is_super_admin()
);

create policy "memberships_select_same_org_or_super_admin"
on public.memberships
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_member(organization_id)
);

create policy "memberships_manage_admin_or_super_admin"
on public.memberships
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
);

create policy "user_permission_overrides_admin_only"
on public.user_permission_overrides
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin'])
);

create policy "notification_preferences_select_self_or_admin"
on public.notification_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_org_approved_member(organization_id)
  or public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
);

create policy "notification_preferences_upsert_self_or_admin"
on public.notification_preferences
for all
to authenticated
using (
  (user_id = auth.uid() and public.is_org_approved_member(organization_id))
  or public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
)
with check (
  (user_id = auth.uid() and public.is_org_approved_member(organization_id))
  or public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
);

-- =========================================================
-- ONBOARDING POLICIES
-- =========================================================

create policy "onboarding_select_same_org"
on public.onboarding_submissions
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "onboarding_insert_same_org"
on public.onboarding_submissions
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    submitted_by = auth.uid()
    and public.is_org_approved_member(organization_id)
    and public.user_has_permission(organization_id, 'onboarding', 'create')
  )
);

create policy "onboarding_update_same_org"
on public.onboarding_submissions
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'onboarding', 'update')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'onboarding', 'update')
);

-- =========================================================
-- TICKET POLICIES
-- =========================================================

create policy "tickets_select_same_org"
on public.tickets
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "tickets_insert_same_org"
on public.tickets
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    created_by = auth.uid()
    and public.is_org_approved_member(organization_id)
    and public.user_has_permission(organization_id, 'tickets', 'create')
  )
);

create policy "tickets_update_with_permission"
on public.tickets
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'tickets', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'tickets', 'manage')
);

create policy "ticket_comments_select_same_org"
on public.ticket_comments
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "ticket_comments_insert_same_org"
on public.ticket_comments
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    author_id = auth.uid()
    and public.is_org_approved_member(organization_id)
    and public.user_has_permission(organization_id, 'tickets', 'comment')
  )
);

-- =========================================================
-- PROJECT / TASK / COMMENT POLICIES
-- =========================================================

create policy "projects_select_same_org"
on public.projects
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "projects_insert_with_permission"
on public.projects
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    created_by = auth.uid()
    and public.user_has_permission(organization_id, 'projects', 'create')
  )
);

create policy "projects_update_with_permission"
on public.projects
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

create policy "project_members_select_same_org"
on public.project_members
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.is_org_approved_member(p.organization_id)
  )
);

create policy "project_members_manage_with_permission"
on public.project_members
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.user_has_permission(p.organization_id, 'projects', 'manage')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.user_has_permission(p.organization_id, 'projects', 'manage')
  )
);

create policy "project_tasks_select_same_org"
on public.project_tasks
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "project_tasks_insert_with_permission"
on public.project_tasks
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    created_by = auth.uid()
    and public.user_has_permission(organization_id, 'projects', 'create')
  )
);

create policy "project_tasks_update_with_permission"
on public.project_tasks
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

create policy "comments_select_same_org"
on public.comments
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "comments_insert_same_org"
on public.comments
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    author_id = auth.uid()
    and public.is_org_approved_member(organization_id)
  )
);

-- =========================================================
-- DOCUMENT / CONTRACT POLICIES
-- =========================================================

create policy "documents_select_same_org"
on public.documents
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "documents_insert_with_permission"
on public.documents
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    uploaded_by = auth.uid()
    and public.user_has_permission(organization_id, 'documents', 'upload')
  )
);

create policy "documents_update_with_permission"
on public.documents
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'manage')
);

create policy "document_versions_select_same_org"
on public.document_versions
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_versions.document_id
      and public.is_org_approved_member(d.organization_id)
  )
);

create policy "document_versions_insert_with_permission"
on public.document_versions
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_versions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'upload')
  )
);

create policy "document_permissions_select_admins"
on public.document_permissions
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
);

create policy "document_permissions_manage_admins"
on public.document_permissions
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
);

create policy "contracts_select_same_org"
on public.contracts
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "contracts_insert_with_permission"
on public.contracts
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    created_by = auth.uid()
    and public.user_has_permission(organization_id, 'contracts', 'create')
  )
);

create policy "contracts_update_with_permission"
on public.contracts
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'contracts', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'contracts', 'manage')
);

create policy "contract_signers_select_same_org"
on public.contract_signers
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.contracts c
    where c.id = contract_signers.contract_id
      and public.is_org_approved_member(c.organization_id)
  )
);

create policy "contract_signers_manage_with_permission"
on public.contract_signers
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.contracts c
    where c.id = contract_signers.contract_id
      and public.user_has_permission(c.organization_id, 'contracts', 'manage')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.contracts c
    where c.id = contract_signers.contract_id
      and public.user_has_permission(c.organization_id, 'contracts', 'manage')
  )
);

-- =========================================================
-- APPOINTMENTS POLICIES
-- =========================================================

create policy "appointments_select_same_org"
on public.appointments
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "appointments_insert_with_permission"
on public.appointments
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    created_by = auth.uid()
    and public.user_has_permission(organization_id, 'appointments', 'schedule')
  )
);

create policy "appointments_update_with_permission"
on public.appointments
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'appointments', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'appointments', 'manage')
);

-- =========================================================
-- BILLING POLICIES
-- =========================================================

create policy "billing_customers_select_same_org"
on public.billing_customers
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "billing_customers_manage_admins"
on public.billing_customers
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
);

create policy "subscriptions_select_same_org"
on public.subscriptions
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "subscriptions_manage_admins"
on public.subscriptions
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
);

create policy "invoices_select_same_org"
on public.invoices
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "invoices_manage_admins"
on public.invoices
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
);

create policy "payments_select_same_org"
on public.payments
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "payments_manage_admins"
on public.payments
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'billing', 'manage')
);

-- =========================================================
-- CHAT POLICIES
-- =========================================================

create policy "chat_threads_select_same_org"
on public.chat_threads
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "chat_threads_insert_same_org"
on public.chat_threads
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    created_by = auth.uid()
    and public.is_org_approved_member(organization_id)
  )
);

create policy "chat_threads_update_same_org"
on public.chat_threads
for update
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
)
with check (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "chat_messages_select_same_org"
on public.chat_messages
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "chat_messages_insert_same_org"
on public.chat_messages
for insert
to authenticated
with check (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

-- =========================================================
-- AUDIT LOG POLICIES
-- =========================================================

create policy "audit_logs_select_admins"
on public.audit_logs
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin'])
);

create policy "audit_logs_insert_server_or_admin"
on public.audit_logs
for insert
to authenticated
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin'])
);

-- =========================================================
-- PROJECTS EXTENSION SCHEMA (fresh bootstrap aligned)
-- =========================================================
begin;

alter table public.projects
  add column if not exists priority text not null default 'normal',
  add column if not exists starts_at timestamptz,
  add column if not exists due_at timestamptz;

create index if not exists idx_projects_org_created_at
  on public.projects (organization_id, created_at desc);
create index if not exists idx_projects_org_due_at
  on public.projects (organization_id, due_at);

alter table public.project_tasks
  add column if not exists details text,
  add column if not exists due_at timestamptz;

create index if not exists idx_project_tasks_owner_id
  on public.project_tasks (owner_id);
create index if not exists idx_project_tasks_project_sort
  on public.project_tasks (project_id, sort_order, created_at);
create index if not exists idx_project_tasks_org_due_at
  on public.project_tasks (organization_id, due_at);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_internal boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_project_updates_project_created
  on public.project_updates (project_id, created_at);
create index if not exists idx_project_updates_project_pinned_created
  on public.project_updates (project_id, is_pinned desc, created_at asc);
create index if not exists idx_project_updates_org_created
  on public.project_updates (organization_id, created_at desc);

drop trigger if exists trg_project_updates_updated_at on public.project_updates;
create trigger trg_project_updates_updated_at
before update on public.project_updates
for each row execute function public.set_updated_at();

create table if not exists public.project_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_project_task_comments_task_created
  on public.project_task_comments (task_id, created_at);
create index if not exists idx_project_task_comments_project_created
  on public.project_task_comments (project_id, created_at);
create index if not exists idx_project_task_comments_org_internal_created
  on public.project_task_comments (organization_id, is_internal, created_at);

create table if not exists public.project_task_comment_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, task_id)
);
create index if not exists idx_project_task_comment_reads_org_user
  on public.project_task_comment_reads (organization_id, user_id, last_seen_at);

commit;

-- =========================================================
-- PROJECTS EXTENSION POLICIES
-- =========================================================
begin;

alter table public.project_updates enable row level security;
alter table public.project_task_comments enable row level security;
alter table public.project_task_comment_reads enable row level security;

drop policy if exists project_tasks_delete_with_permission on public.project_tasks;
create policy project_tasks_delete_with_permission
on public.project_tasks
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_updates_select_admin_manage on public.project_updates;
create policy project_updates_select_admin_manage
on public.project_updates
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_updates_insert_admin_manage on public.project_updates;
create policy project_updates_insert_admin_manage
on public.project_updates
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    public.is_super_admin()
    or public.user_has_permission(organization_id, 'projects', 'manage')
  )
);

drop policy if exists project_updates_update_admin_manage on public.project_updates;
create policy project_updates_update_admin_manage
on public.project_updates
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_updates_delete_admin_manage on public.project_updates;
create policy project_updates_delete_admin_manage
on public.project_updates
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_updates_select_client_visible on public.project_updates;
create policy project_updates_select_client_visible
on public.project_updates
for select
to authenticated
using (
  is_internal = false
  and public.is_org_approved_member(organization_id)
);

drop policy if exists project_updates_insert_same_org on public.project_updates;
create policy project_updates_insert_same_org
on public.project_updates
for insert
to authenticated
with check (
  is_internal = false
  and author_id = auth.uid()
  and public.is_org_approved_member(organization_id)
);

drop policy if exists project_task_comments_select_admin_manage on public.project_task_comments;
create policy project_task_comments_select_admin_manage
on public.project_task_comments
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_task_comments_insert_admin_manage on public.project_task_comments;
create policy project_task_comments_insert_admin_manage
on public.project_task_comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    public.is_super_admin()
    or public.user_has_permission(organization_id, 'projects', 'manage')
  )
);

drop policy if exists project_task_comments_update_admin_manage on public.project_task_comments;
create policy project_task_comments_update_admin_manage
on public.project_task_comments
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_task_comments_delete_admin_manage on public.project_task_comments;
create policy project_task_comments_delete_admin_manage
on public.project_task_comments
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'manage')
);

drop policy if exists project_task_comments_select_same_org_non_internal on public.project_task_comments;
create policy project_task_comments_select_same_org_non_internal
on public.project_task_comments
for select
to authenticated
using (
  is_internal = false
  and public.is_org_approved_member(organization_id)
);

drop policy if exists project_task_comments_insert_same_org_non_internal on public.project_task_comments;
create policy project_task_comments_insert_same_org_non_internal
on public.project_task_comments
for insert
to authenticated
with check (
  is_internal = false
  and author_id = auth.uid()
  and public.is_org_approved_member(organization_id)
);

drop policy if exists project_task_comment_reads_select_self on public.project_task_comment_reads;
create policy project_task_comment_reads_select_self
on public.project_task_comment_reads
for select
to authenticated
using (
  auth.uid() = user_id
  and public.is_org_approved_member(organization_id)
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_comment_reads.task_id
      and t.organization_id = project_task_comment_reads.organization_id
  )
);

drop policy if exists project_task_comment_reads_insert_self on public.project_task_comment_reads;
create policy project_task_comment_reads_insert_self
on public.project_task_comment_reads
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_org_approved_member(organization_id)
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_comment_reads.task_id
      and t.organization_id = project_task_comment_reads.organization_id
  )
);

drop policy if exists project_task_comment_reads_update_self on public.project_task_comment_reads;
create policy project_task_comment_reads_update_self
on public.project_task_comment_reads
for update
to authenticated
using (
  auth.uid() = user_id
  and public.is_org_approved_member(organization_id)
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_comment_reads.task_id
      and t.organization_id = project_task_comment_reads.organization_id
  )
)
with check (
  auth.uid() = user_id
  and public.is_org_approved_member(organization_id)
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_comment_reads.task_id
      and t.organization_id = project_task_comment_reads.organization_id
  )
);

drop policy if exists project_task_comment_reads_delete_self on public.project_task_comment_reads;
create policy project_task_comment_reads_delete_self
on public.project_task_comment_reads
for delete
to authenticated
using (
  auth.uid() = user_id
  and public.is_org_approved_member(organization_id)
  and exists (
    select 1
    from public.project_tasks t
    where t.id = project_task_comment_reads.task_id
      and t.organization_id = project_task_comment_reads.organization_id
  )
);

commit;

-- =========================================================
-- PROJECTS RPCS
-- =========================================================
create or replace function public.approve_project_task(
  p_task_id uuid,
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.project_tasks%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = v_user_id
      and m.status = 'approved'
  ) then
    raise exception 'Membership not approved';
  end if;

  select *
  into v_task
  from public.project_tasks t
  where t.id = p_task_id
    and t.organization_id = p_organization_id;

  if not found then
    raise exception 'Task not found';
  end if;

  if coalesce(v_task.approval_required, false) = false then
    raise exception 'Task does not require approval';
  end if;

  update public.project_tasks
  set approved_by = v_user_id,
      approved_at = now(),
      updated_at = now()
  where id = p_task_id;
end;
$$;
grant execute on function public.approve_project_task(uuid, uuid) to authenticated;

create or replace function public.add_project_task_comment(
  p_task_id uuid,
  p_organization_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.project_tasks%rowtype;
  v_comment_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Comment body is required';
  end if;

  if not exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = v_user_id
      and m.status = 'approved'
  ) then
    raise exception 'Membership not approved';
  end if;

  select *
  into v_task
  from public.project_tasks t
  where t.id = p_task_id
    and t.organization_id = p_organization_id;

  if not found then
    raise exception 'Task not found';
  end if;

  insert into public.project_task_comments (
    task_id,
    project_id,
    organization_id,
    author_id,
    body,
    is_internal
  )
  values (
    v_task.id,
    v_task.project_id,
    v_task.organization_id,
    v_user_id,
    p_body,
    false
  )
  returning id into v_comment_id;

  return v_comment_id;
end;
$$;
grant execute on function public.add_project_task_comment(uuid, uuid, text) to authenticated;

-- =========================================================
-- DOCUMENTS FINAL SHAPE / POLICIES FOR FRESH BOOTSTRAP
-- =========================================================
begin;

alter table public.documents
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists file_name text,
  add column if not exists file_size bigint;

alter table public.documents
  alter column visibility set default 'private'::public.document_visibility,
  alter column storage_bucket set default 'documents',
  alter column current_version set default 1,
  alter column metadata set default '{}'::jsonb;

create index if not exists idx_documents_org_created_at
  on public.documents (organization_id, created_at desc);
create index if not exists idx_documents_visibility
  on public.documents (visibility);
create index if not exists idx_documents_storage_path
  on public.documents (storage_path);
create index if not exists idx_documents_org_folder_path
  on public.documents (organization_id, folder_path);
create index if not exists idx_documents_org_updated_at
  on public.documents (organization_id, updated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_storage_path_unique'
  ) then
    alter table public.documents
      add constraint documents_storage_path_unique unique (storage_path);
  end if;
exception
  when duplicate_object then null;
end $$;

commit;

begin;

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_permissions enable row level security;

drop policy if exists documents_select_same_org on public.documents;
drop policy if exists documents_select_org on public.documents;
create policy documents_select_visibility_aligned
on public.documents
for select
to authenticated
using (
  public.can_read_document(id)
);

drop policy if exists documents_insert_with_permission on public.documents;
drop policy if exists documents_insert_org on public.documents;
create policy documents_insert_with_permission
on public.documents
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    uploaded_by = auth.uid()
    and public.is_org_approved_member(organization_id)
    and public.user_has_permission(organization_id, 'documents', 'upload')
  )
);

drop policy if exists documents_update_with_permission on public.documents;
drop policy if exists documents_update_org on public.documents;
create policy documents_update_with_permission
on public.documents
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'manage')
);

drop policy if exists documents_delete_with_permission on public.documents;
drop policy if exists documents_delete_org on public.documents;
create policy documents_delete_with_permission
on public.documents
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'manage')
);

drop policy if exists document_versions_select_same_org on public.document_versions;
create policy document_versions_select_visibility_aligned
on public.document_versions
for select
to authenticated
using (
  public.can_read_document(document_id)
);

drop policy if exists document_versions_insert_with_permission on public.document_versions;
create policy document_versions_insert_with_permission
on public.document_versions
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_versions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'upload')
  )
);

drop policy if exists document_permissions_select_admins on public.document_permissions;
create policy document_permissions_select_admins
on public.document_permissions
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
);

drop policy if exists document_permissions_manage_admins on public.document_permissions;
create policy document_permissions_manage_admins
on public.document_permissions
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
);

commit;

begin;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists documents_bucket_select_aligned on storage.objects;
drop policy if exists documents_bucket_select_org on storage.objects;
create policy documents_bucket_select_aligned
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = storage.objects.bucket_id
      and d.storage_path = storage.objects.name
      and public.can_read_document(d.id)
  )
);

drop policy if exists documents_bucket_insert_aligned on storage.objects;
drop policy if exists documents_bucket_insert_org on storage.objects;
create policy documents_bucket_insert_aligned
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or (
      public.is_org_approved_member(public.storage_path_org_id(name))
      and (
        public.user_has_permission(public.storage_path_org_id(name), 'documents', 'upload')
        or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'manage')
      )
    )
  )
);

drop policy if exists documents_bucket_update_aligned on storage.objects;
drop policy if exists documents_bucket_update_org on storage.objects;
create policy documents_bucket_update_aligned
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'manage')
  )
)
with check (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'manage')
  )
);

drop policy if exists documents_bucket_delete_aligned on storage.objects;
drop policy if exists documents_bucket_delete_org on storage.objects;
create policy documents_bucket_delete_aligned
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'manage')
  )
);

commit;
