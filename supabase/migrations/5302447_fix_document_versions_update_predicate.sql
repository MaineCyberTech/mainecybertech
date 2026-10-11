-- RLS-P2-005: document_versions.dv_update still used the raw, status-unfiltered
-- membership predicate from 5302081. The approved-membership rewrites
-- (5302100 / 5302112) missed it and it was baseline-exempt from
-- scripts/check-rls-predicate.mjs, so a pending/suspended member could UPDATE
-- version rows through the anon-key + JWT (authenticated) path.
--
-- Recreate it with the approved-aware helper, deriving the org from the parent
-- document, and mirror documents_update_with_permission (5302129): platform
-- super admins and holders of documents:edit may update version metadata.
begin;

drop policy if exists "dv_update" on public.document_versions;
create policy "dv_update" on public.document_versions
  for update
  to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and public.is_org_member(d.organization_id)
        and public.user_has_permission(d.organization_id, 'documents', 'edit')
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and public.is_org_member(d.organization_id)
        and public.user_has_permission(d.organization_id, 'documents', 'edit')
    )
  );

commit;
