-- Add missing DELETE RLS policies to all batch migration tables
-- This is defense-in-depth: API uses service_role which bypasses RLS,
-- but if client mode ever changes, these guards protect org-scoped data.

-- 5302068: batch_modules (license_tracking, status_items, website_monitors, dmarc_assessments)
drop policy if exists "license_tracking_delete_admin" on license_tracking;
create policy "license_tracking_delete_admin" on license_tracking for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = license_tracking.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "status_items_delete_admin" on status_items;
create policy "status_items_delete_admin" on status_items for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = status_items.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "website_monitors_delete_admin" on website_monitors;
create policy "website_monitors_delete_admin" on website_monitors for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = website_monitors.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "dmarc_assessments_delete_admin" on dmarc_assessments;
create policy "dmarc_assessments_delete_admin" on dmarc_assessments for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = dmarc_assessments.organization_id and r.key in ('super_admin', 'admin')));

-- 5302069: security_ops (offboarding_checklists, break_glass_accounts, onboarding_clients, patch_compliance)
drop policy if exists "offboarding_delete_admin" on offboarding_checklists;
create policy "offboarding_delete_admin" on offboarding_checklists for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = offboarding_checklists.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "break_glass_delete_admin" on break_glass_accounts;
create policy "break_glass_delete_admin" on break_glass_accounts for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = break_glass_accounts.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "onboarding_delete_admin" on onboarding_clients;
create policy "onboarding_delete_admin" on onboarding_clients for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = onboarding_clients.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "patch_compliance_delete_admin" on patch_compliance;
create policy "patch_compliance_delete_admin" on patch_compliance for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = patch_compliance.organization_id and r.key in ('super_admin', 'admin')));

-- 5302070: security_suite (m365_hardening, incident_responses, identity_verifications, endpoint_security)
drop policy if exists "m365_delete_admin" on m365_hardening;
create policy "m365_delete_admin" on m365_hardening for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = m365_hardening.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "incident_delete_admin" on incident_responses;
create policy "incident_delete_admin" on incident_responses for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = incident_responses.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "idverify_delete_admin" on identity_verifications;
create policy "idverify_delete_admin" on identity_verifications for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = identity_verifications.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "ep_delete_admin" on endpoint_security;
create policy "ep_delete_admin" on endpoint_security for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = endpoint_security.organization_id and r.key in ('super_admin', 'admin')));

-- 5302071: governance (change_requests, risk_register, retention_policies, tabletop_exercises)
drop policy if exists "cr_delete_admin" on change_requests;
create policy "cr_delete_admin" on change_requests for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = change_requests.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "risk_delete_admin" on risk_register;
create policy "risk_delete_admin" on risk_register for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = risk_register.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "retention_delete_admin" on retention_policies;
create policy "retention_delete_admin" on retention_policies for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = retention_policies.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "tt_delete_admin" on tabletop_exercises;
create policy "tt_delete_admin" on tabletop_exercises for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = tabletop_exercises.organization_id and r.key in ('super_admin', 'admin')));

-- 5302072: field_services (isp_assessments, unifi_surveys, port_maps, camera_calculations, hardware_staging, network_diagrams)
drop policy if exists "isp_delete_admin" on isp_assessments;
create policy "isp_delete_admin" on isp_assessments for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = isp_assessments.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "us_delete_admin" on unifi_surveys;
create policy "us_delete_admin" on unifi_surveys for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = unifi_surveys.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "pm_delete_admin" on port_maps;
create policy "pm_delete_admin" on port_maps for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = port_maps.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "cc_delete_admin" on camera_calculations;
create policy "cc_delete_admin" on camera_calculations for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = camera_calculations.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "hs_delete_admin" on hardware_staging;
create policy "hs_delete_admin" on hardware_staging for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = hardware_staging.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "nd_delete_admin" on network_diagrams;
create policy "nd_delete_admin" on network_diagrams for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = network_diagrams.organization_id and r.key in ('super_admin', 'admin')));

-- 5302073: edu_automation (11 tables)
drop policy if exists "sop_delete_admin" on sop_library;
create policy "sop_delete_admin" on sop_library for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = sop_library.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "compliance_delete_admin" on compliance_readiness;
create policy "compliance_delete_admin" on compliance_readiness for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = compliance_readiness.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "ie_delete_admin" on insurance_evidence;
create policy "ie_delete_admin" on insurance_evidence for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = insurance_evidence.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "ap_delete_admin" on ai_policies;
create policy "ap_delete_admin" on ai_policies for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = ai_policies.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "kb_delete_admin" on knowledge_articles;
create policy "kb_delete_admin" on knowledge_articles for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = knowledge_articles.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "tm_delete_admin" on training_modules;
create policy "tm_delete_admin" on training_modules for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = training_modules.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "ph_delete_admin" on phishing_campaigns;
create policy "ph_delete_admin" on phishing_campaigns for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = phishing_campaigns.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "cs_delete_admin" on cyber_scorecards;
create policy "cs_delete_admin" on cyber_scorecards for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = cyber_scorecards.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "aw_delete_admin" on automation_workflows;
create policy "aw_delete_admin" on automation_workflows for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = automation_workflows.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "ps_delete_admin" on powershell_scripts;
create policy "ps_delete_admin" on powershell_scripts for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = powershell_scripts.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "kbg_delete_admin" on kb_article_generations;
create policy "kbg_delete_admin" on kb_article_generations for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = kb_article_generations.organization_id and r.key in ('super_admin', 'admin')));

-- 5302074: final_batch (10 tables)
drop policy if exists "sp_delete_admin" on sharepoint_plans;
create policy "sp_delete_admin" on sharepoint_plans for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = sharepoint_plans.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "dp_delete_admin" on device_profiles;
create policy "dp_delete_admin" on device_profiles for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = device_profiles.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "sa_delete_admin" on saas_audits;
create policy "sa_delete_admin" on saas_audits for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = saas_audits.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "pq_delete_admin" on procurement_quotes;
create policy "pq_delete_admin" on procurement_quotes for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = procurement_quotes.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "dns_delete_admin" on dns_change_requests;
create policy "dns_delete_admin" on dns_change_requests for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = dns_change_requests.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "sp2_delete_admin" on satisfaction_pulses;
create policy "sp2_delete_admin" on satisfaction_pulses for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = satisfaction_pulses.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "te_delete_admin" on time_entries;
create policy "te_delete_admin" on time_entries for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = time_entries.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "br_delete_admin" on budget_roadmaps;
create policy "br_delete_admin" on budget_roadmaps for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = budget_roadmaps.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "crb_delete_admin" on client_runbooks;
create policy "crb_delete_admin" on client_runbooks for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = client_runbooks.organization_id and r.key in ('super_admin', 'admin')));
drop policy if exists "cf_delete_admin" on custom_forms;
create policy "cf_delete_admin" on custom_forms for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = custom_forms.organization_id and r.key in ('super_admin', 'admin')));

-- 5302075: backup_dr (backup_status)
drop policy if exists "backup_delete_admin" on backup_status;
create policy "backup_delete_admin" on backup_status for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = backup_status.organization_id and r.key in ('super_admin', 'admin')));
