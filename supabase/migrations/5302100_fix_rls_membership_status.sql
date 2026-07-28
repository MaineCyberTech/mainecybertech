-- Fix P1 RLS finding: ~100 tables use `organization_id IN (SELECT ...)` 
-- without checking `status = 'approved'` on memberships.
-- 
-- Creates a helper function is_org_member() and rewrites all RLS policies
-- to use it, ensuring only approved memberships grant access.

-- 1. Helper function
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'approved'
  );
$$;

-- =============================================================
-- 5302068: license_tracking, status_items, website_monitors, dmarc_assessments
-- =============================================================

-- license_tracking
drop policy if exists "license_tracking_select_org" on public.license_tracking;
drop policy if exists "license_tracking_insert_auth" on public.license_tracking;
drop policy if exists "license_tracking_update_org" on public.license_tracking;
create policy "license_tracking_select_org" on public.license_tracking
  for select using (public.is_org_member(organization_id));
create policy "license_tracking_insert_auth" on public.license_tracking
  for insert with check (public.is_org_member(organization_id));
create policy "license_tracking_update_org" on public.license_tracking
  for update using (public.is_org_member(organization_id));
create policy "license_tracking_admin_delete" on public.license_tracking
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = license_tracking.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- status_items
drop policy if exists "status_items_select_org" on public.status_items;
drop policy if exists "status_items_insert_auth" on public.status_items;
drop policy if exists "status_items_update_org" on public.status_items;
create policy "status_items_select_org" on public.status_items
  for select using (public.is_org_member(organization_id));
create policy "status_items_insert_auth" on public.status_items
  for insert with check (public.is_org_member(organization_id));
create policy "status_items_update_org" on public.status_items
  for update using (public.is_org_member(organization_id));
create policy "status_items_admin_delete" on public.status_items
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = status_items.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- website_monitors
drop policy if exists "website_monitors_select_org" on public.website_monitors;
drop policy if exists "website_monitors_insert_auth" on public.website_monitors;
drop policy if exists "website_monitors_update_org" on public.website_monitors;
create policy "website_monitors_select_org" on public.website_monitors
  for select using (public.is_org_member(organization_id));
create policy "website_monitors_insert_auth" on public.website_monitors
  for insert with check (public.is_org_member(organization_id));
create policy "website_monitors_update_org" on public.website_monitors
  for update using (public.is_org_member(organization_id));
create policy "website_monitors_admin_delete" on public.website_monitors
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = website_monitors.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- dmarc_assessments
drop policy if exists "dmarc_assessments_select_org" on public.dmarc_assessments;
drop policy if exists "dmarc_assessments_insert_auth" on public.dmarc_assessments;
drop policy if exists "dmarc_assessments_update_org" on public.dmarc_assessments;
create policy "dmarc_assessments_select_org" on public.dmarc_assessments
  for select using (public.is_org_member(organization_id));
create policy "dmarc_assessments_insert_auth" on public.dmarc_assessments
  for insert with check (public.is_org_member(organization_id));
create policy "dmarc_assessments_update_org" on public.dmarc_assessments
  for update using (public.is_org_member(organization_id));
create policy "dmarc_assessments_admin_delete" on public.dmarc_assessments
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dmarc_assessments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302069: offboarding_checklists, break_glass_accounts, onboarding_clients, patch_compliance
-- =============================================================

-- offboarding_checklists
drop policy if exists "offboarding_select_org" on public.offboarding_checklists;
drop policy if exists "offboarding_insert_auth" on public.offboarding_checklists;
drop policy if exists "offboarding_update_org" on public.offboarding_checklists;
create policy "offboarding_select_org" on public.offboarding_checklists
  for select using (public.is_org_member(organization_id));
create policy "offboarding_insert_auth" on public.offboarding_checklists
  for insert with check (public.is_org_member(organization_id));
create policy "offboarding_update_org" on public.offboarding_checklists
  for update using (public.is_org_member(organization_id));
create policy "offboarding_admin_delete" on public.offboarding_checklists
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = offboarding_checklists.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- break_glass_accounts
drop policy if exists "break_glass_select_org" on public.break_glass_accounts;
drop policy if exists "break_glass_insert_auth" on public.break_glass_accounts;
drop policy if exists "break_glass_update_org" on public.break_glass_accounts;
create policy "break_glass_select_org" on public.break_glass_accounts
  for select using (public.is_org_member(organization_id));
create policy "break_glass_insert_auth" on public.break_glass_accounts
  for insert with check (public.is_org_member(organization_id));
create policy "break_glass_update_org" on public.break_glass_accounts
  for update using (public.is_org_member(organization_id));
create policy "break_glass_admin_delete" on public.break_glass_accounts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = break_glass_accounts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- onboarding_clients
drop policy if exists "onboarding_select_org" on public.onboarding_clients;
drop policy if exists "onboarding_insert_auth" on public.onboarding_clients;
drop policy if exists "onboarding_update_org" on public.onboarding_clients;
create policy "onboarding_select_org" on public.onboarding_clients
  for select using (public.is_org_member(organization_id));
create policy "onboarding_insert_auth" on public.onboarding_clients
  for insert with check (public.is_org_member(organization_id));
create policy "onboarding_update_org" on public.onboarding_clients
  for update using (public.is_org_member(organization_id));
create policy "onboarding_admin_delete" on public.onboarding_clients
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = onboarding_clients.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- patch_compliance
drop policy if exists "patch_select_org" on public.patch_compliance;
drop policy if exists "patch_insert_auth" on public.patch_compliance;
drop policy if exists "patch_update_org" on public.patch_compliance;
create policy "patch_select_org" on public.patch_compliance
  for select using (public.is_org_member(organization_id));
create policy "patch_insert_auth" on public.patch_compliance
  for insert with check (public.is_org_member(organization_id));
create policy "patch_update_org" on public.patch_compliance
  for update using (public.is_org_member(organization_id));
create policy "patch_admin_delete" on public.patch_compliance
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = patch_compliance.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302070: m365_hardening, incident_responses, identity_verifications, endpoint_security
-- =============================================================

-- m365_hardening
drop policy if exists "m365_select_org" on public.m365_hardening;
drop policy if exists "m365_insert_auth" on public.m365_hardening;
drop policy if exists "m365_update_org" on public.m365_hardening;
create policy "m365_select_org" on public.m365_hardening
  for select using (public.is_org_member(organization_id));
create policy "m365_insert_auth" on public.m365_hardening
  for insert with check (public.is_org_member(organization_id));
create policy "m365_update_org" on public.m365_hardening
  for update using (public.is_org_member(organization_id));
create policy "m365_admin_delete" on public.m365_hardening
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = m365_hardening.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- incident_responses
drop policy if exists "incident_select_org" on public.incident_responses;
drop policy if exists "incident_insert_auth" on public.incident_responses;
drop policy if exists "incident_update_org" on public.incident_responses;
create policy "incident_select_org" on public.incident_responses
  for select using (public.is_org_member(organization_id));
create policy "incident_insert_auth" on public.incident_responses
  for insert with check (public.is_org_member(organization_id));
create policy "incident_update_org" on public.incident_responses
  for update using (public.is_org_member(organization_id));
create policy "incident_admin_delete" on public.incident_responses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = incident_responses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- identity_verifications
drop policy if exists "idverify_select_org" on public.identity_verifications;
drop policy if exists "idverify_insert_auth" on public.identity_verifications;
drop policy if exists "idverify_update_org" on public.identity_verifications;
create policy "idverify_select_org" on public.identity_verifications
  for select using (public.is_org_member(organization_id));
create policy "idverify_insert_auth" on public.identity_verifications
  for insert with check (public.is_org_member(organization_id));
create policy "idverify_update_org" on public.identity_verifications
  for update using (public.is_org_member(organization_id));
create policy "idverify_admin_delete" on public.identity_verifications
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = identity_verifications.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- endpoint_security
drop policy if exists "ep_select_org" on public.endpoint_security;
drop policy if exists "ep_insert_auth" on public.endpoint_security;
drop policy if exists "ep_update_org" on public.endpoint_security;
create policy "ep_select_org" on public.endpoint_security
  for select using (public.is_org_member(organization_id));
create policy "ep_insert_auth" on public.endpoint_security
  for insert with check (public.is_org_member(organization_id));
create policy "ep_update_org" on public.endpoint_security
  for update using (public.is_org_member(organization_id));
create policy "ep_admin_delete" on public.endpoint_security
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = endpoint_security.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302071: change_requests, risk_register, retention_policies, tabletop_exercises
-- =============================================================

-- change_requests
drop policy if exists "cr_select_org" on public.change_requests;
drop policy if exists "cr_insert_auth" on public.change_requests;
drop policy if exists "cr_update_org" on public.change_requests;
create policy "cr_select_org" on public.change_requests
  for select using (public.is_org_member(organization_id));
create policy "cr_insert_auth" on public.change_requests
  for insert with check (public.is_org_member(organization_id));
create policy "cr_update_org" on public.change_requests
  for update using (public.is_org_member(organization_id));
create policy "cr_admin_delete" on public.change_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = change_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- risk_register
drop policy if exists "risk_select_org" on public.risk_register;
drop policy if exists "risk_insert_auth" on public.risk_register;
drop policy if exists "risk_update_org" on public.risk_register;
create policy "risk_select_org" on public.risk_register
  for select using (public.is_org_member(organization_id));
create policy "risk_insert_auth" on public.risk_register
  for insert with check (public.is_org_member(organization_id));
create policy "risk_update_org" on public.risk_register
  for update using (public.is_org_member(organization_id));
create policy "risk_admin_delete" on public.risk_register
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = risk_register.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- retention_policies
drop policy if exists "retention_select_org" on public.retention_policies;
drop policy if exists "retention_insert_auth" on public.retention_policies;
drop policy if exists "retention_update_org" on public.retention_policies;
create policy "retention_select_org" on public.retention_policies
  for select using (public.is_org_member(organization_id));
create policy "retention_insert_auth" on public.retention_policies
  for insert with check (public.is_org_member(organization_id));
create policy "retention_update_org" on public.retention_policies
  for update using (public.is_org_member(organization_id));
create policy "retention_admin_delete" on public.retention_policies
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = retention_policies.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- tabletop_exercises
drop policy if exists "tt_select_org" on public.tabletop_exercises;
drop policy if exists "tt_insert_auth" on public.tabletop_exercises;
drop policy if exists "tt_update_org" on public.tabletop_exercises;
create policy "tt_select_org" on public.tabletop_exercises
  for select using (public.is_org_member(organization_id));
create policy "tt_insert_auth" on public.tabletop_exercises
  for insert with check (public.is_org_member(organization_id));
create policy "tt_update_org" on public.tabletop_exercises
  for update using (public.is_org_member(organization_id));
create policy "tt_admin_delete" on public.tabletop_exercises
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = tabletop_exercises.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302072: isp_assessments, unifi_surveys, port_maps, camera_calculations, hardware_staging, network_diagrams
-- =============================================================

-- isp_assessments
drop policy if exists "isp_select_org" on public.isp_assessments;
drop policy if exists "isp_insert_auth" on public.isp_assessments;
drop policy if exists "isp_update_org" on public.isp_assessments;
create policy "isp_select_org" on public.isp_assessments
  for select using (public.is_org_member(organization_id));
create policy "isp_insert_auth" on public.isp_assessments
  for insert with check (public.is_org_member(organization_id));
create policy "isp_update_org" on public.isp_assessments
  for update using (public.is_org_member(organization_id));
create policy "isp_admin_delete" on public.isp_assessments
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = isp_assessments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- unifi_surveys
drop policy if exists "us_select_org" on public.unifi_surveys;
drop policy if exists "us_insert_auth" on public.unifi_surveys;
drop policy if exists "us_update_org" on public.unifi_surveys;
create policy "us_select_org" on public.unifi_surveys
  for select using (public.is_org_member(organization_id));
create policy "us_insert_auth" on public.unifi_surveys
  for insert with check (public.is_org_member(organization_id));
create policy "us_update_org" on public.unifi_surveys
  for update using (public.is_org_member(organization_id));
create policy "us_admin_delete" on public.unifi_surveys
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = unifi_surveys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- port_maps
drop policy if exists "pm_select_org" on public.port_maps;
drop policy if exists "pm_insert_auth" on public.port_maps;
drop policy if exists "pm_update_org" on public.port_maps;
create policy "pm_select_org" on public.port_maps
  for select using (public.is_org_member(organization_id));
create policy "pm_insert_auth" on public.port_maps
  for insert with check (public.is_org_member(organization_id));
create policy "pm_update_org" on public.port_maps
  for update using (public.is_org_member(organization_id));
create policy "pm_admin_delete" on public.port_maps
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = port_maps.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- camera_calculations
drop policy if exists "cc_select_org" on public.camera_calculations;
drop policy if exists "cc_insert_auth" on public.camera_calculations;
drop policy if exists "cc_update_org" on public.camera_calculations;
create policy "cc_select_org" on public.camera_calculations
  for select using (public.is_org_member(organization_id));
create policy "cc_insert_auth" on public.camera_calculations
  for insert with check (public.is_org_member(organization_id));
create policy "cc_update_org" on public.camera_calculations
  for update using (public.is_org_member(organization_id));
create policy "cc_admin_delete" on public.camera_calculations
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = camera_calculations.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- hardware_staging
drop policy if exists "hs_select_org" on public.hardware_staging;
drop policy if exists "hs_insert_auth" on public.hardware_staging;
drop policy if exists "hs_update_org" on public.hardware_staging;
create policy "hs_select_org" on public.hardware_staging
  for select using (public.is_org_member(organization_id));
create policy "hs_insert_auth" on public.hardware_staging
  for insert with check (public.is_org_member(organization_id));
create policy "hs_update_org" on public.hardware_staging
  for update using (public.is_org_member(organization_id));
create policy "hs_admin_delete" on public.hardware_staging
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = hardware_staging.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- network_diagrams
drop policy if exists "nd_select_org" on public.network_diagrams;
drop policy if exists "nd_insert_auth" on public.network_diagrams;
drop policy if exists "nd_update_org" on public.network_diagrams;
create policy "nd_select_org" on public.network_diagrams
  for select using (public.is_org_member(organization_id));
create policy "nd_insert_auth" on public.network_diagrams
  for insert with check (public.is_org_member(organization_id));
create policy "nd_update_org" on public.network_diagrams
  for update using (public.is_org_member(organization_id));
create policy "nd_admin_delete" on public.network_diagrams
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = network_diagrams.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302073: sop_library, compliance_readiness, insurance_evidence, ai_policies,
--          knowledge_articles, training_modules, phishing_campaigns, cyber_scorecards,
--          automation_workflows, powershell_scripts, kb_article_generations
-- =============================================================

-- sop_library (named: sop_org, sop_org_i, sop_org_u, sop_org_d)
drop policy if exists "sop_org" on public.sop_library;
drop policy if exists "sop_org_i" on public.sop_library;
drop policy if exists "sop_org_u" on public.sop_library;
drop policy if exists "sop_org_d" on public.sop_library;
create policy "sop_org" on public.sop_library
  for select using (public.is_org_member(organization_id));
create policy "sop_org_i" on public.sop_library
  for insert with check (public.is_org_member(organization_id));
create policy "sop_org_u" on public.sop_library
  for update using (public.is_org_member(organization_id));
create policy "sop_org_d" on public.sop_library
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = sop_library.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- compliance_readiness (named: cr_org, cr_org_i, cr_org_u, cr_org_d)
drop policy if exists "cr_org" on public.compliance_readiness;
drop policy if exists "cr_org_i" on public.compliance_readiness;
drop policy if exists "cr_org_u" on public.compliance_readiness;
drop policy if exists "cr_org_d" on public.compliance_readiness;
create policy "cr_org" on public.compliance_readiness
  for select using (public.is_org_member(organization_id));
create policy "cr_org_i" on public.compliance_readiness
  for insert with check (public.is_org_member(organization_id));
create policy "cr_org_u" on public.compliance_readiness
  for update using (public.is_org_member(organization_id));
create policy "cr_org_d" on public.compliance_readiness
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = compliance_readiness.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- insurance_evidence (5302073 names: ie_org, ie_org_i, ie_org_u, ie_org_d)
drop policy if exists "ie_org" on public.insurance_evidence;
drop policy if exists "ie_org_i" on public.insurance_evidence;
drop policy if exists "ie_org_u" on public.insurance_evidence;
drop policy if exists "ie_org_d" on public.insurance_evidence;
-- 5302091 names: insurance_org_select, insurance_org_insert, insurance_org_update, insurance_admin_delete
drop policy if exists "insurance_org_select" on public.insurance_evidence;
drop policy if exists "insurance_org_insert" on public.insurance_evidence;
drop policy if exists "insurance_org_update" on public.insurance_evidence;
drop policy if exists "insurance_admin_delete" on public.insurance_evidence;
create policy "insurance_org_select" on public.insurance_evidence
  for select using (public.is_org_member(organization_id));
create policy "insurance_org_insert" on public.insurance_evidence
  for insert with check (public.is_org_member(organization_id));
create policy "insurance_org_update" on public.insurance_evidence
  for update using (public.is_org_member(organization_id));
create policy "insurance_admin_delete" on public.insurance_evidence
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = insurance_evidence.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- ai_policies (named: ap_org, ap_org_i, ap_org_u, ap_org_d)
drop policy if exists "ap_org" on public.ai_policies;
drop policy if exists "ap_org_i" on public.ai_policies;
drop policy if exists "ap_org_u" on public.ai_policies;
drop policy if exists "ap_org_d" on public.ai_policies;
create policy "ap_org" on public.ai_policies
  for select using (public.is_org_member(organization_id));
create policy "ap_org_i" on public.ai_policies
  for insert with check (public.is_org_member(organization_id));
create policy "ap_org_u" on public.ai_policies
  for update using (public.is_org_member(organization_id));
create policy "ap_org_d" on public.ai_policies
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = ai_policies.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- knowledge_articles (named: kb_org, kb_org_i, kb_org_u, kb_org_d)
drop policy if exists "kb_org" on public.knowledge_articles;
drop policy if exists "kb_org_i" on public.knowledge_articles;
drop policy if exists "kb_org_u" on public.knowledge_articles;
drop policy if exists "kb_org_d" on public.knowledge_articles;
create policy "kb_org" on public.knowledge_articles
  for select using (public.is_org_member(organization_id));
create policy "kb_org_i" on public.knowledge_articles
  for insert with check (public.is_org_member(organization_id));
create policy "kb_org_u" on public.knowledge_articles
  for update using (public.is_org_member(organization_id));
create policy "kb_org_d" on public.knowledge_articles
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = knowledge_articles.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- training_modules (named: tm_org, tm_org_i, tm_org_u, tm_org_d)
drop policy if exists "tm_org" on public.training_modules;
drop policy if exists "tm_org_i" on public.training_modules;
drop policy if exists "tm_org_u" on public.training_modules;
drop policy if exists "tm_org_d" on public.training_modules;
create policy "tm_org" on public.training_modules
  for select using (public.is_org_member(organization_id));
create policy "tm_org_i" on public.training_modules
  for insert with check (public.is_org_member(organization_id));
create policy "tm_org_u" on public.training_modules
  for update using (public.is_org_member(organization_id));
create policy "tm_org_d" on public.training_modules
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = training_modules.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- phishing_campaigns (named: ph_org, ph_org_i, ph_org_u, ph_org_d)
drop policy if exists "ph_org" on public.phishing_campaigns;
drop policy if exists "ph_org_i" on public.phishing_campaigns;
drop policy if exists "ph_org_u" on public.phishing_campaigns;
drop policy if exists "ph_org_d" on public.phishing_campaigns;
create policy "ph_org" on public.phishing_campaigns
  for select using (public.is_org_member(organization_id));
create policy "ph_org_i" on public.phishing_campaigns
  for insert with check (public.is_org_member(organization_id));
create policy "ph_org_u" on public.phishing_campaigns
  for update using (public.is_org_member(organization_id));
create policy "ph_org_d" on public.phishing_campaigns
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = phishing_campaigns.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- cyber_scorecards (named: cs_org, cs_org_i, cs_org_u, cs_org_d)
drop policy if exists "cs_org" on public.cyber_scorecards;
drop policy if exists "cs_org_i" on public.cyber_scorecards;
drop policy if exists "cs_org_u" on public.cyber_scorecards;
drop policy if exists "cs_org_d" on public.cyber_scorecards;
create policy "cs_org" on public.cyber_scorecards
  for select using (public.is_org_member(organization_id));
create policy "cs_org_i" on public.cyber_scorecards
  for insert with check (public.is_org_member(organization_id));
create policy "cs_org_u" on public.cyber_scorecards
  for update using (public.is_org_member(organization_id));
create policy "cs_org_d" on public.cyber_scorecards
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = cyber_scorecards.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- automation_workflows (named: aw_org, aw_org_i, aw_org_u, aw_org_d)
drop policy if exists "aw_org" on public.automation_workflows;
drop policy if exists "aw_org_i" on public.automation_workflows;
drop policy if exists "aw_org_u" on public.automation_workflows;
drop policy if exists "aw_org_d" on public.automation_workflows;
create policy "aw_org" on public.automation_workflows
  for select using (public.is_org_member(organization_id));
create policy "aw_org_i" on public.automation_workflows
  for insert with check (public.is_org_member(organization_id));
create policy "aw_org_u" on public.automation_workflows
  for update using (public.is_org_member(organization_id));
create policy "aw_org_d" on public.automation_workflows
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = automation_workflows.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- powershell_scripts (named: ps_org, ps_org_i, ps_org_u, ps_org_d)
drop policy if exists "ps_org" on public.powershell_scripts;
drop policy if exists "ps_org_i" on public.powershell_scripts;
drop policy if exists "ps_org_u" on public.powershell_scripts;
drop policy if exists "ps_org_d" on public.powershell_scripts;
create policy "ps_org" on public.powershell_scripts
  for select using (public.is_org_member(organization_id));
create policy "ps_org_i" on public.powershell_scripts
  for insert with check (public.is_org_member(organization_id));
create policy "ps_org_u" on public.powershell_scripts
  for update using (public.is_org_member(organization_id));
create policy "ps_org_d" on public.powershell_scripts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = powershell_scripts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- kb_article_generations (named: kbg_org, kbg_org_i, kbg_org_u, kbg_org_d)
drop policy if exists "kbg_org" on public.kb_article_generations;
drop policy if exists "kbg_org_i" on public.kb_article_generations;
drop policy if exists "kbg_org_u" on public.kb_article_generations;
drop policy if exists "kbg_org_d" on public.kb_article_generations;
create policy "kbg_org" on public.kb_article_generations
  for select using (public.is_org_member(organization_id));
create policy "kbg_org_i" on public.kb_article_generations
  for insert with check (public.is_org_member(organization_id));
create policy "kbg_org_u" on public.kb_article_generations
  for update using (public.is_org_member(organization_id));
create policy "kbg_org_d" on public.kb_article_generations
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = kb_article_generations.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302074: sharepoint_plans, device_profiles, saas_audits, procurement_quotes,
--          dns_change_requests, satisfaction_pulses, time_entries,
--          budget_roadmaps, client_runbooks, custom_forms
-- =============================================================

-- sharepoint_plans (named: sp_org, sp_org_i, sp_org_u)
drop policy if exists "sp_org" on public.sharepoint_plans;
drop policy if exists "sp_org_i" on public.sharepoint_plans;
drop policy if exists "sp_org_u" on public.sharepoint_plans;
create policy "sp_org" on public.sharepoint_plans
  for select using (public.is_org_member(organization_id));
create policy "sp_org_i" on public.sharepoint_plans
  for insert with check (public.is_org_member(organization_id));
create policy "sp_org_u" on public.sharepoint_plans
  for update using (public.is_org_member(organization_id));
create policy "sp_admin_delete" on public.sharepoint_plans
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = sharepoint_plans.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- device_profiles (named: dp_org, dp_org_i, dp_org_u)
drop policy if exists "dp_org" on public.device_profiles;
drop policy if exists "dp_org_i" on public.device_profiles;
drop policy if exists "dp_org_u" on public.device_profiles;
create policy "dp_org" on public.device_profiles
  for select using (public.is_org_member(organization_id));
create policy "dp_org_i" on public.device_profiles
  for insert with check (public.is_org_member(organization_id));
create policy "dp_org_u" on public.device_profiles
  for update using (public.is_org_member(organization_id));
create policy "dp_admin_delete" on public.device_profiles
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = device_profiles.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- saas_audits (named: sa_org, sa_org_i, sa_org_u)
drop policy if exists "sa_org" on public.saas_audits;
drop policy if exists "sa_org_i" on public.saas_audits;
drop policy if exists "sa_org_u" on public.saas_audits;
create policy "sa_org" on public.saas_audits
  for select using (public.is_org_member(organization_id));
create policy "sa_org_i" on public.saas_audits
  for insert with check (public.is_org_member(organization_id));
create policy "sa_org_u" on public.saas_audits
  for update using (public.is_org_member(organization_id));
create policy "sa_admin_delete" on public.saas_audits
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = saas_audits.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- procurement_quotes (named: pq_org, pq_org_i, pq_org_u)
drop policy if exists "pq_org" on public.procurement_quotes;
drop policy if exists "pq_org_i" on public.procurement_quotes;
drop policy if exists "pq_org_u" on public.procurement_quotes;
create policy "pq_org" on public.procurement_quotes
  for select using (public.is_org_member(organization_id));
create policy "pq_org_i" on public.procurement_quotes
  for insert with check (public.is_org_member(organization_id));
create policy "pq_org_u" on public.procurement_quotes
  for update using (public.is_org_member(organization_id));
create policy "pq_admin_delete" on public.procurement_quotes
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = procurement_quotes.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- dns_change_requests (named: dns_org, dns_org_i, dns_org_u)
drop policy if exists "dns_org" on public.dns_change_requests;
drop policy if exists "dns_org_i" on public.dns_change_requests;
drop policy if exists "dns_org_u" on public.dns_change_requests;
create policy "dns_org" on public.dns_change_requests
  for select using (public.is_org_member(organization_id));
create policy "dns_org_i" on public.dns_change_requests
  for insert with check (public.is_org_member(organization_id));
create policy "dns_org_u" on public.dns_change_requests
  for update using (public.is_org_member(organization_id));
create policy "dns_admin_delete" on public.dns_change_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dns_change_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- satisfaction_pulses (5302074 names: sp2_org, sp2_org_i)
-- Also defined in 5302079 with names: satisfaction_pulses_select_org, etc.
-- Drop both sets, use 5302079 names
drop policy if exists "sp2_org" on public.satisfaction_pulses;
drop policy if exists "sp2_org_i" on public.satisfaction_pulses;
drop policy if exists "satisfaction_pulses_select_org" on public.satisfaction_pulses;
drop policy if exists "satisfaction_pulses_insert_auth" on public.satisfaction_pulses;
drop policy if exists "satisfaction_pulses_update_org" on public.satisfaction_pulses;
drop policy if exists "satisfaction_pulses_delete_admin" on public.satisfaction_pulses;
create policy "satisfaction_pulses_select_org" on public.satisfaction_pulses
  for select using (public.is_org_member(organization_id));
create policy "satisfaction_pulses_insert_auth" on public.satisfaction_pulses
  for insert with check (public.is_org_member(organization_id));
create policy "satisfaction_pulses_update_org" on public.satisfaction_pulses
  for update using (public.is_org_member(organization_id));
create policy "satisfaction_pulses_delete_admin" on public.satisfaction_pulses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = satisfaction_pulses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- time_entries (named: te_org, te_org_i)
drop policy if exists "te_org" on public.time_entries;
drop policy if exists "te_org_i" on public.time_entries;
create policy "te_org" on public.time_entries
  for select using (public.is_org_member(organization_id));
create policy "te_org_i" on public.time_entries
  for insert with check (public.is_org_member(organization_id));
create policy "te_org_u" on public.time_entries
  for update using (public.is_org_member(organization_id));
create policy "te_admin_delete" on public.time_entries
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = time_entries.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- budget_roadmaps (named: br_org, br_org_i, br_org_u)
drop policy if exists "br_org" on public.budget_roadmaps;
drop policy if exists "br_org_i" on public.budget_roadmaps;
drop policy if exists "br_org_u" on public.budget_roadmaps;
create policy "br_org" on public.budget_roadmaps
  for select using (public.is_org_member(organization_id));
create policy "br_org_i" on public.budget_roadmaps
  for insert with check (public.is_org_member(organization_id));
create policy "br_org_u" on public.budget_roadmaps
  for update using (public.is_org_member(organization_id));
create policy "br_admin_delete" on public.budget_roadmaps
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = budget_roadmaps.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- client_runbooks (named: crb_org, crb_org_i, crb_org_u)
drop policy if exists "crb_org" on public.client_runbooks;
drop policy if exists "crb_org_i" on public.client_runbooks;
drop policy if exists "crb_org_u" on public.client_runbooks;
create policy "crb_org" on public.client_runbooks
  for select using (public.is_org_member(organization_id));
create policy "crb_org_i" on public.client_runbooks
  for insert with check (public.is_org_member(organization_id));
create policy "crb_org_u" on public.client_runbooks
  for update using (public.is_org_member(organization_id));
create policy "crb_admin_delete" on public.client_runbooks
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = client_runbooks.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- custom_forms (named: cf_org, cf_org_i, cf_org_u)
drop policy if exists "cf_org" on public.custom_forms;
drop policy if exists "cf_org_i" on public.custom_forms;
drop policy if exists "cf_org_u" on public.custom_forms;
create policy "cf_org" on public.custom_forms
  for select using (public.is_org_member(organization_id));
create policy "cf_org_i" on public.custom_forms
  for insert with check (public.is_org_member(organization_id));
create policy "cf_org_u" on public.custom_forms
  for update using (public.is_org_member(organization_id));
create policy "cf_admin_delete" on public.custom_forms
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = custom_forms.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302075: backup_status
-- =============================================================

-- backup_status (named: backup_select_org, backup_insert_auth, backup_update_org)
drop policy if exists "backup_select_org" on public.backup_status;
drop policy if exists "backup_insert_auth" on public.backup_status;
drop policy if exists "backup_update_org" on public.backup_status;
create policy "backup_select_org" on public.backup_status
  for select using (public.is_org_member(organization_id));
create policy "backup_insert_auth" on public.backup_status
  for insert with check (public.is_org_member(organization_id));
create policy "backup_update_org" on public.backup_status
  for update using (public.is_org_member(organization_id));
create policy "backup_admin_delete" on public.backup_status
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = backup_status.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302078: client_onboarding_command_center_records, client_onboarding_checklist_items
-- =============================================================

-- client_onboarding_command_center_records
drop policy if exists "client_onboarding_select_org" on public.client_onboarding_command_center_records;
drop policy if exists "client_onboarding_insert_auth" on public.client_onboarding_command_center_records;
drop policy if exists "client_onboarding_update_org" on public.client_onboarding_command_center_records;
drop policy if exists "client_onboarding_delete_admin" on public.client_onboarding_command_center_records;
create policy "client_onboarding_select_org" on public.client_onboarding_command_center_records
  for select using (public.is_org_member(organization_id));
create policy "client_onboarding_insert_auth" on public.client_onboarding_command_center_records
  for insert with check (public.is_org_member(organization_id));
create policy "client_onboarding_update_org" on public.client_onboarding_command_center_records
  for update using (public.is_org_member(organization_id));
create policy "client_onboarding_delete_admin" on public.client_onboarding_command_center_records
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = client_onboarding_command_center_records.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- client_onboarding_checklist_items
drop policy if exists "client_onboarding_checklist_select_org" on public.client_onboarding_checklist_items;
drop policy if exists "client_onboarding_checklist_insert_auth" on public.client_onboarding_checklist_items;
drop policy if exists "client_onboarding_checklist_update_org" on public.client_onboarding_checklist_items;
drop policy if exists "client_onboarding_checklist_delete_admin" on public.client_onboarding_checklist_items;
create policy "client_onboarding_checklist_select_org" on public.client_onboarding_checklist_items
  for select using (public.is_org_member(organization_id));
create policy "client_onboarding_checklist_insert_auth" on public.client_onboarding_checklist_items
  for insert with check (public.is_org_member(organization_id));
create policy "client_onboarding_checklist_update_org" on public.client_onboarding_checklist_items
  for update using (public.is_org_member(organization_id));
create policy "client_onboarding_checklist_delete_admin" on public.client_onboarding_checklist_items
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = client_onboarding_checklist_items.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302079: satisfaction_pulse_templates, satisfaction_pulse_schedules
-- =============================================================

-- satisfaction_pulse_templates
drop policy if exists "satisfaction_pulse_templates_select_org" on public.satisfaction_pulse_templates;
drop policy if exists "satisfaction_pulse_templates_insert_auth" on public.satisfaction_pulse_templates;
drop policy if exists "satisfaction_pulse_templates_update_org" on public.satisfaction_pulse_templates;
drop policy if exists "satisfaction_pulse_templates_delete_admin" on public.satisfaction_pulse_templates;
create policy "satisfaction_pulse_templates_select_org" on public.satisfaction_pulse_templates
  for select using (public.is_org_member(organization_id));
create policy "satisfaction_pulse_templates_insert_auth" on public.satisfaction_pulse_templates
  for insert with check (public.is_org_member(organization_id));
create policy "satisfaction_pulse_templates_update_org" on public.satisfaction_pulse_templates
  for update using (public.is_org_member(organization_id));
create policy "satisfaction_pulse_templates_delete_admin" on public.satisfaction_pulse_templates
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = satisfaction_pulse_templates.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- satisfaction_pulse_schedules
drop policy if exists "satisfaction_pulse_schedules_select_org" on public.satisfaction_pulse_schedules;
drop policy if exists "satisfaction_pulse_schedules_insert_auth" on public.satisfaction_pulse_schedules;
drop policy if exists "satisfaction_pulse_schedules_update_org" on public.satisfaction_pulse_schedules;
drop policy if exists "satisfaction_pulse_schedules_delete_admin" on public.satisfaction_pulse_schedules;
create policy "satisfaction_pulse_schedules_select_org" on public.satisfaction_pulse_schedules
  for select using (public.is_org_member(organization_id));
create policy "satisfaction_pulse_schedules_insert_auth" on public.satisfaction_pulse_schedules
  for insert with check (public.is_org_member(organization_id));
create policy "satisfaction_pulse_schedules_update_org" on public.satisfaction_pulse_schedules
  for update using (public.is_org_member(organization_id));
create policy "satisfaction_pulse_schedules_delete_admin" on public.satisfaction_pulse_schedules
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = satisfaction_pulse_schedules.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302080: dynamic_client_forms, dynamic_form_submissions
-- =============================================================

-- dynamic_client_forms
drop policy if exists "dynamic_client_forms_org_read" on public.dynamic_client_forms;
drop policy if exists "dynamic_client_forms_org_insert" on public.dynamic_client_forms;
drop policy if exists "dynamic_client_forms_org_update" on public.dynamic_client_forms;
drop policy if exists "dynamic_client_forms_org_delete" on public.dynamic_client_forms;
create policy "dynamic_client_forms_org_read" on public.dynamic_client_forms
  for select using (public.is_org_member(organization_id));
create policy "dynamic_client_forms_org_insert" on public.dynamic_client_forms
  for insert with check (public.is_org_member(organization_id));
create policy "dynamic_client_forms_org_update" on public.dynamic_client_forms
  for update using (public.is_org_member(organization_id));
create policy "dynamic_client_forms_org_delete" on public.dynamic_client_forms
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dynamic_client_forms.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- dynamic_form_submissions
drop policy if exists "dynamic_form_submissions_org_read" on public.dynamic_form_submissions;
drop policy if exists "dynamic_form_submissions_org_insert" on public.dynamic_form_submissions;
drop policy if exists "dynamic_form_submissions_org_update" on public.dynamic_form_submissions;
drop policy if exists "dynamic_form_submissions_org_delete" on public.dynamic_form_submissions;
create policy "dynamic_form_submissions_org_read" on public.dynamic_form_submissions
  for select using (public.is_org_member(organization_id));
create policy "dynamic_form_submissions_org_insert" on public.dynamic_form_submissions
  for insert with check (public.is_org_member(organization_id));
create policy "dynamic_form_submissions_org_update" on public.dynamic_form_submissions
  for update using (public.is_org_member(organization_id));
create policy "dynamic_form_submissions_org_delete" on public.dynamic_form_submissions
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dynamic_form_submissions.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302088: license_allocations
-- =============================================================

drop policy if exists "license_org_select" on public.license_allocations;
drop policy if exists "license_org_insert" on public.license_allocations;
drop policy if exists "license_org_update" on public.license_allocations;
drop policy if exists "license_admin_delete" on public.license_allocations;
create policy "license_org_select" on public.license_allocations
  for select using (public.is_org_member(organization_id));
create policy "license_org_insert" on public.license_allocations
  for insert with check (public.is_org_member(organization_id));
create policy "license_org_update" on public.license_allocations
  for update using (public.is_org_member(organization_id));
create policy "license_admin_delete" on public.license_allocations
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = license_allocations.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302089: dmarc_analyses
-- =============================================================

drop policy if exists "dmarc_org_select" on public.dmarc_analyses;
drop policy if exists "dmarc_org_insert" on public.dmarc_analyses;
drop policy if exists "dmarc_org_update" on public.dmarc_analyses;
drop policy if exists "dmarc_admin_delete" on public.dmarc_analyses;
create policy "dmarc_org_select" on public.dmarc_analyses
  for select using (public.is_org_member(organization_id));
create policy "dmarc_org_insert" on public.dmarc_analyses
  for insert with check (public.is_org_member(organization_id));
create policy "dmarc_org_update" on public.dmarc_analyses
  for update using (public.is_org_member(organization_id));
create policy "dmarc_admin_delete" on public.dmarc_analyses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dmarc_analyses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302090: training_courses, training_lessons, training_enrollments
-- =============================================================

-- training_courses
drop policy if exists "courses_org_select" on public.training_courses;
drop policy if exists "courses_org_insert" on public.training_courses;
drop policy if exists "courses_org_update" on public.training_courses;
drop policy if exists "courses_admin_delete" on public.training_courses;
create policy "courses_org_select" on public.training_courses
  for select using (public.is_org_member(organization_id));
create policy "courses_org_insert" on public.training_courses
  for insert with check (public.is_org_member(organization_id));
create policy "courses_org_update" on public.training_courses
  for update using (public.is_org_member(organization_id));
create policy "courses_admin_delete" on public.training_courses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = training_courses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- training_lessons (checks via training_courses.organization_id)
drop policy if exists "lessons_org_select" on public.training_lessons;
drop policy if exists "lessons_org_insert" on public.training_lessons;
drop policy if exists "lessons_org_update" on public.training_lessons;
drop policy if exists "lessons_admin_delete" on public.training_lessons;
create policy "lessons_org_select" on public.training_lessons
  for select using (
    exists (
      select 1 from public.training_courses tc
      where tc.id = training_lessons.course_id
        and public.is_org_member(tc.organization_id)
    )
  );
create policy "lessons_org_insert" on public.training_lessons
  for insert with check (
    exists (
      select 1 from public.training_courses tc
      where tc.id = training_lessons.course_id
        and public.is_org_member(tc.organization_id)
    )
  );
create policy "lessons_org_update" on public.training_lessons
  for update using (
    exists (
      select 1 from public.training_courses tc
      where tc.id = training_lessons.course_id
        and public.is_org_member(tc.organization_id)
    )
  );
create policy "lessons_admin_delete" on public.training_lessons
  for delete using (
    exists (
      select 1 from public.training_courses tc
      join public.memberships m on m.organization_id = tc.organization_id
      join public.roles r on m.role_id = r.id
      where tc.id = training_lessons.course_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- training_enrollments (user-scoped, uses user_id = auth.uid())
drop policy if exists "enrollments_own" on public.training_enrollments;
drop policy if exists "enrollments_own_insert" on public.training_enrollments;
drop policy if exists "enrollments_own_update" on public.training_enrollments;
create policy "enrollments_own" on public.training_enrollments
  for select using (user_id = auth.uid());
create policy "enrollments_own_insert" on public.training_enrollments
  for insert with check (user_id = auth.uid());
create policy "enrollments_own_update" on public.training_enrollments
  for update using (user_id = auth.uid());

-- =============================================================
-- 5302091: insurance_evidence (already handled above alongside 5302073)
-- =============================================================

-- =============================================================
-- 5302092: status_components, status_incidents, maintenance_notices
-- =============================================================

-- status_components
drop policy if exists "status_org_select" on public.status_components;
drop policy if exists "status_org_insert" on public.status_components;
drop policy if exists "status_org_update" on public.status_components;
drop policy if exists "status_admin_delete" on public.status_components;
create policy "status_org_select" on public.status_components
  for select using (public.is_org_member(organization_id));
create policy "status_org_insert" on public.status_components
  for insert with check (public.is_org_member(organization_id));
create policy "status_org_update" on public.status_components
  for update using (public.is_org_member(organization_id));
create policy "status_admin_delete" on public.status_components
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = status_components.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- status_incidents
drop policy if exists "incidents_org_select" on public.status_incidents;
drop policy if exists "incidents_org_insert" on public.status_incidents;
drop policy if exists "incidents_org_update" on public.status_incidents;
drop policy if exists "incidents_admin_delete" on public.status_incidents;
create policy "incidents_org_select" on public.status_incidents
  for select using (public.is_org_member(organization_id));
create policy "incidents_org_insert" on public.status_incidents
  for insert with check (public.is_org_member(organization_id));
create policy "incidents_org_update" on public.status_incidents
  for update using (public.is_org_member(organization_id));
create policy "incidents_admin_delete" on public.status_incidents
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = status_incidents.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- maintenance_notices
drop policy if exists "maintenance_org_select" on public.maintenance_notices;
drop policy if exists "maintenance_org_insert" on public.maintenance_notices;
drop policy if exists "maintenance_org_update" on public.maintenance_notices;
drop policy if exists "maintenance_admin_delete" on public.maintenance_notices;
create policy "maintenance_org_select" on public.maintenance_notices
  for select using (public.is_org_member(organization_id));
create policy "maintenance_org_insert" on public.maintenance_notices
  for insert with check (public.is_org_member(organization_id));
create policy "maintenance_org_update" on public.maintenance_notices
  for update using (public.is_org_member(organization_id));
create policy "maintenance_admin_delete" on public.maintenance_notices
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = maintenance_notices.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- =============================================================
-- 5302093: uptime_checks, uptime_results
-- =============================================================

-- uptime_checks
drop policy if exists "uptime_checks_org_select" on public.uptime_checks;
drop policy if exists "uptime_checks_org_insert" on public.uptime_checks;
drop policy if exists "uptime_checks_org_update" on public.uptime_checks;
drop policy if exists "uptime_checks_admin_delete" on public.uptime_checks;
create policy "uptime_checks_org_select" on public.uptime_checks
  for select using (public.is_org_member(organization_id));
create policy "uptime_checks_org_insert" on public.uptime_checks
  for insert with check (public.is_org_member(organization_id));
create policy "uptime_checks_org_update" on public.uptime_checks
  for update using (public.is_org_member(organization_id));
create policy "uptime_checks_admin_delete" on public.uptime_checks
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = uptime_checks.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );

-- uptime_results (no direct organization_id — checks via uptime_checks)
drop policy if exists "uptime_results_org_select" on public.uptime_results;
drop policy if exists "uptime_results_org_insert" on public.uptime_results;
create policy "uptime_results_org_select" on public.uptime_results
  for select using (
    exists (
      select 1 from public.uptime_checks uc
      where uc.id = uptime_results.check_id
        and public.is_org_member(uc.organization_id)
    )
  );
create policy "uptime_results_org_insert" on public.uptime_results
  for insert with check (
    exists (
      select 1 from public.uptime_checks uc
      where uc.id = uptime_results.check_id
        and public.is_org_member(uc.organization_id)
    )
  );
create policy "uptime_results_org_update" on public.uptime_results
  for update using (
    exists (
      select 1 from public.uptime_checks uc
      where uc.id = uptime_results.check_id
        and public.is_org_member(uc.organization_id)
    )
  );
create policy "uptime_results_admin_delete" on public.uptime_results
  for delete using (
    exists (
      select 1 from public.uptime_checks uc
      join public.memberships m on m.organization_id = uc.organization_id
      join public.roles r on m.role_id = r.id
      where uc.id = uptime_results.check_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );