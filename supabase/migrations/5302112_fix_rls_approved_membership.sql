-- P1/P2 fixes (audit RLS-002 / RLS-003 / RLS-008):
--
-- A) RLS-003: 5302100 redefined public.is_org_member(uuid) as SECURITY DEFINER
--    WITHOUT `set search_path = public` (the bootstrap convention). Pin it.
--
-- B) RLS-002: 24 tables still carry raw inline membership policies
--    (memberships ... auth.uid()) with NO status = 'approved' filter on
--    SELECT/INSERT/UPDATE. Rewrite them to the approved-aware is_org_member()
--    helper so pending/suspended/removed memberships cannot read/write.
--
-- C) RLS-008: 5302076 created 44 raw role-gated `*_delete_admin` policies
--    without a status filter; 5302100 added clean approved-aware
--    `*_admin_delete` policies for the same tables but never dropped the old
--    names. Drop all 44 orphans (the clean replacements remain).

-- =============================================================
-- A) Pin search_path on is_org_member (SECURITY DEFINER)
-- =============================================================
alter function public.is_org_member(uuid) set search_path = public;

-- =============================================================
-- B) Rewrite the 24 raw-membership tables to approved-aware policies
-- =============================================================

-- -------------------------------------------------------------
-- api_keys (5302042)
-- -------------------------------------------------------------
drop policy if exists "api_keys_select_org" on public.api_keys;
drop policy if exists "api_keys_insert_admin" on public.api_keys;
drop policy if exists "api_keys_update_admin" on public.api_keys;
drop policy if exists "api_keys_delete_admin" on public.api_keys;
create policy "api_keys_select_org" on public.api_keys
  for select using (public.is_org_member(organization_id));
create policy "api_keys_insert_admin" on public.api_keys
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = api_keys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );
create policy "api_keys_update_admin" on public.api_keys
  for update using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = api_keys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );
drop policy if exists "api_keys_admin_delete" on public.api_keys;
create policy "api_keys_admin_delete" on public.api_keys
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = api_keys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- sla_logs (5302041) — select for approved members, insert admin-only
-- -------------------------------------------------------------
drop policy if exists "sla_logs_select_org" on public.sla_logs;
drop policy if exists "sla_logs_insert_admin" on public.sla_logs;
create policy "sla_logs_select_org" on public.sla_logs
  for select using (public.is_org_member(organization_id));
create policy "sla_logs_insert_admin" on public.sla_logs
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = sla_logs.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- portal_module_settings (5302058)
-- -------------------------------------------------------------
drop policy if exists "portal_module_settings_select_org" on public.portal_module_settings;
drop policy if exists "portal_module_settings_insert_admin" on public.portal_module_settings;
drop policy if exists "portal_module_settings_update_admin" on public.portal_module_settings;
create policy "portal_module_settings_select_org" on public.portal_module_settings
  for select using (public.is_org_member(organization_id));
create policy "portal_module_settings_insert_admin" on public.portal_module_settings
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = portal_module_settings.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );
create policy "portal_module_settings_update_admin" on public.portal_module_settings
  for update using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = portal_module_settings.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- approval_requests (5302058)
-- -------------------------------------------------------------
drop policy if exists "approval_requests_select_org" on public.approval_requests;
drop policy if exists "approval_requests_insert_auth" on public.approval_requests;
drop policy if exists "approval_requests_update_org" on public.approval_requests;
drop policy if exists "approval_requests_delete_admin" on public.approval_requests;
create policy "approval_requests_select_org" on public.approval_requests
  for select using (public.is_org_member(organization_id));
create policy "approval_requests_insert_auth" on public.approval_requests
  for insert with check (public.is_org_member(organization_id));
create policy "approval_requests_update_org" on public.approval_requests
  for update using (public.is_org_member(organization_id));
drop policy if exists "approval_requests_admin_delete" on public.approval_requests;
create policy "approval_requests_admin_delete" on public.approval_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = approval_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- ai_draft_outputs (5302058)
-- -------------------------------------------------------------
drop policy if exists "ai_draft_outputs_select_org" on public.ai_draft_outputs;
drop policy if exists "ai_draft_outputs_insert_auth" on public.ai_draft_outputs;
drop policy if exists "ai_draft_outputs_update_org" on public.ai_draft_outputs;
create policy "ai_draft_outputs_select_org" on public.ai_draft_outputs
  for select using (public.is_org_member(organization_id));
create policy "ai_draft_outputs_insert_auth" on public.ai_draft_outputs
  for insert with check (public.is_org_member(organization_id));
create policy "ai_draft_outputs_update_org" on public.ai_draft_outputs
  for update using (public.is_org_member(organization_id));

-- -------------------------------------------------------------
-- module_comments (5302058)
-- -------------------------------------------------------------
drop policy if exists "module_comments_select_org" on public.module_comments;
drop policy if exists "module_comments_insert_auth" on public.module_comments;
drop policy if exists "module_comments_update_own" on public.module_comments;
drop policy if exists "module_comments_delete_admin" on public.module_comments;
create policy "module_comments_select_org" on public.module_comments
  for select using (public.is_org_member(organization_id));
create policy "module_comments_insert_auth" on public.module_comments
  for insert with check (public.is_org_member(organization_id));
create policy "module_comments_update_own" on public.module_comments
  for update using (
    author_id = auth.uid()
    and public.is_org_member(organization_id)
  );
drop policy if exists "module_comments_admin_delete" on public.module_comments;
create policy "module_comments_admin_delete" on public.module_comments
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = module_comments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- module_timeline_events (5302058; update/delete already fixed in 5302101)
-- -------------------------------------------------------------
drop policy if exists "module_timeline_events_select_org" on public.module_timeline_events;
drop policy if exists "module_timeline_events_insert_auth" on public.module_timeline_events;
create policy "module_timeline_events_select_org" on public.module_timeline_events
  for select using (public.is_org_member(organization_id));
create policy "module_timeline_events_insert_auth" on public.module_timeline_events
  for insert with check (public.is_org_member(organization_id));

-- -------------------------------------------------------------
-- scheduled_check_results (5302058; update/delete already fixed in 5302101)
-- -------------------------------------------------------------
drop policy if exists "scheduled_check_results_select_org" on public.scheduled_check_results;
drop policy if exists "scheduled_check_results_insert_admin" on public.scheduled_check_results;
create policy "scheduled_check_results_select_org" on public.scheduled_check_results
  for select using (public.is_org_member(organization_id));
create policy "scheduled_check_results_insert_admin" on public.scheduled_check_results
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = scheduled_check_results.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- proposals (5302059)
-- -------------------------------------------------------------
drop policy if exists "proposals_select_org" on public.proposals;
drop policy if exists "proposals_insert_auth" on public.proposals;
drop policy if exists "proposals_update_org" on public.proposals;
drop policy if exists "proposals_delete_admin" on public.proposals;
create policy "proposals_select_org" on public.proposals
  for select using (public.is_org_member(organization_id));
create policy "proposals_insert_auth" on public.proposals
  for insert with check (public.is_org_member(organization_id));
create policy "proposals_update_org" on public.proposals
  for update using (public.is_org_member(organization_id));
drop policy if exists "proposals_admin_delete" on public.proposals;
create policy "proposals_admin_delete" on public.proposals
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = proposals.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- proposal_phases (5302059) — org check via parent proposals
-- -------------------------------------------------------------
drop policy if exists "proposal_phases_select_org" on public.proposal_phases;
drop policy if exists "proposal_phases_insert_auth" on public.proposal_phases;
drop policy if exists "proposal_phases_update_org" on public.proposal_phases;
drop policy if exists "proposal_phases_delete_admin" on public.proposal_phases;
create policy "proposal_phases_select_org" on public.proposal_phases
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_phases.proposal_id
        and public.is_org_member(p.organization_id)
    )
  );
create policy "proposal_phases_insert_auth" on public.proposal_phases
  for insert with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_phases.proposal_id
        and public.is_org_member(p.organization_id)
    )
  );
create policy "proposal_phases_update_org" on public.proposal_phases
  for update using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_phases.proposal_id
        and public.is_org_member(p.organization_id)
    )
  );
drop policy if exists "proposal_phases_admin_delete" on public.proposal_phases;
create policy "proposal_phases_admin_delete" on public.proposal_phases
  for delete using (
    exists (
      select 1 from public.proposals p
      join public.memberships m on m.organization_id = p.organization_id
      join public.roles r on m.role_id = r.id
      where p.id = proposal_phases.proposal_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- proposal_line_items (5302059) — org check via parent proposals
-- -------------------------------------------------------------
drop policy if exists "proposal_line_items_select_org" on public.proposal_line_items;
drop policy if exists "proposal_line_items_insert_auth" on public.proposal_line_items;
drop policy if exists "proposal_line_items_update_org" on public.proposal_line_items;
drop policy if exists "proposal_line_items_delete_admin" on public.proposal_line_items;
create policy "proposal_line_items_select_org" on public.proposal_line_items
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_line_items.proposal_id
        and public.is_org_member(p.organization_id)
    )
  );
create policy "proposal_line_items_insert_auth" on public.proposal_line_items
  for insert with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_line_items.proposal_id
        and public.is_org_member(p.organization_id)
    )
  );
create policy "proposal_line_items_update_org" on public.proposal_line_items
  for update using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_line_items.proposal_id
        and public.is_org_member(p.organization_id)
    )
  );
drop policy if exists "proposal_line_items_admin_delete" on public.proposal_line_items;
create policy "proposal_line_items_admin_delete" on public.proposal_line_items
  for delete using (
    exists (
      select 1 from public.proposals p
      join public.memberships m on m.organization_id = p.organization_id
      join public.roles r on m.role_id = r.id
      where p.id = proposal_line_items.proposal_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- findings (5302060)
-- -------------------------------------------------------------
drop policy if exists "findings_select_org" on public.findings;
drop policy if exists "findings_insert_auth" on public.findings;
drop policy if exists "findings_update_org" on public.findings;
drop policy if exists "findings_delete_admin" on public.findings;
create policy "findings_select_org" on public.findings
  for select using (public.is_org_member(organization_id));
create policy "findings_insert_auth" on public.findings
  for insert with check (public.is_org_member(organization_id));
create policy "findings_update_org" on public.findings
  for update using (public.is_org_member(organization_id));
drop policy if exists "findings_admin_delete" on public.findings;
create policy "findings_admin_delete" on public.findings
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = findings.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- assets (5302061)
-- -------------------------------------------------------------
drop policy if exists "assets_select_org" on public.assets;
drop policy if exists "assets_insert_auth" on public.assets;
drop policy if exists "assets_update_org" on public.assets;
drop policy if exists "assets_delete_admin" on public.assets;
create policy "assets_select_org" on public.assets
  for select using (public.is_org_member(organization_id));
create policy "assets_insert_auth" on public.assets
  for insert with check (public.is_org_member(organization_id));
create policy "assets_update_org" on public.assets
  for update using (public.is_org_member(organization_id));
drop policy if exists "assets_admin_delete" on public.assets;
create policy "assets_admin_delete" on public.assets
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = assets.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- domain_monitors (5302062)
-- -------------------------------------------------------------
drop policy if exists "domain_monitors_select_org" on public.domain_monitors;
drop policy if exists "domain_monitors_insert_auth" on public.domain_monitors;
drop policy if exists "domain_monitors_update_org" on public.domain_monitors;
drop policy if exists "domain_monitors_delete_admin" on public.domain_monitors;
create policy "domain_monitors_select_org" on public.domain_monitors
  for select using (public.is_org_member(organization_id));
create policy "domain_monitors_insert_auth" on public.domain_monitors
  for insert with check (public.is_org_member(organization_id));
create policy "domain_monitors_update_org" on public.domain_monitors
  for update using (public.is_org_member(organization_id));
drop policy if exists "domain_monitors_admin_delete" on public.domain_monitors;
create policy "domain_monitors_admin_delete" on public.domain_monitors
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = domain_monitors.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- qbr_reports (5302063)
-- -------------------------------------------------------------
drop policy if exists "qbr_reports_select_org" on public.qbr_reports;
drop policy if exists "qbr_reports_insert_auth" on public.qbr_reports;
drop policy if exists "qbr_reports_update_org" on public.qbr_reports;
drop policy if exists "qbr_reports_delete_admin" on public.qbr_reports;
create policy "qbr_reports_select_org" on public.qbr_reports
  for select using (public.is_org_member(organization_id));
create policy "qbr_reports_insert_auth" on public.qbr_reports
  for insert with check (public.is_org_member(organization_id));
create policy "qbr_reports_update_org" on public.qbr_reports
  for update using (public.is_org_member(organization_id));
drop policy if exists "qbr_reports_admin_delete" on public.qbr_reports;
create policy "qbr_reports_admin_delete" on public.qbr_reports
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = qbr_reports.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- file_requests (5302064)
-- -------------------------------------------------------------
drop policy if exists "file_requests_select_org" on public.file_requests;
drop policy if exists "file_requests_insert_auth" on public.file_requests;
drop policy if exists "file_requests_update_org" on public.file_requests;
drop policy if exists "file_requests_delete_admin" on public.file_requests;
create policy "file_requests_select_org" on public.file_requests
  for select using (public.is_org_member(organization_id));
create policy "file_requests_insert_auth" on public.file_requests
  for insert with check (public.is_org_member(organization_id));
create policy "file_requests_update_org" on public.file_requests
  for update using (public.is_org_member(organization_id));
drop policy if exists "file_requests_admin_delete" on public.file_requests;
create policy "file_requests_admin_delete" on public.file_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = file_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- ticket_triage_drafts (5302065; raw delete from 5302077)
-- -------------------------------------------------------------
drop policy if exists "triage_drafts_select_org" on public.ticket_triage_drafts;
drop policy if exists "triage_drafts_insert_auth" on public.ticket_triage_drafts;
drop policy if exists "triage_drafts_update_org" on public.ticket_triage_drafts;
drop policy if exists "triage_drafts_delete_admin" on public.ticket_triage_drafts;
create policy "triage_drafts_select_org" on public.ticket_triage_drafts
  for select using (public.is_org_member(organization_id));
create policy "triage_drafts_insert_auth" on public.ticket_triage_drafts
  for insert with check (public.is_org_member(organization_id));
create policy "triage_drafts_update_org" on public.ticket_triage_drafts
  for update using (public.is_org_member(organization_id));
drop policy if exists "triage_drafts_admin_delete" on public.ticket_triage_drafts;
create policy "triage_drafts_admin_delete" on public.ticket_triage_drafts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = ticket_triage_drafts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- vendor_contracts (5302066)
-- -------------------------------------------------------------
drop policy if exists "vendor_contracts_select_org" on public.vendor_contracts;
drop policy if exists "vendor_contracts_insert_auth" on public.vendor_contracts;
drop policy if exists "vendor_contracts_update_org" on public.vendor_contracts;
drop policy if exists "vendor_contracts_delete_admin" on public.vendor_contracts;
create policy "vendor_contracts_select_org" on public.vendor_contracts
  for select using (public.is_org_member(organization_id));
create policy "vendor_contracts_insert_auth" on public.vendor_contracts
  for insert with check (public.is_org_member(organization_id));
create policy "vendor_contracts_update_org" on public.vendor_contracts
  for update using (public.is_org_member(organization_id));
drop policy if exists "vendor_contracts_admin_delete" on public.vendor_contracts;
create policy "vendor_contracts_admin_delete" on public.vendor_contracts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = vendor_contracts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- vendor_contacts (5302066)
-- -------------------------------------------------------------
drop policy if exists "vendor_contacts_select_org" on public.vendor_contacts;
drop policy if exists "vendor_contacts_insert_auth" on public.vendor_contacts;
drop policy if exists "vendor_contacts_update_org" on public.vendor_contacts;
drop policy if exists "vendor_contacts_delete_admin" on public.vendor_contacts;
create policy "vendor_contacts_select_org" on public.vendor_contacts
  for select using (public.is_org_member(organization_id));
create policy "vendor_contacts_insert_auth" on public.vendor_contacts
  for insert with check (public.is_org_member(organization_id));
create policy "vendor_contacts_update_org" on public.vendor_contacts
  for update using (public.is_org_member(organization_id));
drop policy if exists "vendor_contacts_admin_delete" on public.vendor_contacts;
create policy "vendor_contacts_admin_delete" on public.vendor_contacts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = vendor_contacts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- service_catalog (5302067)
-- -------------------------------------------------------------
drop policy if exists "service_catalog_select_org" on public.service_catalog;
drop policy if exists "service_catalog_insert_auth" on public.service_catalog;
drop policy if exists "service_catalog_update_org" on public.service_catalog;
drop policy if exists "service_catalog_delete_admin" on public.service_catalog;
create policy "service_catalog_select_org" on public.service_catalog
  for select using (public.is_org_member(organization_id));
create policy "service_catalog_insert_auth" on public.service_catalog
  for insert with check (public.is_org_member(organization_id));
create policy "service_catalog_update_org" on public.service_catalog
  for update using (public.is_org_member(organization_id));
drop policy if exists "service_catalog_admin_delete" on public.service_catalog;
create policy "service_catalog_admin_delete" on public.service_catalog
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = service_catalog.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin')
    )
  );

-- -------------------------------------------------------------
-- document_shares (5302043) — keep the role gate, add approved filter
-- -------------------------------------------------------------
drop policy if exists "document_shares_select_own_org" on public.document_shares;
drop policy if exists "document_shares_insert_own_org" on public.document_shares;
drop policy if exists "document_shares_update_own_org" on public.document_shares;
drop policy if exists "document_shares_delete_own_org" on public.document_shares;
create policy "document_shares_select_own_org"
  on public.document_shares for select
  using (public.is_org_member(organization_id));
create policy "document_shares_insert_own_org"
  on public.document_shares for insert
  with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = document_shares.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'client_admin', 'technician')
    )
  );
create policy "document_shares_update_own_org"
  on public.document_shares for update
  using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = document_shares.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'client_admin', 'technician')
    )
  );
create policy "document_shares_delete_own_org"
  on public.document_shares for delete
  using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = document_shares.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'client_admin', 'technician')
    )
  );

-- -------------------------------------------------------------
-- score_history (5302085; update/delete already fixed in 5302101)
-- -------------------------------------------------------------
drop policy if exists "sh_org" on public.score_history;
drop policy if exists "sh_org_i" on public.score_history;
create policy "sh_org" on public.score_history
  for select using (public.is_org_member(organization_id));
create policy "sh_org_i" on public.score_history
  for insert with check (public.is_org_member(organization_id));

-- -------------------------------------------------------------
-- badges_earned (5302085; update/delete already fixed in 5302101)
-- -------------------------------------------------------------
drop policy if exists "be_org" on public.badges_earned;
drop policy if exists "be_org_i" on public.badges_earned;
create policy "be_org" on public.badges_earned
  for select using (public.is_org_member(organization_id));
create policy "be_org_i" on public.badges_earned
  for insert with check (public.is_org_member(organization_id));

-- -------------------------------------------------------------
-- sop_library (5302086) — drop the raw 5302086 set; 5302100's
-- sop_org / sop_org_i / sop_org_u / sop_org_d already cover this
-- table with approved-aware policies.
-- -------------------------------------------------------------
drop policy if exists "sop_library_org_select" on public.sop_library;
drop policy if exists "sop_library_org_insert" on public.sop_library;
drop policy if exists "sop_library_org_update" on public.sop_library;
drop policy if exists "sop_library_admin_delete" on public.sop_library;

-- =============================================================
-- C) Drop the 44 orphaned raw `*_delete_admin` policies from
--    5302076. Every one of these tables already has a clean
--    approved-aware `*_admin_delete` policy created by 5302100.
-- =============================================================

-- 5302068 batch_modules
drop policy if exists "license_tracking_delete_admin" on public.license_tracking;
drop policy if exists "status_items_delete_admin" on public.status_items;
drop policy if exists "website_monitors_delete_admin" on public.website_monitors;
drop policy if exists "dmarc_assessments_delete_admin" on public.dmarc_assessments;

-- 5302069 security_ops
drop policy if exists "offboarding_delete_admin" on public.offboarding_checklists;
drop policy if exists "break_glass_delete_admin" on public.break_glass_accounts;
drop policy if exists "onboarding_delete_admin" on public.onboarding_clients;
drop policy if exists "patch_compliance_delete_admin" on public.patch_compliance;

-- 5302070 security_suite
drop policy if exists "m365_delete_admin" on public.m365_hardening;
drop policy if exists "incident_delete_admin" on public.incident_responses;
drop policy if exists "idverify_delete_admin" on public.identity_verifications;
drop policy if exists "ep_delete_admin" on public.endpoint_security;

-- 5302071 governance
drop policy if exists "cr_delete_admin" on public.change_requests;
drop policy if exists "risk_delete_admin" on public.risk_register;
drop policy if exists "retention_delete_admin" on public.retention_policies;
drop policy if exists "tt_delete_admin" on public.tabletop_exercises;

-- 5302072 field_services
drop policy if exists "isp_delete_admin" on public.isp_assessments;
drop policy if exists "us_delete_admin" on public.unifi_surveys;
drop policy if exists "pm_delete_admin" on public.port_maps;
drop policy if exists "cc_delete_admin" on public.camera_calculations;
drop policy if exists "hs_delete_admin" on public.hardware_staging;
drop policy if exists "nd_delete_admin" on public.network_diagrams;

-- 5302073 edu_automation
drop policy if exists "sop_delete_admin" on public.sop_library;
drop policy if exists "compliance_delete_admin" on public.compliance_readiness;
drop policy if exists "ie_delete_admin" on public.insurance_evidence;
drop policy if exists "ap_delete_admin" on public.ai_policies;
drop policy if exists "kb_delete_admin" on public.knowledge_articles;
drop policy if exists "tm_delete_admin" on public.training_modules;
drop policy if exists "ph_delete_admin" on public.phishing_campaigns;
drop policy if exists "cs_delete_admin" on public.cyber_scorecards;
drop policy if exists "aw_delete_admin" on public.automation_workflows;
drop policy if exists "ps_delete_admin" on public.powershell_scripts;
drop policy if exists "kbg_delete_admin" on public.kb_article_generations;

-- 5302074 final_batch
drop policy if exists "sp_delete_admin" on public.sharepoint_plans;
drop policy if exists "dp_delete_admin" on public.device_profiles;
drop policy if exists "sa_delete_admin" on public.saas_audits;
drop policy if exists "pq_delete_admin" on public.procurement_quotes;
drop policy if exists "dns_delete_admin" on public.dns_change_requests;
drop policy if exists "sp2_delete_admin" on public.satisfaction_pulses;
drop policy if exists "te_delete_admin" on public.time_entries;
drop policy if exists "br_delete_admin" on public.budget_roadmaps;
drop policy if exists "crb_delete_admin" on public.client_runbooks;
drop policy if exists "cf_delete_admin" on public.custom_forms;

-- 5302075 backup_dr
drop policy if exists "backup_delete_admin" on public.backup_status;
