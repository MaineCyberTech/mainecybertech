-- RLS-P2-001: restore the MSP platform-admin role keys to admin-gate policies.
--
-- 5302129 upgraded ~89 admin-gate policies to accept the full MSP
-- platform-admin key set:
--   ('admin','super_admin','engineer','dispatcher','security-analyst',
--    'project-manager','finance','onboarding-specialist')
-- which matches PLATFORM_ADMIN_KEYS in apps/api/src/lib/roles.ts and the role
-- catalog in 5302128.
--
-- Four LATER migrations regressed that, re-declaring the gate with only
-- ('admin','super_admin'):
--   5302402 knowledge_base_articles  (delete)
--   5302405 hardware_staging_checks  (delete)
--   5302406 device_profiles          (delete)
--   5302412 hardware_staging_checks  (delete, re-created)
-- Effect: an MSP engineer / dispatcher / etc. could not delete these records
-- even though the application layer treats them as platform admins — the
-- database disagreed with the API, and only the two most privileged keys worked.
--
-- Rather than repeat an 8-element literal (the cause of the drift), this uses the
-- existing public.user_has_role(org_id, role_keys) helper, so the key list lives
-- in ONE place per policy call site and is trivial to audit.
--
-- Only the DELETE gates are touched; the select/insert/update policies are
-- membership-scoped and were not regressed.

begin;

-- knowledge_base_articles (5302402)
drop policy if exists "knowledge_base_articles_delete_org" on public.knowledge_base_articles;
create policy "knowledge_base_articles_delete_org" on public.knowledge_base_articles
  for delete using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

-- hardware_staging_checks (5302405, re-declared by 5302412)
drop policy if exists "hardware_staging_checks_delete_admin" on public.hardware_staging_checks;
create policy "hardware_staging_checks_delete_admin" on public.hardware_staging_checks
  for delete using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

-- device_profiles (5302406)
drop policy if exists "device_profiles_delete" on public.device_profiles;
create policy "device_profiles_delete" on public.device_profiles
  for delete using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

-- Two more DELETE gates use the single key `r.key in ('admin')` (from 5302080,
-- predating the 5302129 standard) — so even `super_admin` could not delete these
-- rows. Same class of drift, same fix.
drop policy if exists "te_org_d" on public.time_entries;
create policy "te_org_d" on public.time_entries
  for delete using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

drop policy if exists "backup_del" on public.backup_status;
create policy "backup_del" on public.backup_status
  for delete using (
    public.user_has_role(
      organization_id,
      array['super_admin','admin','engineer','dispatcher','security-analyst','project-manager','finance','onboarding-specialist']
    )
  );

-- Guard against future drift: assert every admin delete gate this migration
-- touches now uses the helper rather than a hardcoded short key list. Fails the
-- migration loudly if not.
do $$
declare
  bad int;
begin
  select count(*) into bad
  from pg_policies
  where schemaname = 'public'
    and policyname in (
      'knowledge_base_articles_delete_org',
      'hardware_staging_checks_delete_admin',
      'device_profiles_delete',
      'te_org_d',
      'backup_del'
    )
    and (qual is null or qual not like '%user_has_role%');

  if bad > 0 then
    raise exception 'Expected all 5 admin delete gates to use user_has_role(), but % do not', bad;
  end if;
end;
$$;

commit;
