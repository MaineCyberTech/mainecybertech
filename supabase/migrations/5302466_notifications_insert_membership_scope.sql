-- =========================================================
-- 5302466: scope self-addressed notification inserts to the caller's orgs
--          (RLS-P3-009)
--
-- 5302461 recreated notifications_insert_system_or_admin with a self branch
-- (`user_id = auth.uid()`) that ignored organization_id. Any authenticated
-- user could therefore insert a notification tagged with another tenant's
-- organization_id, polluting that tenant's dataset. Keep the self branch but
-- require approved membership in the row's organization (NULL org notifications
-- remain global/system rows and are still self-only), and keep the existing
-- admin/platform-role branch unchanged.
-- =========================================================

begin;

drop policy if exists "notifications_insert_system_or_admin" on public.notifications;
create policy "notifications_insert_system_or_admin"
  on public.notifications for insert
  with check (
    (
      user_id = auth.uid()
      and (
        organization_id is null
        or public.is_org_member(organization_id)
      )
    )
    or public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

commit;
