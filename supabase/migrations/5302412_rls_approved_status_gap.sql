-- Close the RLS approved-status gap on the newer GAP tables.
--
-- 5302112 rewrote every table that existed at the time to the approved-aware
-- public.is_org_member(...) helper, but the GAP migrations added afterwards
-- (5302404 cab, 5302405 hardware staging, 5302406 device profiles,
-- 5302407 network diagrams) reintroduced raw membership predicates without a
-- `status = 'approved'` filter. A pending/suspended member could therefore
-- read/write those tables via the anon-key + JWT (authenticated) path even
-- though the API layer rejects them.
--
-- Rewrite those policies to is_org_member() (and add the approved filter to
-- the admin delete policies).
begin;

-- cab_meetings / cab_agenda_items (5302404)
do $$
declare
  t text;
begin
  foreach t in array array['cab_meetings', 'cab_agenda_items'] loop
    execute format('drop policy if exists "%s_select_org" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_org" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_org" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_org" on public.%I', t, t);
    execute format(
      'create policy "%s_select_org" on public.%I for select using (public.is_org_member(organization_id))',
      t, t);
    execute format(
      'create policy "%s_insert_org" on public.%I for insert with check (public.is_org_member(organization_id))',
      t, t);
    execute format(
      'create policy "%s_update_org" on public.%I for update using (public.is_org_member(organization_id))',
      t, t);
    execute format(
      'create policy "%s_delete_org" on public.%I for delete using (public.is_org_member(organization_id))',
      t, t);
  end loop;
end $$;

-- hardware_staging_checks (5302405) — read/write via is_org_member, delete admin-only
drop policy if exists "hardware_staging_checks_select_org" on public.hardware_staging_checks;
drop policy if exists "hardware_staging_checks_insert_org" on public.hardware_staging_checks;
drop policy if exists "hardware_staging_checks_update_org" on public.hardware_staging_checks;
drop policy if exists "hardware_staging_checks_delete_admin" on public.hardware_staging_checks;
create policy "hardware_staging_checks_select_org" on public.hardware_staging_checks
  for select using (public.is_org_member(organization_id));
create policy "hardware_staging_checks_insert_org" on public.hardware_staging_checks
  for insert with check (public.is_org_member(organization_id));
create policy "hardware_staging_checks_update_org" on public.hardware_staging_checks
  for update using (public.is_org_member(organization_id));
create policy "hardware_staging_checks_delete_admin" on public.hardware_staging_checks
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = hardware_staging_checks.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- device_profiles (5302406)
drop policy if exists "device_profiles_select" on public.device_profiles;
drop policy if exists "device_profiles_insert" on public.device_profiles;
drop policy if exists "device_profiles_update" on public.device_profiles;
drop policy if exists "device_profiles_delete" on public.device_profiles;
create policy "device_profiles_select" on public.device_profiles
  for select using (public.is_org_member(organization_id));
create policy "device_profiles_insert" on public.device_profiles
  for insert with check (public.is_org_member(organization_id));
create policy "device_profiles_update" on public.device_profiles
  for update using (public.is_org_member(organization_id));
create policy "device_profiles_delete" on public.device_profiles
  for delete using (public.is_org_member(organization_id));

-- network_diagrams (5302407)
drop policy if exists network_diagrams_select on public.network_diagrams;
drop policy if exists network_diagrams_insert on public.network_diagrams;
drop policy if exists network_diagrams_update on public.network_diagrams;
drop policy if exists network_diagrams_delete on public.network_diagrams;
create policy network_diagrams_select on public.network_diagrams
  for select using (public.is_org_member(organization_id));
create policy network_diagrams_insert on public.network_diagrams
  for insert with check (public.is_org_member(organization_id));
create policy network_diagrams_update on public.network_diagrams
  for update using (public.is_org_member(organization_id));
create policy network_diagrams_delete on public.network_diagrams
  for delete using (public.is_org_member(organization_id));

commit;
