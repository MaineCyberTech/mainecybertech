-- =========================================================
-- 5302461: full platform-role gates + approved predicates for four
--          pre-baseline policies (RLS-P3-008)
--
-- `node scripts/verify-rls.mjs` reports four live policies created before the
-- 5302436 role-gate baseline that hardcode a partial platform-role list:
--
--   notifications_insert_system_or_admin (5302057) — the admin branch only
--     accepts ('super_admin', 'admin'), omitting the six MSP platform keys
--     (engineer, dispatcher, security-analyst, project-manager, finance,
--     onboarding-specialist), and has NO membership status filter, so a
--     pending/suspended member holding an admin role could still inject
--     notifications for other users in the org.
--   document_shares_{delete,insert,update}_own_org (5302129) — the gate omits
--     super_admin, so a platform super_admin without an org membership is
--     denied (the API treats super_admin as the top bypass).
--
-- Recreate them with public.user_has_role(...), the single-source helper
-- 5302436 introduced: it checks status = 'approved' and keeps the key list in
-- one place, which is exactly what the drift guard asks new policies to use.
-- The document_shares gate keeps its client_admin / technician grants (they
-- are client-facing keys, not platform keys) alongside the full platform set.
--
-- Idempotent: each policy is dropped before it is recreated.
-- =========================================================

begin;

drop policy if exists "notifications_insert_system_or_admin" on public.notifications;
create policy "notifications_insert_system_or_admin"
  on public.notifications for insert
  with check (
    user_id = auth.uid()
    or public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

drop policy if exists "document_shares_delete_own_org" on public.document_shares;
create policy "document_shares_delete_own_org"
  on public.document_shares for delete
  using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','client_admin','technician','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

drop policy if exists "document_shares_insert_own_org" on public.document_shares;
create policy "document_shares_insert_own_org"
  on public.document_shares for insert
  with check (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','client_admin','technician','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

drop policy if exists "document_shares_update_own_org" on public.document_shares;
create policy "document_shares_update_own_org"
  on public.document_shares for update
  using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','client_admin','technician','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

commit;
