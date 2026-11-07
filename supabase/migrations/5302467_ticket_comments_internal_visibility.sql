-- =========================================================
-- 5302467: keep internal ticket notes staff-only at the DB layer
--          (SEC-P1-012, defence in depth)
--
-- ticket_comments_select_same_org only checked org membership, so a client
-- role using a user-scoped/RLS-enforced client could read is_internal = true
-- rows directly through PostgREST. The API now filters internal rows for
-- client callers on every read path; this policy makes the database agree.
--
-- Client-facing roles (client_admin, client_user, client-viewer,
-- client-billing) are not in the staff role list below, so they only see
-- is_internal = false. Internal MSP roles and super admins keep the full set.
-- =========================================================

begin;

drop policy if exists "ticket_comments_select_same_org" on public.ticket_comments;
create policy "ticket_comments_select_same_org"
on public.ticket_comments
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.is_org_approved_member(organization_id)
    and (
      is_internal = false
      or public.user_has_role(
        organization_id,
        array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
      )
    )
  )
);

commit;
