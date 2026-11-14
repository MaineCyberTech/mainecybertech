-- =========================================================
-- 5302468: PSA crosswalk for portal organizations and profiles
--
-- Alga PSA is the client/contact system of record. The portal keeps its own
-- organizations/profiles for auth and presentation, so it needs an explicit
-- crosswalk rather than matching on names or domains.
--
-- Writes are service-role only. Staff may read the links for support and
-- onboarding views. No client-facing policy is added.
-- =========================================================

begin;

create table if not exists public.organization_psa_links (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  psa_tenant uuid not null,
  psa_client_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_psa_links_client_unique unique (psa_tenant, psa_client_id)
);

create index if not exists idx_organization_psa_links_client
  on public.organization_psa_links (psa_tenant, psa_client_id);

alter table public.organization_psa_links enable row level security;

drop policy if exists "organization_psa_links_staff_select" on public.organization_psa_links;
create policy "organization_psa_links_staff_select"
on public.organization_psa_links
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(
    organization_id,
    array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
  )
);

comment on table public.organization_psa_links is
  'Explicit portal organization -> Alga PSA client crosswalk. Service-role writes only.';

alter table public.profiles
  add column if not exists psa_contact_id uuid,
  add column if not exists psa_user_id uuid;

create unique index if not exists idx_profiles_psa_contact_id
  on public.profiles (psa_contact_id)
  where psa_contact_id is not null;

create unique index if not exists idx_profiles_psa_user_id
  on public.profiles (psa_user_id)
  where psa_user_id is not null;

comment on column public.profiles.psa_contact_id is
  'Alga PSA contacts.contact_name_id for client-side users.';
comment on column public.profiles.psa_user_id is
  'Alga PSA users.user_id for MSP staff users.';

commit;
