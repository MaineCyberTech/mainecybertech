-- Two follow-ups from the second full audit.
begin;

-- 1. client_portal_entitlements: the API gates writes with requireAdmin, but
-- 5302418's policies only required approved membership, so any member could
-- self-upgrade their org's portal modules via PostgREST (anon key + JWT).
-- Gate insert/update to org admins (mirrors the compliance_frameworks pattern).
drop policy if exists "cpe_insert_org" on public.client_portal_entitlements;
drop policy if exists "cpe_update_org" on public.client_portal_entitlements;
create policy "cpe_insert_org" on public.client_portal_entitlements
  for insert with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );
create policy "cpe_update_org" on public.client_portal_entitlements
  for update using (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin'])
  );

-- 2. impersonation_log.actor_user_id was NOT NULL with ON DELETE SET NULL, so
-- deleting an auth user that had log rows failed with a not-null violation.
-- Keep the row, allow a null actor for deleted users.
alter table public.impersonation_log alter column actor_user_id drop not null;

commit;
