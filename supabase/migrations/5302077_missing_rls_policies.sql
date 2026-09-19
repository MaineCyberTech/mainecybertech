-- Add missing RLS policies
-- ticket_triage_drafts: missing DELETE policy
-- satisfaction_pulses: missing UPDATE policy

create policy "triage_drafts_delete_admin" on ticket_triage_drafts for delete
  using (exists (select 1 from memberships m join roles r on m.role_id = r.id
    where m.user_id = auth.uid() and m.organization_id = ticket_triage_drafts.organization_id
    and r.key in ('super_admin', 'admin')));

create policy "satisfaction_pulses_update" on satisfaction_pulses for update
  using (exists (select 1 from memberships m where m.user_id = auth.uid()
    and m.organization_id = satisfaction_pulses.organization_id and m.status = 'approved'));
