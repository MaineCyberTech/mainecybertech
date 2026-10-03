-- Align client_portal_entitlements RLS writes with the API gate.
--
-- `PUT /api/v1/client-portal/entitlements` requires a platform admin
-- (`requireAdmin`) and writes with the service-role client, so the PostgREST
-- insert/update policies must not admit org-level roles. 5302420 gated writes
-- to `admin`/`super_admin`/`client_admin`; this drops `client_admin` (an
-- org-level client admin cannot manage module entitlements) and adds a
-- `with check` to the update policy so a platform admin cannot move a row to
-- another organization.
begin;

drop policy if exists "cpe_insert_org" on public.client_portal_entitlements;
drop policy if exists "cpe_update_org" on public.client_portal_entitlements;

create policy "cpe_insert_org" on public.client_portal_entitlements
  for insert with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin'])
  );

create policy "cpe_update_org" on public.client_portal_entitlements
  for update using (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin'])
  ) with check (
    public.is_super_admin()
    or public.user_has_role(organization_id, array['admin', 'super_admin'])
  );

commit;
