-- P0-7: Track platform-admin cross-tenant access (impersonation)
--
-- Platform admin roles (super_admin, admin, dispatcher, engineer,
-- security-analyst, project-manager, finance, onboarding-specialist) can
-- work across ALL tenants. Every time one of them enters a tenant they are
-- NOT a member of, record it here so cross-tenant activity is auditable.
--
-- This is an append-only audit table; RLS is disabled so only the
-- service_role (server-side API) can write. Reads are intentionally
-- restricted to service_role as well — platform admins audit via the API
-- which uses service_role.

create table public.impersonation_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete set null,
  actor_role_key text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  reason text,
  ip_address inet,
  user_agent text,
  source text not null default 'api',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_impersonation_log_actor
  on public.impersonation_log (actor_user_id, created_at desc);

create index idx_impersonation_log_org
  on public.impersonation_log (organization_id, created_at desc);

-- Only service_role can access this table (server-side writes + reads via API).
alter table public.impersonation_log enable row level security;

create policy "impersonation_log_service_role_all" on public.impersonation_log
  for all to service_role
  using (true)
  with check (true);
