-- Fix P2 finding: missing UPDATE/DELETE policies for shared tables,
-- missing INSERT/UPDATE/DELETE for webhook_deliveries, missing DELETE for training_enrollments.
-- Uses public.is_org_member() from 5302100 where applicable.

-- =============================================================
-- module_timeline_events: missing UPDATE + DELETE
-- =============================================================
drop policy if exists "module_timeline_events_update_org" on public.module_timeline_events;
drop policy if exists "module_timeline_events_admin_delete" on public.module_timeline_events;
create policy "module_timeline_events_update_org" on public.module_timeline_events
  for update using (public.is_org_member(organization_id));
create policy "module_timeline_events_admin_delete" on public.module_timeline_events
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = module_timeline_events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- scheduled_check_results: missing UPDATE + DELETE
-- =============================================================
drop policy if exists "scheduled_check_results_update_org" on public.scheduled_check_results;
drop policy if exists "scheduled_check_results_admin_delete" on public.scheduled_check_results;
create policy "scheduled_check_results_update_org" on public.scheduled_check_results
  for update using (public.is_org_member(organization_id));
create policy "scheduled_check_results_admin_delete" on public.scheduled_check_results
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = scheduled_check_results.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- score_history: missing UPDATE + DELETE
-- =============================================================
drop policy if exists "sh_org_u" on public.score_history;
drop policy if exists "sh_admin_delete" on public.score_history;
create policy "sh_org_u" on public.score_history
  for update using (public.is_org_member(organization_id));
create policy "sh_admin_delete" on public.score_history
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = score_history.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- badges_earned: missing UPDATE + DELETE
-- =============================================================
drop policy if exists "be_org_u" on public.badges_earned;
drop policy if exists "be_admin_delete" on public.badges_earned;
create policy "be_org_u" on public.badges_earned
  for update using (public.is_org_member(organization_id));
create policy "be_admin_delete" on public.badges_earned
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = badges_earned.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- webhook_deliveries: missing INSERT, UPDATE, DELETE
-- Uses webhook_endpoints.organization_id for the org check
-- =============================================================
drop policy if exists "webhook_deliveries_insert_auth" on public.webhook_deliveries;
drop policy if exists "webhook_deliveries_update_org" on public.webhook_deliveries;
drop policy if exists "webhook_deliveries_admin_delete" on public.webhook_deliveries;
create policy "webhook_deliveries_insert_auth" on public.webhook_deliveries
  for insert with check (
    exists (
      select 1 from public.webhook_endpoints we
      where we.id = webhook_id
        and public.is_org_member(we.organization_id)
    )
  );
create policy "webhook_deliveries_update_org" on public.webhook_deliveries
  for update using (
    exists (
      select 1 from public.webhook_endpoints we
      where we.id = webhook_id
        and public.is_org_member(we.organization_id)
    )
  );
create policy "webhook_deliveries_admin_delete" on public.webhook_deliveries
  for delete using (
    exists (
      select 1 from public.webhook_endpoints we
      join public.memberships m on m.organization_id = we.organization_id
      join public.roles r on m.role_id = r.id
      where we.id = webhook_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- training_enrollments: missing DELETE (admin-only)
-- =============================================================
drop policy if exists "enrollments_admin_delete" on public.training_enrollments;
create policy "enrollments_admin_delete" on public.training_enrollments
  for delete using (
    exists (
      select 1 from public.training_courses tc
      join public.memberships m on m.organization_id = tc.organization_id
      join public.roles r on m.role_id = r.id
      where tc.id = training_enrollments.course_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );