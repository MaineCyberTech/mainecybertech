-- Close the RLS approved-status gap on the two newest module tables.
--
-- 5302412 fixed this for the GAP tables, but 5302414 (client_portal_entitlements)
-- and 5302417 (phishing_targets) were added afterwards and reintroduced the raw
-- `organization_id in (select organization_id from memberships where user_id = auth.uid())`
-- predicate without the `status = 'approved'` filter. A pending/suspended member
-- could therefore read portal entitlements and phishing target PII, and
-- insert/delete phishing targets, via the anon-key + JWT (authenticated) path
-- even though the API layer rejects them.
--
-- Rewrite the policies to use public.is_org_member(...).
begin;

-- client_portal_entitlements (5302414)
drop policy if exists "cpe_select_org" on public.client_portal_entitlements;
drop policy if exists "cpe_insert_org" on public.client_portal_entitlements;
drop policy if exists "cpe_update_org" on public.client_portal_entitlements;
create policy "cpe_select_org" on public.client_portal_entitlements
  for select using (public.is_org_member(organization_id));
create policy "cpe_insert_org" on public.client_portal_entitlements
  for insert with check (public.is_org_member(organization_id));
create policy "cpe_update_org" on public.client_portal_entitlements
  for update using (public.is_org_member(organization_id));

-- phishing_targets (5302417)
drop policy if exists "pt_select_org" on public.phishing_targets;
drop policy if exists "pt_insert_org" on public.phishing_targets;
drop policy if exists "pt_delete_org" on public.phishing_targets;
create policy "pt_select_org" on public.phishing_targets
  for select using (public.is_org_member(organization_id));
create policy "pt_insert_org" on public.phishing_targets
  for insert with check (public.is_org_member(organization_id));
create policy "pt_delete_org" on public.phishing_targets
  for delete using (public.is_org_member(organization_id));

commit;
