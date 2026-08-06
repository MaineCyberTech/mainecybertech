begin;
-- =========================================================
-- 08_expanded_test_data.sql  (PART 1: core tickets/documents/projects/assets/findings)
-- Expansion pass for the demo dataset. Fills the gaps seeds 00-07 left:
--   * every tenant now has MULTIPLE rows in core user-facing modules
--   * Acme (11111111) + Northwind (22222222) get rows in EVERY module table
-- LOCAL / DEV ONLY. All inserts idempotent (on conflict do nothing).
-- New UUID prefixes (527/547/538/539/567/557) are unused by seeds 00-07.
-- =========================================================

-- ---------------------------------------------------------
-- 1. TICKETS (2 more per org, incl. resolved/closed variety)
-- ---------------------------------------------------------
insert into public.tickets (id, organization_id, created_by, assigned_to, title, description, status, priority, category, source, labels, metadata) values
  ('52700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Warehouse scanner sync failure', 'Barcode scanners on the warehouse floor lose sync with the WMS every afternoon.', 'open', 'high', 'hardware', 'portal', '{warehouse,scanner}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Firewall rule change for new vendor VPN', 'Finance wants the new payroll vendor on a dedicated VPN tunnel.', 'in_progress', 'normal', 'network', 'portal', '{vpn,finance}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Document management training needed', 'Attorneys want a session on the new DMS workflows.', 'new', 'low', 'training', 'portal', '{dms,training}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Conference room AV not powering on', 'The main conference room TV and speaker system will not power on.', 'resolved', 'normal', 'hardware', 'portal', '{av,conference}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Patient portal certificate warning', 'Some patients see a certificate warning on the patient portal login.', 'triaged', 'high', 'security', 'portal', '{tls,portal}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Nurse station PC replacement', 'Three nurse stations need replacement PCs before the next audit.', 'open', 'normal', 'hardware', 'portal', '{hardware,audit}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Gift card printer offline at Store 12', 'The gift card printer at Store 12 is offline since this morning.', 'in_progress', 'high', 'hardware', 'portal', '{pos,store12}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Black Friday network capacity review', 'Review store network capacity ahead of the Black Friday sales weekend.', 'new', 'normal', 'network', 'portal', '{network,capacity}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Advisor workstation encryption review', 'Verify BitLocker coverage on all advisor laptops.', 'in_progress', 'normal', 'security', 'portal', '{bitlocker,security}', jsonb_build_object('seeded', true)),
  ('52700000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Quarterly compliance data export', 'Need the Q3 access review export for the compliance binder.', 'closed', 'low', 'compliance', 'portal', '{compliance,export}', jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.ticket_comments (id, ticket_id, organization_id, author_id, body, is_internal, created_at) values
  ('52710000-0000-0000-0000-000000000001'::uuid, '52700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Scanners reset and re-synced; monitoring through the afternoon window.', true, now() - interval '2 hours'),
  ('52710000-0000-0000-0000-000000000002'::uuid, '52700000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Replaced the expiring intermediate cert; patient portal re-check scheduled.', true, now() - interval '3 hours'),
  ('52710000-0000-0000-0000-000000000003'::uuid, '52700000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Printer firmware updated at Store 12; will verify at next open.', true, now() - interval '1 hour'),
  ('52710000-0000-0000-0000-000000000004'::uuid, '52700000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000002'::uuid, 'Please include the serial numbers in the export for the audit trail.', false, now() - interval '30 minutes')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 2. DOCUMENTS (2 per org) + VERSIONS
-- ---------------------------------------------------------
insert into public.documents (id, organization_id, uploaded_by, name, folder_path, storage_bucket, storage_path, mime_type, visibility, current_version, metadata) values
  ('54700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'Production-Floor-Network-Map-v2.pdf', 'network', 'documents', '11111111-1111-1111-1111-111111111111/network/production-floor-map-v2.pdf', 'application/pdf', 'org', 2, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'Q3-Backup-Verification-Report.pdf', 'backup', 'documents', '11111111-1111-1111-1111-111111111111/backup/q3-backup-verification.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'Case-Management-User-Guide-v3.pdf', 'training', 'documents', '22222222-2222-2222-2222-222222222222/training/case-management-user-guide-v3.pdf', 'application/pdf', 'org', 3, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'Vendor-Access-Policy.pdf', 'security', 'documents', '22222222-2222-2222-2222-222222222222/security/vendor-access-policy.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'HIPAA-Incident-Response-Plan-v4.pdf', 'security', 'documents', '33333333-3333-4333-8333-333333333333/security/hipaa-incident-response-v4.pdf', 'application/pdf', 'org', 4, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'Radiology-PACS-Vendor-Contract.pdf', 'contracts', 'documents', '33333333-3333-4333-8333-333333333333/contracts/pacs-vendor-contract.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, 'Store-Systems-Inventory-Q3.xlsx', 'inventory', 'documents', '44444444-4444-4444-8444-444444444444/inventory/store-systems-q3.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'org', 2, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'POS-Security-Baseline.pdf', 'security', 'documents', '44444444-4444-4444-8444-444444444444/security/pos-security-baseline.pdf', 'application/pdf', 'org', 1, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000003'::uuid, 'Cybersecurity-Policy-Manual-v5.pdf', 'security', 'documents', '55555555-5555-4555-8555-555555555555/security/cybersecurity-policy-manual-v5.pdf', 'application/pdf', 'org', 5, jsonb_build_object('seeded', true)),
  ('54700000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'Client-Portal-FAQ-v2.pdf', 'training', 'documents', '55555555-5555-4555-8555-555555555555/training/client-portal-faq-v2.pdf', 'application/pdf', 'org', 2, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.document_versions (id, document_id, version_number, storage_path, uploaded_by, checksum, created_at) values
  ('54710000-0000-0000-0000-000000000001'::uuid, '54700000-0000-0000-0000-000000000001'::uuid, 2, '11111111-1111-1111-1111-111111111111/network/production-floor-map-v2.pdf', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'sha256:seed-v2', now() - interval '10 days'),
  ('54710000-0000-0000-0000-000000000002'::uuid, '54700000-0000-0000-0000-000000000005'::uuid, 4, '33333333-3333-4333-8333-333333333333/security/hipaa-incident-response-v4.pdf', 'a1000000-0000-4000-8000-000000000003'::uuid, 'sha256:seed-v4', now() - interval '3 days'),
  ('54710000-0000-0000-0000-000000000003'::uuid, '54700000-0000-0000-0000-000000000009'::uuid, 5, '55555555-5555-4555-8555-555555555555/security/cybersecurity-policy-manual-v5.pdf', 'c3000000-0000-4000-8000-000000000003'::uuid, 'sha256:seed-v5', now() - interval '20 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 3. PROJECTS (1 new per org, with tasks/comments/tracker rows)
-- ---------------------------------------------------------
insert into public.projects (id, organization_id, created_by, owner_id, name, description, status, priority, starts_at, due_at, progress_percent, metadata) values
  ('53800000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'ERP Migration Planning', 'Assess and plan the migration of the ERP to a managed cloud host.', 'active', 'high', now() - interval '20 days', now() + interval '60 days', 40, jsonb_build_object('seeded', true)),
  ('53800000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Archive Digitization Pilot', 'Digitize the first 10,000 archived case files.', 'active', 'medium', now() - interval '30 days', now() + interval '30 days', 60, jsonb_build_object('seeded', true)),
  ('53800000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Network Segmentation Rollout', 'Segment clinical and administrative network zones.', 'active', 'high', now() - interval '15 days', now() + interval '45 days', 55, jsonb_build_object('seeded', true)),
  ('53800000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Store Wi-Fi Refresh', 'Replace aging Wi-Fi at the 10 busiest stores.', 'active', 'medium', now() - interval '10 days', now() + interval '90 days', 25, jsonb_build_object('seeded', true)),
  ('53800000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Advisor Laptop Refresh', 'Replace advisor laptops on the 3-year refresh cycle.', 'active', 'medium', now() - interval '5 days', now() + interval '40 days', 15, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.project_tasks (id, project_id, organization_id, created_by, owner_id, title, description, details, status, due_at, sort_order, estimate_hours, actual_hours, approval_required, priority, labels, metadata) values
  ('53900000-0000-0000-0000-000000000001'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Inventory ERP integrations', 'Document all current ERP integrations and data flows.', 'Interview department leads and map integrations.', 'in_progress', now() + interval '10 days', 10, 16.00, 8.00, false, 'high', '{erp,integration}', jsonb_build_object('seeded', true)),
  ('53900000-0000-0000-0000-000000000002'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Pick managed host', 'Evaluate and select the managed cloud host.', 'Shortlist three vendors and run a bake-off.', 'todo', now() + interval '20 days', 20, 8.00, 0.00, true, 'high', '{erp,procurement}', jsonb_build_object('seeded', true)),
  ('53900000-0000-0000-0000-000000000003'::uuid, '53800000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Scan index sample batch', 'Scan and index the pilot batch of case files.', 'Use the new document scanner in the archive room.', 'in_progress', now() + interval '7 days', 10, 24.00, 12.00, false, 'medium', '{archive,dms}', jsonb_build_object('seeded', true)),
  ('53900000-0000-0000-0000-000000000004'::uuid, '53800000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'VLAN design for clinical zone', 'Design the clinical zone VLANs and firewall rules.', 'Coordinate with Radiology for the imaging traffic profile.', 'in_progress', now() + interval '14 days', 10, 20.00, 10.00, true, 'high', '{network,segmentation}', jsonb_build_object('seeded', true)),
  ('53900000-0000-0000-0000-000000000005'::uuid, '53800000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Survey store 12-21 AP coverage', 'Survey the 10 busiest stores for AP replacement.', 'Use the UniFi design tool for heat maps.', 'todo', now() + interval '12 days', 10, 30.00, 0.00, false, 'medium', '{wifi,unifi}', jsonb_build_object('seeded', true)),
  ('53900000-0000-0000-0000-000000000006'::uuid, '53800000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Collect laptop inventory', 'Inventory all advisor laptops and encryption status.', 'Export from Intune and reconcile with asset register.', 'in_progress', now() + interval '5 days', 10, 12.00, 4.00, false, 'medium', '{laptop,refresh}', jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.project_task_comments (id, project_id, task_id, organization_id, author_id, body, is_internal, created_at) values
  ('53910000-0000-0000-0000-000000000001'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, '53900000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'Finance confirmed the payroll integration is the critical path.', false, now() - interval '2 days'),
  ('53910000-0000-0000-0000-000000000002'::uuid, '53800000-0000-0000-0000-000000000003'::uuid, '53900000-0000-0000-0000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Radiology provided the traffic profile; waiting on vendor call.', false, now() - interval '1 day'),
  ('53910000-0000-0000-0000-000000000003'::uuid, '53800000-0000-0000-0000-000000000005'::uuid, '53900000-0000-0000-0000-000000000006'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'Intune export pulled; 41 laptops missing encryption.', false, now() - interval '6 hours')
on conflict (id) do nothing;

insert into public.project_phases (id, project_id, name, description, status, start_date, end_date, sort_order) values
  ('53810000-0000-0000-0000-000000000001'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, 'Discovery', 'Document current state and integrations.', 'in_progress', now() - interval '20 days', now() + interval '10 days', 1),
  ('53810000-0000-0000-0000-000000000002'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, 'Migration', 'Execute the ERP migration.', 'not_started', now() + interval '15 days', now() + interval '45 days', 2),
  ('53810000-0000-0000-0000-000000000003'::uuid, '53800000-0000-0000-0000-000000000003'::uuid, 'Design', 'Network segmentation design.', 'in_progress', now() - interval '15 days', now() + interval '14 days', 1)
on conflict (id) do nothing;

insert into public.project_milestones (id, project_id, phase_id, title, description, due_date, completed_at, status, created_by) values
  ('53820000-0000-0000-0000-000000000001'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, '53810000-0000-0000-0000-000000000001'::uuid, 'Integration map signed off', 'All ERP integrations documented and approved.', now() + interval '8 days', null, 'in_progress', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('53820000-0000-0000-0000-000000000002'::uuid, '53800000-0000-0000-0000-000000000003'::uuid, '53810000-0000-0000-0000-000000000003'::uuid, 'VLAN design approved', 'Clinical zone VLAN design approved by security.', now() + interval '12 days', null, 'in_progress', 'a1000000-0000-4000-8000-000000000004'::uuid),
  ('53820000-0000-0000-0000-000000000003'::uuid, '53800000-0000-0000-0000-000000000002'::uuid, null, 'Pilot batch scanned', 'First 10,000 files scanned and indexed.', now() + interval '6 days', null, 'in_progress', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.project_dependencies (id, project_id, depends_on_task_id, depends_on_milestone_id, blocked_by_project_id, dependency_type) values
  ('53830000-0000-0000-0000-000000000001'::uuid, '53800000-0000-0000-0000-000000000001'::uuid, '53900000-0000-0000-0000-000000000001'::uuid, null, null, 'blocks'),
  ('53830000-0000-0000-0000-000000000002'::uuid, '53800000-0000-0000-0000-000000000003'::uuid, null, '53820000-0000-0000-0000-000000000002'::uuid, null, 'finish_to_start'),
  ('53830000-0000-0000-0000-000000000003'::uuid, '53800000-0000-0000-0000-000000000002'::uuid, '53900000-0000-0000-0000-000000000003'::uuid, null, null, 'blocks')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 4. ASSETS (2 per org, incl. Northwind which had none)
-- ---------------------------------------------------------
insert into public.assets (id, organization_id, name, asset_type, make, model, serial_number, asset_tag, status, location, purchase_date, warranty_expires, lifecycle_score, owner_user_id, assigned_to, maintenance_notes, created_by) values
  ('56700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Production Server Rack P1', 'server', 'Dell', 'PowerEdge R750', 'SN-DELL-75001', 'AT-SRV-0001', 'active', 'Server Room A', '2025-03-15', '2028-03-15', 88, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Production ERP host.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('56700000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Network Switch Core-1', 'network', 'Cisco', 'Catalyst 9300', 'SN-C9300-8821', 'AT-NET-0001', 'active', 'Server Room A', '2024-11-01', '2029-11-01', 92, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Core switch - production.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('56700000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Document Scanner Archive-1', 'peripheral', 'Fujitsu', 'fi-7160', 'SN-FUJI-60111', 'AT-SCN-0001', 'active', 'Archive Room', '2025-01-10', '2027-01-10', 76, 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Archive digitization scanner.', 'f1000000-0000-4000-8000-000000000005'::uuid),
  ('56700000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Firewall FW-Edge', 'network', 'Fortinet', 'FortiGate 200F', 'SN-FG200-7712', 'AT-FW-0001', 'active', 'Server Room B', '2024-06-01', '2029-06-01', 85, 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'Edge firewall.', 'f1000000-0000-4000-8000-000000000005'::uuid),
  ('56700000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Database Server', 'server', 'HPE', 'ProLiant DL380', 'SN-HPE-33019', 'AT-EHR-0001', 'active', 'Data Center', '2023-09-01', '2026-09-01', 70, 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'EHR host - warranty expiring soon.', 'a1000000-0000-4000-8000-000000000004'::uuid),
  ('56700000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'PACS Storage Array', 'storage', 'NetApp', 'AFF A250', 'SN-NETAPP-5511', 'AT-PACS-0001', 'active', 'Data Center', '2024-02-01', '2027-02-01', 82, 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'PACS image storage.', 'a1000000-0000-4000-8000-000000000004'::uuid),
  ('56700000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 POS Terminal Reg-1', 'pos', 'NCR', 'NCR 7454', 'SN-NCR-42011', 'AT-POS-4201', 'active', 'Store 42', '2025-05-20', '2028-05-20', 80, 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Register 1 at Store 42.', 'b2000000-0000-4000-8000-000000000002'::uuid),
  ('56700000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 UPS', 'power', 'APC', 'SMX1500', 'SN-APC-42031', 'AT-UPS-4201', 'active', 'Store 42', '2024-08-01', '2027-08-01', 74, 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Backup power for POS.', 'b2000000-0000-4000-8000-000000000002'::uuid),
  ('56700000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptop Pool', 'laptop', 'Lenovo', 'ThinkPad X1', 'SN-LEN-55001', 'AT-LAP-5501', 'active', 'IT Store', '2025-02-01', '2028-02-01', 86, 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Refresh pool for advisors.', 'c3000000-0000-4000-8000-000000000004'::uuid),
  ('56700000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero Trust Gateway', 'network', 'Zscaler', 'ZIA Gateway', 'SN-ZSC-55012', 'AT-ZTG-0001', 'active', 'Cloud', '2024-12-01', '2027-12-01', 90, 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Zero trust internet gateway.', 'c3000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 5. FINDINGS (2 per org)
-- ---------------------------------------------------------
insert into public.findings (id, organization_id, title, description, severity, status, source, visibility, finding_category, remediation_plan, remediation_deadline, affected_systems, owner_user_id, created_by, metadata) values
  ('55700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Legacy FTP service exposed', 'The legacy FTP service is reachable from the internet.', 'high', 'open', 'network_scan', 'org', 'security_review', 'Replace with SFTP and firewall the port.', now() + interval '21 days', '{ftp-server}', 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Outdated warehouse OS builds', 'Two warehouse PCs run unpatched Windows builds.', 'medium', 'in_review', 'patch_scan', 'org', 'patch_review', 'Image the machines with the current build.', now() + interval '14 days', '{warehouse-pcs}', 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Shared archive room account', 'Archive room PCs share a common admin account.', 'medium', 'open', 'internal_audit', 'org', 'security_review', 'Create per-user accounts and rotate the shared password.', now() + interval '18 days', '{archive-pcs}', 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Case file backup gap', 'Case management backups skip the archive share.', 'high', 'open', 'backup_audit', 'org', 'backup_review', 'Add the archive share to the backup job.', now() + interval '10 days', '{archive-share}', 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Imaging workstation on clinical VLAN', 'An imaging PC is on the clinical VLAN without MFA.', 'critical', 'open', 'network_scan', 'org', 'security_review', 'Move to segmented VLAN and enforce MFA.', now() + interval '7 days', '{imaging-pc}', 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'PACS interface TLS 1.0 enabled', 'The PACS interface still allows TLS 1.0.', 'high', 'open', 'external_scan', 'org', 'vulnerability_scan', 'Disable TLS 1.0/1.1 on the interface.', now() + interval '21 days', '{pacs-interface}', 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS terminals missing screen lock', 'Store 42 POS terminals have no screen lock timeout.', 'medium', 'open', 'store_audit', 'org', 'security_review', 'Enable 5-minute screen lock via policy.', now() + interval '14 days', '{store42-pos}', 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Guest Wi-Fi on corporate SSID', 'Store guest Wi-Fi shares the corporate SSID.', 'high', 'open', 'store_audit', 'org', 'security_review', 'Split guest and corporate SSIDs.', now() + interval '10 days', '{store-wifi}', 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor email forwarding policy gap', 'Several advisors forward mail to personal accounts.', 'medium', 'in_review', 'm365_audit', 'org', 'security_review', 'Review and restrict external forwarding.', now() + interval '21 days', '{m365-mail}', 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true)),
  ('55700000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Legacy advisor laptops on Win10', '12 advisor laptops remain on unsupported Windows 10.', 'high', 'open', 'm365_audit', 'org', 'patch_review', 'Prioritize the refresh project.', now() + interval '30 days', '{advisor-laptops}', 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- 08_expanded_test_data.sql  (PART 2: approvals/sla/risks/proposals/qbr/catalog/vendors/time)

-- ---------------------------------------------------------
-- 6. APPROVAL REQUESTS (1 per org)
-- ---------------------------------------------------------
insert into public.approval_requests (id, organization_id, request_type, request_subject, request_body, request_metadata, status, priority, requested_by, assigned_to, approved_by, source_module, source_entity_type, source_entity_id) values
  ('57700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'access', 'VPN access for new warehouse manager', 'New hire needs VPN + WMS access.', jsonb_build_object('seeded', true), 'pending', 'high', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, null, 'tickets', 'ticket', '52700000-0000-0000-0000-000000000002'),
  ('57700000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'access', 'DMS access for new paralegal', 'New paralegal needs document management access.', jsonb_build_object('seeded', true), 'approved', 'medium', '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid, 'tickets', 'ticket', '52700000-0000-0000-0000-000000000003'),
  ('57700000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'change', 'Change window for firewall rule update', 'Requested change window for segmentation firewall rules.', jsonb_build_object('seeded', true), 'pending', 'high', 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, null, 'projects', 'project', '53800000-0000-0000-0000-000000000003'),
  ('57700000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'access', 'Corporate Wi-Fi for vendor technician', 'Vendor technician needs temporary corporate Wi-Fi access.', jsonb_build_object('seeded', true), 'rejected', 'low', 'b2000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000001'::uuid, 'tickets', 'ticket', '52700000-0000-0000-0000-000000000008'),
  ('57700000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'hardware', 'Emergency laptop for new advisor', 'New advisor needs a laptop before onboarding.', jsonb_build_object('seeded', true), 'approved', 'high', 'c3000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid, 'c3000000-0000-4000-8000-000000000001'::uuid, 'projects', 'project', '53800000-0000-0000-0000-000000000005')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 7. SLA LOGS (1 per org, incl. a breached case)
-- ---------------------------------------------------------
insert into public.sla_logs (id, organization_id, ticket_id, metric, target_minutes, actual_minutes, breached, breached_at, resolved_at, created_at) values
  ('63700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '52700000-0000-0000-0000-000000000001'::uuid, 'first_response', 60, 45, false, null, null, now() - interval '5 hours'),
  ('63700000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '52700000-0000-0000-0000-000000000003'::uuid, 'first_response', 240, 300, true, now() - interval '4 hours', null, now() - interval '8 hours'),
  ('63700000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '52700000-0000-0000-0000-000000000005'::uuid, 'first_response', 30, 12, false, null, null, now() - interval '2 hours'),
  ('63700000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, '52700000-0000-0000-0000-000000000007'::uuid, 'first_response', 60, 55, false, null, null, now() - interval '6 hours'),
  ('63700000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, '52700000-0000-0000-0000-000000000009'::uuid, 'resolution', 720, 660, false, null, now() - interval '20 hours', now() - interval '1 day')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 8. RISK REGISTER (2 per org, incl. Acme + Northwind)
-- ---------------------------------------------------------
insert into public.risk_register (id, organization_id, risk_description, risk_category, likelihood, impact, risk_score, mitigating_controls, status, owner_user_id, accepted_by, created_by) values
  ('65700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Single point of failure on warehouse network core', 'availability', 'high', 'high', 20, 'Spare switch staged and tested monthly.', 'open', 'f1000000-0000-4000-8000-000000000004'::uuid, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('65700000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'ERP vendor contract renewal risk', 'vendor_dependency', 'medium', 'medium', 9, 'Renegotiation started 6 months early.', 'monitored', 'f1000000-0000-4000-8000-000000000004'::uuid, null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('65700000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Case data exposure through shared archive accounts', 'security', 'medium', 'high', 15, 'Shared account removal scheduled.', 'open', 'f1000000-0000-4000-8000-000000000005'::uuid, null, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('65700000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Single-site backup location', 'availability', 'high', 'medium', 12, 'Offsite replication evaluation underway.', 'open', 'f1000000-0000-4000-8000-000000000005'::uuid, null, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('65700000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Ransomware risk on clinical imaging', 'security', 'high', 'high', 20, 'Segmentation + EDR rollout in progress.', 'mitigated', 'a1000000-0000-4000-8000-000000000004'::uuid, null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('65700000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'PACS vendor EOL contract expiry', 'vendor_dependency', 'high', 'medium', 15, 'Migration plan drafted.', 'open', 'a1000000-0000-4000-8000-000000000004'::uuid, null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('65700000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS malware reintroduction risk', 'security', 'medium', 'high', 15, 'Allow-listing maintained and audited.', 'monitored', 'b2000000-0000-4000-8000-000000000002'::uuid, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('65700000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Wi-Fi refresh slippage', 'project', 'medium', 'medium', 9, 'Weekly vendor check-ins.', 'open', 'b2000000-0000-4000-8000-000000000002'::uuid, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('65700000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor device loss and data exposure', 'security', 'high', 'medium', 15, 'BitLocker enforcement + MDM tracking.', 'monitored', 'c3000000-0000-4000-8000-000000000004'::uuid, null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('65700000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Regulatory scrutiny on client data retention', 'regulatory', 'medium', 'high', 15, 'Retention policy review scheduled.', 'open', 'c3000000-0000-4000-8000-000000000004'::uuid, null, 'd4000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

-- Populate risk assessment columns (migration 5302125) for a subset of risks
update public.risk_register set
  risk_level = case when risk_score >= 15 then 'critical' when risk_score >= 10 then 'high' when risk_score >= 5 then 'medium' else 'low' end,
  assessed_at = now() - interval '30 days',
  accepting_controls = 'Reviewed by leadership at last QBR; compensating controls documented.'
where id in ('65700000-0000-0000-0000-000000000001','65700000-0000-0000-0000-000000000003','65700000-0000-0000-0000-000000000005');

-- Overdue approval (exercises approval-overdue-check worker + admin approval-requests page)
insert into public.approval_requests (id, organization_id, request_type, request_subject, request_body, request_metadata, status, priority, requested_by, assigned_to, due_at, source_module, source_entity_type, source_entity_id) values
  ('57700000-0000-0000-0000-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'change', 'Firewall maintenance window (overdue)', 'Scheduled firewall maintenance window missed approval deadline.', jsonb_build_object('seeded', true), 'pending', 'high', 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '2 days', 'governance', 'change_request', '64600000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Stale DMARC analysis (exercises dmarc-coach-check worker marking stale)
insert into public.dmarc_analyses (id, organization_id, domain, dmarc_record, spf_record, dkim_record, dmarc_policy, alignment_mode, pct, overall_grade, issues, recommendations, analyzed_at, status, created_by) values
  ('82710000-0000-0000-0000-000000000099'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', 'v=DMARC1; p=none;', 'v=spf1 ~all', 'v=DKIM1; k=rsa; p=...', 'none', 'relaxed', 100, 'F', jsonb_build_array('No enforcement policy'), jsonb_build_array(jsonb_build_object('action', 'move_to_quarantine')), now() - interval '45 days', 'active', 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 9. PROPOSALS (1 per org incl. Northwind) + PHASES + LINE ITEMS
-- ---------------------------------------------------------
insert into public.proposals (id, organization_id, title, description, status, visibility, total_labor, total_materials, total_recurring, total_one_time, grand_total, valid_until, sent_at, approved_at, owner_user_id, created_by, metadata) values
  ('81120000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'ERP Cloud Hosting Proposal', 'Proposal for managed cloud hosting of the ERP.', 'draft', 'internal', 18000.00, 6000.00, 1500.00, 24000.00, 24000.00, now() + interval '45 days', null, null, 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('81120000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Digitization Proposal', 'Proposal for the full archive digitization program.', 'sent', 'client', 30000.00, 5000.00, 0, 35000.00, 35000.00, now() + interval '30 days', now() - interval '3 days', null, 'f1000000-0000-4000-8000-000000000005'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, jsonb_build_object('seeded', true)),
  ('81120000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Network Segmentation Proposal', 'Segmentation of clinical and administrative zones.', 'approved', 'client', 24000.00, 8500.00, 0, 32500.00, 32500.00, now() + interval '30 days', now() - interval '10 days', now() - interval '2 days', 'a1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('81120000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Wi-Fi Refresh Proposal', 'AP replacement for the busiest 10 stores.', 'draft', 'internal', 21000.00, 14500.00, 0, 35500.00, 35500.00, now() + interval '60 days', null, null, 'b2000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('81120000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptop Refresh Proposal', '3-year refresh for advisor laptops.', 'sent', 'client', 12600.00, 42000.00, 0, 54600.00, 54600.00, now() + interval '30 days', now() - interval '2 days', null, 'c3000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.proposal_phases (id, proposal_id, sort_order, title, description) values
  ('81130000-0000-0000-0000-000000000001'::uuid, '81120000-0000-0000-0000-000000000002'::uuid, 1, 'Pilot', 'Scan and index the pilot batch.'),
  ('81130000-0000-0000-0000-000000000002'::uuid, '81120000-0000-0000-0000-000000000002'::uuid, 2, 'Full Rollout', 'Scan remaining case files.'),
  ('81130000-0000-0000-0000-000000000003'::uuid, '81120000-0000-0000-0000-000000000005'::uuid, 1, 'Procurement', 'Order laptops.'),
  ('81130000-0000-0000-0000-000000000004'::uuid, '81120000-0000-0000-0000-000000000005'::uuid, 2, 'Deployment', 'Image and deploy to advisors.')
on conflict (id) do nothing;

insert into public.proposal_line_items (id, proposal_id, phase_id, sort_order, item_type, name, description, quantity, unit_price, total_price, is_optional, is_recurring, recurring_interval) values
  ('81140000-0000-0000-0000-000000000001'::uuid, '81120000-0000-0000-0000-000000000002'::uuid, '81130000-0000-0000-0000-000000000001'::uuid, 1, 'service', 'Pilot scanning', '10,000 files scanned and indexed.', 1, 12000.00, 12000.00, false, false, null),
  ('81140000-0000-0000-0000-000000000002'::uuid, '81120000-0000-0000-0000-000000000002'::uuid, '81130000-0000-0000-0000-000000000002'::uuid, 1, 'service', 'Full rollout scanning', 'Remaining 40,000 files.', 1, 23000.00, 23000.00, false, false, null),
  ('81140000-0000-0000-0000-000000000003'::uuid, '81120000-0000-0000-0000-000000000005'::uuid, '81130000-0000-0000-0000-000000000003'::uuid, 1, 'hardware', 'ThinkPad X1 laptops', 'Advisor refresh laptops.', 42, 1000.00, 42000.00, false, false, null),
  ('81140000-0000-0000-0000-000000000004'::uuid, '81120000-0000-0000-0000-000000000005'::uuid, '81130000-0000-0000-0000-000000000004'::uuid, 1, 'service', 'Imaging and deployment', 'Image, secure, and deploy.', 42, 300.00, 12600.00, false, false, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 10. QBR REPORTS (1 per org incl. Acme + Northwind)
-- ---------------------------------------------------------
insert into public.qbr_reports (id, organization_id, title, period_start, period_end, status, visibility, summary, report_data, generated_by, created_by) values
  ('57800000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Q2 Business Review', '2026-04-01', '2026-06-30', 'published', 'client', 'Solid quarter with the warehouse network stabilized.', jsonb_build_object('kpis', jsonb_build_object('tickets_resolved', 42, 'uptime', 99.2), 'highlights', jsonb_build_array('Warehouse network stabilized', 'ERP planning kicked off'), 'action_items', jsonb_build_array('Approve ERP migration plan')), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('57800000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Q2 Business Review', '2026-04-01', '2026-06-30', 'published', 'client', 'Archive digitization pilot delivered ahead of schedule.', jsonb_build_object('kpis', jsonb_build_object('tickets_resolved', 28, 'uptime', 99.8), 'highlights', jsonb_build_array('Pilot completed early'), 'action_items', jsonb_build_array('Approve full rollout')), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('57800000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Q2 Business Review', '2026-04-01', '2026-06-30', 'published', 'client', 'HIPAA readiness improvements and segmentation progress.', jsonb_build_object('kpis', jsonb_build_object('tickets_resolved', 66, 'uptime', 99.5), 'highlights', jsonb_build_array('Cert warning resolved'), 'action_items', jsonb_build_array('Schedule segmentation cutover')), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('57800000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Q2 Business Review', '2026-04-01', '2026-06-30', 'draft', 'internal', 'POS stability improved after firmware updates.', jsonb_build_object('kpis', jsonb_build_object('tickets_resolved', 55, 'uptime', 98.9), 'highlights', jsonb_build_array('POS firmware refresh'), 'action_items', jsonb_build_array('Black Friday capacity plan')), 'd4000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('57800000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Q2 Business Review', '2026-04-01', '2026-06-30', 'published', 'client', 'Security posture improved with zero-trust rollout progress.', jsonb_build_object('kpis', jsonb_build_object('tickets_resolved', 38, 'uptime', 99.6), 'highlights', jsonb_build_array('ZT rollout on track'), 'action_items', jsonb_build_array('Laptop refresh approval')), 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 11. SERVICE CATALOG (1 per org incl. Acme + Northwind)
-- ---------------------------------------------------------
insert into public.service_catalog (id, organization_id, name, description, category, billing_model, unit, base_price, is_active, status, visibility, created_by, metadata) values
  ('60700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'On-site support (warehouse shift)', 'On-site support for the production and warehouse shifts.', 'support', 'per_visit', 'visit', 250.00, true, 'active', 'client', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('delivery_timeline', '2 business days', 'service_level', '4-hour response')),
  ('60700000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive digitization service', 'Managed scanning and indexing of case files.', 'project', 'per_project', 'batch', 1200.00, true, 'active', 'client', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('delivery_timeline', 'per batch', 'service_level', 'SLA: 10k files/week')),
  ('60700000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA compliance review', 'Annual HIPAA readiness assessment.', 'compliance', 'per_project', 'engagement', 4500.00, true, 'active', 'client', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('delivery_timeline', '3 weeks', 'service_level', 'Senior consultant')),
  ('60700000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Wi-Fi site survey', 'UniFi site survey and design for stores.', 'project', 'per_unit', 'store', 850.00, true, 'active', 'client', 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('delivery_timeline', '1 week', 'service_level', 'Per store')),
  ('60700000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero trust onboarding', 'Advisor onboarding to the zero trust gateway.', 'security', 'per_user', 'advisor', 120.00, true, 'active', 'client', 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('delivery_timeline', '2 business days', 'service_level', 'Per advisor'))
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 12. VENDORS (contracts + contacts) 1 per org
-- ---------------------------------------------------------
insert into public.vendor_contracts (id, organization_id, vendor_name, service_name, contract_number, start_date, end_date, renewal_date, contract_value, billing_frequency, auto_renews, renewal_notice_days, status, contract_type, notes, visibility, created_by) values
  ('59700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'WMS Software Inc', 'Warehouse management system license', 'CON-ACME-001', '2025-01-01', '2026-12-31', '2026-12-31', 38400.00, 'annual', true, 60, 'active', 'software', 'Warehouse management system license.', 'org', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59700000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'ArchiveVault', 'Offsite archive storage', 'CON-NW-001', '2025-06-01', '2028-05-31', '2028-05-31', 10800.00, 'annual', false, 90, 'active', 'storage', 'Offsite archive storage.', 'org', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59700000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'MedSoft Imaging', 'PACS imaging software', 'CON-HV-001', '2025-04-01', '2026-03-31', '2026-03-31', 50400.00, 'annual', true, 45, 'active', 'software', 'PACS imaging software.', 'org', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59700000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POSReady Systems', 'POS hardware maintenance', 'CON-BL-001', '2025-02-01', '2027-01-31', '2027-01-31', 21600.00, 'annual', true, 60, 'active', 'hardware', 'POS hardware maintenance.', 'org', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('59700000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'SecureVault', 'Zero trust gateway subscription', 'CON-SM-001', '2025-08-01', '2026-07-31', '2026-07-31', 28800.00, 'annual', true, 60, 'active', 'security', 'Zero trust gateway subscription.', 'org', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.vendor_contacts (id, organization_id, vendor_name, contact_name, role_title, email, phone, is_primary, status, created_by) values
  ('59710000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'WMS Software Inc', 'Sandra Webb', 'Account Manager', 'swebb@wmssoft.example', '800-555-0111', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59710000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'ArchiveVault', 'Tom Adler', 'Support Lead', 'tadler@archivevault.example', '800-555-0112', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59710000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'MedSoft Imaging', 'Rachel Kim', 'Account Manager', 'rkim@medsoft.example', '800-555-0141', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('59710000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POSReady Systems', 'Ingrid Larson', 'Technical Account Manager', 'ilarson@posready.example', '800-555-0143', true, 'active', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('59710000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'SecureVault', 'Markus Weber', 'Enterprise Sales', 'mweber@securevault.example', '800-555-0144', true, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 13. TIME ENTRIES (2 per org, plus non-ticket project hours)
-- ---------------------------------------------------------
insert into public.time_entries (id, organization_id, description, hours, billable, work_date, ticket_id, user_id) values
  ('58100000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse scanner troubleshooting', 2.5, true, CURRENT_DATE - 1, '52700000-0000-0000-0000-000000000001', 'd4000000-0000-4000-8000-000000000001'),
  ('58100000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VPN tunnel planning', 3.0, true, CURRENT_DATE - 2, '52700000-0000-0000-0000-000000000002', 'd4000000-0000-4000-8000-000000000003'),
  ('58100000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'DMS training prep', 1.5, true, CURRENT_DATE - 1, '52700000-0000-0000-0000-000000000003', 'd4000000-0000-4000-8000-000000000002'),
  ('58100000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'AV equipment swap', 2.0, true, CURRENT_DATE - 3, '52700000-0000-0000-0000-000000000004', 'd4000000-0000-4000-8000-000000000002'),
  ('58100000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Certificate replacement', 1.0, true, CURRENT_DATE - 1, '52700000-0000-0000-0000-000000000005', 'd4000000-0000-4000-8000-000000000003'),
  ('58100000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Nurse station survey', 2.0, true, CURRENT_DATE - 2, '52700000-0000-0000-0000-000000000006', 'd4000000-0000-4000-8000-000000000001'),
  ('58100000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 12 printer repair', 1.5, true, CURRENT_DATE - 1, '52700000-0000-0000-0000-000000000007', 'd4000000-0000-4000-8000-000000000002'),
  ('58100000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Capacity review prep', 2.5, true, CURRENT_DATE - 2, '52700000-0000-0000-0000-000000000008', 'd4000000-0000-4000-8000-000000000001'),
  ('58100000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'BitLocker verification', 3.0, true, CURRENT_DATE - 1, '52700000-0000-0000-0000-000000000009', 'd4000000-0000-4000-8000-000000000003'),
  ('58100000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Compliance export', 1.0, true, CURRENT_DATE - 4, '52700000-0000-0000-0000-000000000010', 'd4000000-0000-4000-8000-000000000001'),
  ('58110000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Segmentation design session', 4.0, true, CURRENT_DATE - 1, null, 'd4000000-0000-4000-8000-000000000002'),
  ('58110000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store survey travel', 3.0, true, CURRENT_DATE - 2, null, 'd4000000-0000-4000-8000-000000000001'),
  ('58110000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero trust config', 5.0, true, CURRENT_DATE - 1, null, 'd4000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

-- 08_expanded_test_data.sql  (PART 3: backups/status/uptime/satisfaction/webhooks/notifications/audit)

-- ---------------------------------------------------------
-- 14. BACKUP STATUS (1 per org incl. Northwind, incl. a failed case)
-- ---------------------------------------------------------
insert into public.backup_status (id, organization_id, system_name, backup_type, last_backup_at, last_backup_status, last_backup_size_gb, next_scheduled_at, recovery_point_objective_hours, recovery_time_objective_hours, retention_days, restore_tested_at, restore_test_result, offsite_replicated, encryption_enabled, notes, status, created_by) values
  ('82210000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'ERP Database', 'full', now() - interval '3 hours', 'success', 96.50, now() + interval '21 hours', 4, 2, 30, now() - interval '14 days', 'success', true, true, 'ERP backups healthy.', 'monitored', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82210000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Case Management DB', 'full', now() - interval '2 days', 'failed', null, now() + interval '22 hours', 8, 4, 30, null, null, true, true, 'Backup failed - investigate.', 'attention', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82210000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Replica', 'incremental', now() - interval '1 hour', 'success', 18.20, now() + interval '23 hours', 2, 1, 30, now() - interval '7 days', 'success', true, true, 'EHR replica healthy.', 'monitored', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82210000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Config Servers', 'full', now() - interval '5 hours', 'success', 32.00, now() + interval '19 hours', 6, 3, 14, now() - interval '21 days', 'success', true, true, 'POS config healthy.', 'monitored', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82210000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Mailboxes', 'full', now() - interval '4 hours', 'success', 74.00, now() + interval '20 hours', 6, 3, 30, now() - interval '30 days', 'success', true, true, 'M365 backup healthy.', 'monitored', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 15. STATUS PAGE (components + incidents + maintenance) per org
-- ---------------------------------------------------------
insert into public.status_components (id, organization_id, name, description, component_type, status, display_order) values
  ('82930000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VPN Gateway', 'Remote access gateway.', 'network', 'operational', 1),
  ('82930000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Wi-Fi', 'Warehouse floor wireless.', 'network', 'operational', 2),
  ('82930000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Case Management Portal', 'Client-facing case portal.', 'application', 'operational', 1),
  ('82930000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Storage', 'Offsite archive storage.', 'storage', 'operational', 2),
  ('82930000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR System', 'Electronic health records.', 'application', 'operational', 1),
  ('82930000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Patient Portal', 'Patient-facing portal.', 'application', 'degraded', 2),
  ('82930000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Gateway', 'Payment processing gateway.', 'application', 'operational', 1),
  ('82930000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Network', 'Store WAN connectivity.', 'network', 'operational', 2),
  ('82930000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor VPN', 'Advisor remote access.', 'network', 'operational', 1),
  ('82930000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero Trust Gateway', 'Zero trust internet gateway.', 'network', 'operational', 2)
on conflict (id) do nothing;

insert into public.status_incidents (id, organization_id, title, description, severity, status, affected_component_ids, started_at, resolved_at, created_by) values
  ('82940000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VPN gateway latency', 'Increased latency on the VPN gateway during peak hours.', 'minor', 'resolved', '{82930000-0000-0000-0000-000000000001}'::uuid[], now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82940000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive portal slow', 'Archive portal responses slow for 30 minutes.', 'minor', 'resolved', '{82930000-0000-0000-0000-000000000004}'::uuid[], now() - interval '5 days', now() - interval '5 days' + interval '30 minutes', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82940000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Patient portal certificate warning', 'Patients reported certificate warnings on login.', 'major', 'monitoring', '{82930000-0000-0000-0000-000000000006}'::uuid[], now() - interval '6 hours', null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82940000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS gateway degraded', 'Payment processing delays across stores.', 'major', 'monitoring', '{82930000-0000-0000-0000-000000000007}'::uuid[], now() - interval '6 hours', null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82940000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor VPN maintenance', 'Planned maintenance on the advisor VPN.', 'maintenance', 'scheduled', '{82930000-0000-0000-0000-000000000009}'::uuid[], now() + interval '2 days', null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.maintenance_notices (id, organization_id, title, description, scheduled_start, scheduled_end, status, affected_component_ids, created_by) values
  ('82950000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Wi-Fi maintenance', 'AP firmware update on the warehouse floor.', now() + interval '1 day', now() + interval '1 day' + interval '2 hours', 'scheduled', '{82930000-0000-0000-0000-000000000002}'::uuid[], 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82950000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive storage maintenance', 'Storage controller firmware update.', now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'scheduled', '{82930000-0000-0000-0000-000000000004}'::uuid[], 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82950000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR maintenance window', 'Scheduled EHR database maintenance.', now() + interval '5 days', now() + interval '5 days' + interval '4 hours', 'scheduled', '{82930000-0000-0000-0000-000000000005}'::uuid[], 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82950000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 12 network maintenance', 'Switch replacement at Store 12.', now() + interval '2 days', now() + interval '2 days' + interval '3 hours', 'scheduled', '{82930000-0000-0000-0000-000000000008}'::uuid[], 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 16. UPTIME MONITOR (checks + results per org)
-- ---------------------------------------------------------
insert into public.uptime_checks (id, organization_id, url, check_type, check_interval_minutes, expected_status_code, timeout_seconds, status, created_by) values
  ('83020000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'https://vpn.acme.example', 'http', 5, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('83020000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'https://cases.northwind.example', 'http', 5, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('83020000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'https://portal.harborview.example', 'http', 5, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('83020000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'https://pos.brightline.example', 'http', 5, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('83020000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'https://ztg.summit.example', 'http', 5, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.uptime_results (id, check_id, response_status, response_time_ms, ssl_expiry_date, ssl_days_remaining, is_up, error_message, checked_at) values
  ('83030000-0000-0000-0000-000000000001'::uuid, '83020000-0000-0000-0000-000000000001'::uuid, 200, 320, '2027-02-01', 180, true, null, now() - interval '5 minutes'),
  ('83030000-0000-0000-0000-000000000002'::uuid, '83020000-0000-0000-0000-000000000001'::uuid, 200, 340, '2027-02-01', 180, true, null, now() - interval '10 minutes'),
  ('83030000-0000-0000-0000-000000000003'::uuid, '83020000-0000-0000-0000-000000000002'::uuid, 200, 280, '2026-12-01', 118, true, null, now() - interval '5 minutes'),
  ('83030000-0000-0000-0000-000000000004'::uuid, '83020000-0000-0000-0000-000000000003'::uuid, 502, 4100, '2027-01-10', 158, false, 'HTTP 502 Bad Gateway', now() - interval '8 minutes'),
  ('83030000-0000-0000-0000-000000000005'::uuid, '83020000-0000-0000-0000-000000000004'::uuid, 200, 260, '2026-11-01', 89, true, null, now() - interval '5 minutes'),
  ('83030000-0000-0000-0000-000000000006'::uuid, '83020000-0000-0000-0000-000000000005'::uuid, 200, 190, '2027-03-15', 222, true, null, now() - interval '5 minutes')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 17. SATISFACTION PULSES (2 per org) + TEMPLATE per org
-- ---------------------------------------------------------
insert into public.satisfaction_pulses (id, organization_id, subject, question, rating, feedback, source, source_entity_id, source_entity_type, sent_at, responded_at, status, respondent_user_id, respondent_organization_id) values
  ('82130000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse scanner support', 'How satisfied were you with the scanner fix?', 9, 'Fast and helpful.', 'ticket', '52700000-0000-0000-0000-000000000001', 'ticket', now() - interval '1 day', now() - interval '20 hours', 'responded', '71d23f2a-39b9-42f7-9ddc-115ac45ef12e', '11111111-1111-1111-1111-111111111111'),
  ('82130000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VPN tunnel setup', 'Rate the VPN tunnel planning support.', null, null, 'ticket', '52700000-0000-0000-0000-000000000002', 'ticket', now() - interval '6 hours', null, 'pending', null, null),
  ('82130000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'DMS training', 'Was the DMS training useful?', 8, 'Good session.', 'manual', null, null, now() - interval '2 days', now() - interval '1 day', 'responded', '6adfefa6-27c2-480e-9881-6514f4e9b708', '22222222-2222-2222-2222-222222222222'),
  ('82130000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'AV room fix', 'Rate the AV repair experience.', null, null, 'ticket', '52700000-0000-0000-0000-000000000004', 'ticket', now() - interval '1 day', null, 'pending', null, null),
  ('82130000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Certificate fix', 'How satisfied are you with the certificate resolution?', 10, 'Resolved quickly.', 'ticket', '52700000-0000-0000-0000-000000000005', 'ticket', now() - interval '5 hours', now() - interval '3 hours', 'responded', 'a1000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333'),
  ('82130000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Nurse station PCs', 'Rate the replacement planning.', null, null, 'ticket', '52700000-0000-0000-0000-000000000006', 'ticket', now() - interval '2 hours', null, 'pending', null, null),
  ('82130000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 12 printer', 'Was the printer issue resolved well?', 7, 'Fixed but took a while.', 'ticket', '52700000-0000-0000-0000-000000000007', 'ticket', now() - interval '1 day', now() - interval '12 hours', 'responded', 'b2000000-0000-4000-8000-000000000004', '44444444-4444-4444-8444-444444444444'),
  ('82130000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Black Friday prep', 'Rate the capacity review so far.', null, null, 'manual', null, null, now() - interval '1 day', null, 'pending', null, null),
  ('82130000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'BitLocker review', 'How was the BitLocker review experience?', 9, 'Very organized.', 'ticket', '52700000-0000-0000-0000-000000000009', 'ticket', now() - interval '1 day', now() - interval '10 hours', 'responded', 'c3000000-0000-4000-8000-000000000002', '55555555-5555-4555-8555-555555555555'),
  ('82130000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Compliance export', 'Rate the compliance export support.', null, null, 'ticket', '52700000-0000-0000-0000-000000000010', 'ticket', now() - interval '1 day', null, 'pending', null, null)
on conflict (id) do nothing;

insert into public.satisfaction_pulse_templates (id, organization_id, name, description, type, questions, is_active, created_by) values
  ('82140000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Ops Survey', 'Operations support survey.', 'csat', '[{"text": "Was your issue resolved?", "type": "yes_no"}, {"text": "Add comments.", "type": "text"}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82140000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Services Survey', 'Service quality survey.', 'csat', '[{"text": "How satisfied were you?", "type": "rating", "max": 10}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82140000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Support Pulse', 'Clinical support feedback.', 'csat', '[{"text": "Rate your support experience.", "type": "rating", "max": 10}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82140000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Ops Survey', 'Store operations survey.', 'csat', '[{"text": "Was your store issue resolved?", "type": "yes_no"}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82140000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Experience Pulse', 'Advisor experience survey.', 'nps', '[{"text": "How likely to recommend?", "type": "rating", "max": 10}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 18. WEBHOOK ENDPOINTS + DELIVERIES (Acme + Northwind + Summit)
-- ---------------------------------------------------------
insert into public.webhook_endpoints (id, organization_id, name, url, secret, events, is_active, created_by) values
  ('63200000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Ops Webhook', 'https://ops.acme.example/hooks/mct', 'whsec_acme_ops', '{ticket.created,ticket.updated,incident.created}', true, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid),
  ('63200000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind IT Alerts', 'https://it.northwind.example/hooks/mct', 'whsec_northwind_it', '{ticket.created,backup.failed}', true, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid),
  ('63200000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Compliance Feed', 'https://compliance.summit.example/hooks/mct', 'whsec_summit_comp', '{finding.created,finding.updated}', true, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid)
on conflict (id) do nothing;

insert into public.webhook_deliveries (id, webhook_id, event, status, request_body, response_status, response_body, duration_ms, created_at) values
  ('63300000-0000-0000-0000-000000000001'::uuid, '63200000-0000-0000-0000-000000000001'::uuid, 'ticket.created', 'success', jsonb_build_object('event', 'ticket.created', 'data', jsonb_build_object('id', '52700000-0000-0000-0000-000000000001')), 200, 'ok', 180, now() - interval '1 day'),
  ('63300000-0000-0000-0000-000000000002'::uuid, '63200000-0000-0000-0000-000000000002'::uuid, 'backup.failed', 'failed', jsonb_build_object('event', 'backup.failed'), 500, 'Internal Server Error', 2900, now() - interval '2 days'),
  ('63300000-0000-0000-0000-000000000003'::uuid, '63200000-0000-0000-0000-000000000003'::uuid, 'finding.updated', 'success', jsonb_build_object('event', 'finding.updated'), 200, 'ok', 140, now() - interval '6 hours'),
  ('63300000-0000-0000-0000-000000000004'::uuid, '63200000-0000-0000-0000-000000000002'::uuid, 'ticket.created', 'pending', jsonb_build_object('event', 'ticket.created'), null, null, null, now() - interval '5 minutes')
on conflict (id) do nothing;

update public.webhook_endpoints
set last_success_at = now() - interval '6 hours'
where id = '63200000-0000-0000-0000-000000000003'::uuid;

-- ---------------------------------------------------------
-- 19. NOTIFICATIONS (a few more per org user)
-- ---------------------------------------------------------
insert into public.notifications (user_id, organization_id, title, body, module, module_id, action, read, created_at) values
  ('71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Scanner ticket updated', 'Your scanner ticket was updated by a technician.', 'tickets', '52700000-0000-0000-0000-000000000001', 'updated', false, now() - interval '2 hours'),
  ('6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'DMS training scheduled', 'Document management training is scheduled.', 'training', null, 'created', false, now() - interval '1 day'),
  ('a1000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Cert issue resolved', 'The patient portal certificate issue was resolved.', 'tickets', '52700000-0000-0000-0000-000000000005', 'resolved', false, now() - interval '3 hours'),
  ('b2000000-0000-4000-8000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 12 printer fixed', 'The gift card printer at Store 12 is back online.', 'tickets', '52700000-0000-0000-0000-000000000007', 'resolved', false, now() - interval '1 hour'),
  ('c3000000-0000-4000-8000-000000000002'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'BitLocker review started', 'The advisor encryption review has started.', 'projects', '53800000-0000-0000-0000-000000000005', 'assigned', false, now() - interval '30 minutes')
on conflict do nothing;

-- ---------------------------------------------------------
-- 20. AUDIT LOGS (a few more per org)
-- ---------------------------------------------------------
insert into public.audit_logs (id, organization_id, actor_user_id, actor_type, action, entity_type, entity_id, ip_address, user_agent, metadata) values
  ('83500000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'user', 'ticket.status.update', 'ticket', '52700000-0000-0000-0000-000000000002', '10.0.1.8'::inet, 'seed-agent/1.0', jsonb_build_object('from', 'new', 'to', 'in_progress')),
  ('83500000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'user', 'document.upload', 'document', '54700000-0000-0000-0000-000000000004', '10.0.2.8'::inet, 'seed-agent/1.0', jsonb_build_object('name', 'Vendor Access Policy')),
  ('83500000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'user', 'project.task.create', 'project_task', '53900000-0000-0000-0000-000000000004', '10.0.3.8'::inet, 'seed-agent/1.0', jsonb_build_object('projectId', '53800000-0000-0000-0000-000000000003')),
  ('83500000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'user', 'asset.create', 'asset', '56700000-0000-0000-0000-000000000007', '10.0.4.8'::inet, 'seed-agent/1.0', jsonb_build_object('name', 'Store 42 POS Terminal Reg-1')),
  ('83500000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid, 'user', 'finding.create', 'finding', '55700000-0000-0000-0000-000000000009', '10.0.5.8'::inet, 'seed-agent/1.0', jsonb_build_object('severity', 'medium')),
  ('83500000-0000-0000-0000-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'user', 'ticket.create', 'ticket', '52700000-0000-0000-0000-000000000001', '10.0.1.9'::inet, 'seed-agent/1.0', jsonb_build_object('status', 'open')),
  ('83500000-0000-0000-0000-000000000007'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'user', 'ticket.create', 'ticket', '52700000-0000-0000-0000-000000000003', '10.0.2.9'::inet, 'seed-agent/1.0', jsonb_build_object('status', 'new')),
  ('83500000-0000-0000-0000-000000000008'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'user', 'ticket.create', 'ticket', '52700000-0000-0000-0000-000000000005', '10.0.3.9'::inet, 'seed-agent/1.0', jsonb_build_object('status', 'urgent')),
  ('83500000-0000-0000-0000-000000000009'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000004'::uuid, 'user', 'ticket.create', 'ticket', '52700000-0000-0000-0000-000000000007', '10.0.4.9'::inet, 'seed-agent/1.0', jsonb_build_object('status', 'in_progress')),
  ('83500000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000002'::uuid, 'user', 'ticket.create', 'ticket', '52700000-0000-0000-0000-000000000009', '10.0.5.9'::inet, 'seed-agent/1.0', jsonb_build_object('status', 'in_progress'))
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 21. MODULE TABLES - settings/keys/ai/comments/timeline/results/triage/licenses/status/dmarc
-- ---------------------------------------------------------
insert into public.portal_module_settings (id, organization_id, module_key, settings) values
  ('81200000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'assets', jsonb_build_object('track_warranty', true, 'auto_scan', false)),
  ('81200000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'governance', jsonb_build_object('require_approval', true))
on conflict (id) do nothing;

insert into public.api_keys (id, organization_id, name, key_hash, key_prefix, permissions, created_by, is_active, last_used_at) values
  ('81210000-0000-0000-0000-000000000001'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Case Sync', 'sha256_northwind_case_sync_seed', 'mct_nw_', '["tickets:read", "documents:read"]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, true, now() - interval '1 day'),
  ('81210000-0000-0000-0000-000000000002'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Compliance Export', 'sha256_summit_compliance_seed', 'mct_sm_', '["findings:read", "audit:read"]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, true, now() - interval '3 hours')
on conflict (id) do nothing;

insert into public.ai_draft_outputs (id, organization_id, module_key, prompt_key, prompt_version, draft_content, status, created_by, source_entity_type, source_entity_id) values
  ('81220000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'tickets', 'triage', 1, jsonb_build_object('summary', 'Scanner sync issue likely WMS-side.', 'suggested_action', 'Check WMS connector'), 'approved', 'd4000000-0000-4000-8000-000000000001'::uuid, 'ticket', '52700000-0000-0000-0000-000000000001'),
  ('81220000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'tickets', 'triage', 1, jsonb_build_object('summary', 'DMS training request - schedule session.', 'suggested_action', 'Coordinate training'), 'draft', 'd4000000-0000-4000-8000-000000000002'::uuid, 'ticket', '52700000-0000-0000-0000-000000000003')
on conflict (id) do nothing;

insert into public.module_comments (id, organization_id, module_key, entity_type, entity_id, author_id, body, is_internal) values
  ('81230000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'projects', 'project', '53800000-0000-0000-0000-000000000001', 'f1000000-0000-4000-8000-000000000004'::uuid, 'ERP discovery call moved to Thursday.', false),
  ('81230000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'projects', 'project', '53800000-0000-0000-0000-000000000002', 'f1000000-0000-4000-8000-000000000005'::uuid, 'Scanner training booked for the archive team.', false)
on conflict (id) do nothing;

insert into public.module_timeline_events (id, organization_id, module_key, entity_type, entity_id, event_type, event_data, actor_user_id) values
  ('81240000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'projects', 'project', '53800000-0000-0000-0000-000000000001', 'created', jsonb_build_object('name', 'ERP Migration Planning'), 'f1000000-0000-4000-8000-000000000004'),
  ('81240000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'projects', 'project', '53800000-0000-0000-0000-000000000002', 'status_changed', jsonb_build_object('from', 'planned', 'to', 'in_progress'), 'f1000000-0000-4000-8000-000000000005')
on conflict (id) do nothing;

insert into public.scheduled_check_results (id, organization_id, module_key, check_type, check_target, status, result_data, duration_ms, checked_at, next_check_at) values
  ('81250000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'domain-monitors', 'dns', 'acme.example', 'ok', jsonb_build_object('ttl', 300, 'records', 4), 110, now() - interval '1 hour', now() + interval '23 hours'),
  ('81250000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'website-monitors', 'http', 'https://cases.northwind.example', 'ok', jsonb_build_object('response_ms', 210, 'status', 200), 220, now() - interval '30 minutes', now() + interval '1 hour')
on conflict (id) do nothing;

insert into public.ticket_triage_drafts (id, organization_id, raw_description, suggested_category, suggested_priority, suggested_subject, missing_info, first_response_draft, confidence_score, status, created_by, metadata) values
  ('81260000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Scanner keeps dropping from the WMS.', 'hardware', 'high', 'Scanner sync issue', null, 'We are investigating the scanner sync issue.', 0.9, 'approved', 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('81260000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Can we get training on the DMS?', 'training', 'low', 'DMS training request', null, 'We will schedule a DMS training session.', 0.8, 'draft', 'd4000000-0000-4000-8000-000000000002'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.license_tracking (id, organization_id, vendor, product_name, total_seats, assigned_seats, unused_seats, cost_per_seat, annual_cost, renewal_date, status, optimization_notes, reclaimable_savings, created_by) values
  ('81270000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Microsoft', 'M365 Business Premium', 45, 40, 5, 22.00, 11880.00, '2026-11-30', 'active', 'Five seats unused in finance.', 1320.00, 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81270000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Adobe', 'Acrobat Pro', 30, 22, 8, 25.00, 9000.00, '2026-10-31', 'active', 'Batch reassignment needed.', 2400.00, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.status_items (id, organization_id, title, description, severity, status, is_public, is_resolved, scheduled_start, scheduled_end, created_by) values
  ('81280000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VPN gateway latency', 'Latency spike during peak hours.', 'minor', 'resolved', true, true, now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81280000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive portal slow', 'Slow responses for 30 minutes.', 'minor', 'resolved', true, true, now() - interval '5 days', now() - interval '5 days' + interval '30 minutes', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

insert into public.dmarc_assessments (id, organization_id, domain, spf_record, spf_valid, dkim_configured, dkim_selector, dmarc_record, dmarc_policy, dmarc_valid, dmarc_pct, bimi_configured, recommendation_notes, last_checked_at, status, created_by) values
  ('81290000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', 'v=SPF1 include:_spf.example.com ~all', true, true, 'selector1', 'v=DMARC1; p=none;', 'none', true, 100, false, 'Upgrade policy to quarantine next quarter.', now() - interval '7 days', 'passing', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81290000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'northwind.example', 'v=SPF1 include:_spf.example.com ~all', true, false, null, 'v=DMARC1; p=reject;', 'reject', true, 100, false, 'DKIM selector missing for the case mail system.', now() - interval '10 days', 'needs_review', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

-- 08_expanded_test_data.sql  (PART 4: module tables - Acme + Northwind + extras)

-- ---------------------------------------------------------
-- 22. SECURITY SUITE (Acme + Northwind)
-- ---------------------------------------------------------
insert into public.m365_hardening (id, organization_id, tenant_domain, mfa_enforced, conditional_access_configured, legacy_auth_blocked, admin_count, guest_count, shared_mailbox_count, audit_logging_enabled, dlp_configured, defender_configured, last_assessment_at, next_review_at, overall_score, status, notes, created_by) values
  ('81300000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.onmicrosoft.com', true, true, true, 5, 3, 4, true, false, true, now() - interval '20 days', now() + interval '10 days', 68, 'needs_review', 'DLP not configured.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81300000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'northwind.onmicrosoft.com', true, true, true, 4, 2, 6, true, true, true, now() - interval '15 days', now() + interval '15 days', 88, 'healthy', 'M365 hardening on track.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.incident_responses (id, organization_id, incident_type, title, description, severity, detected_at, contained_at, eradicated_at, recovered_at, closed_at, affected_systems, root_cause, lessons_learned, status, lead_user_id, created_by) values
  ('81310000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'suspected_breach', 'Phishing wave targeting warehouse staff', 'Several staff received a phishing email claiming to be the WMS vendor.', 'medium', now() - interval '4 days', now() - interval '3 days', now() - interval '3 days', now() - interval '2 days', now() - interval '2 days', '{email,workstations}', 'Credential phishing email', 'Run a follow-up phishing simulation.', 'closed', 'd4000000-0000-4000-8000-000000000003'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81310000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'malware', 'Archive PC infected with adware', 'An archive room PC showed adware behavior after a shared USB stick.', 'low', now() - interval '2 days', now() - interval '2 days', now() - interval '1 day', now() - interval '1 day', null, '{archive_pc}', 'Infected USB stick', 'Enforce USB write blocking on archive PCs.', 'recovered', 'd4000000-0000-4000-8000-000000000002'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.identity_verifications (id, organization_id, requestor_name, requestor_email, verification_method, verification_pass, action_authorized, authorized_by, authorized_at, notes, status, created_by) values
  ('81320000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Casey Client User', 'casey@acme.example', 'in_person', true, true, 'f1000000-0000-4000-8000-000000000004'::uuid, now() - interval '5 days', 'Verified at the front desk.', 'verified', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81320000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Jordan Client User', 'jordan@northwind.example', 'video_call', true, true, 'f1000000-0000-4000-8000-000000000005'::uuid, now() - interval '3 days', 'Video verification complete.', 'verified', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.endpoint_security (id, organization_id, device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled, local_admin_removed, firewall_enabled, edr_deployed, coverage_pct, status, notes, created_by) values
  ('81330000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse PCs', 15, 15, 14, 15, 12, 15, 13, 90, 'healthy', 'Two PCs missing encryption.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81330000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive PCs', 8, 8, 8, 8, 6, 8, 8, 100, 'healthy', 'All archive PCs compliant.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.patch_compliance (id, organization_id, device_group, total_devices, patched_devices, pending_patches, critical_patches, last_patch_date, next_maintenance_window, exception_count, compliance_pct, status, notes, created_by) values
  ('81340000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse PCs', 15, 13, 2, 1, now() - interval '7 days', now() + interval '7 days', 1, 87, 'attention', 'One critical patch pending.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81340000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive PCs', 8, 8, 0, 0, now() - interval '3 days', now() + interval '11 days', 0, 100, 'healthy', 'Fully patched.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.offboarding_checklists (id, organization_id, employee_name, employee_email, department, offboarding_date, account_disabled, mailbox_converted, onedrive_transferred, license_reclaimed, access_reviewed, evidence_collected, completed_at, status, notes, created_by) values
  ('81350000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Rita Kowalski', 'rita.kowalski@acme.example', 'Finance', '2026-08-15', true, true, true, true, false, false, null, 'in_progress', 'Access review pending.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81350000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Henry Ford', 'henry.ford@northwind.example', 'Legal', '2026-07-30', true, true, true, true, true, true, now() - interval '3 days', 'completed', 'Offboarding complete.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.break_glass_accounts (id, organization_id, account_name, system, custodian_name, last_rotated_at, next_rotation_at, last_used_at, last_tested_at, access_procedure, test_notes, status, created_by) values
  ('81360000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'BG-ACME-ADMIN', 'Active Directory', 'Aisha Johnson', now() - interval '60 days', now() + interval '30 days', null, now() - interval '60 days', 'Sealed envelope in the safe.', 'Tested during the Q2 drill.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81360000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'BG-NW-ENTRA', 'Entra ID', 'Aisha Johnson', now() - interval '30 days', now() + interval '60 days', now() - interval '10 days', now() - interval '30 days', 'Vaulted credential in password manager.', 'Used during archive migration.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.onboarding_clients (id, organization_id, client_name, discovery_complete, m365_setup_complete, network_documented, security_baseline_applied, documentation_prepared, backup_configured, handoff_complete, started_at, completed_at, status, notes, created_by) values
  ('81370000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Annex Facility', true, true, true, true, true, false, false, now() - interval '20 days', null, 'in_progress', 'Backup configuration pending.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81370000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Second Office', true, true, true, true, true, true, true, now() - interval '40 days', now() - interval '10 days', 'completed', 'Second office live.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 23. GOVERNANCE (retention + tabletop) Acme + Northwind
-- ---------------------------------------------------------
insert into public.retention_policies (id, organization_id, data_category, system_name, retention_period_days, disposal_method, is_regulated, regulation_reference, last_reviewed_at, next_review_at, status, notes, created_by) values
  ('81380000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'HR Records', 'HR Portal', 2190, 'secure_delete', true, 'State employment law', now() - interval '30 days', now() + interval '330 days', 'active', '6-year retention.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81380000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Case Files', 'Case Management', 2555, 'archive', true, 'Bar association rule', now() - interval '15 days', now() + interval '345 days', 'active', '7-year retention for case files.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.tabletop_exercises (id, organization_id, title, scenario, scenario_type, participants, scheduled_date, completed_at, facilitator_id, notes, action_items, after_action_report, status, created_by) values
  ('81390000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Ransomware Response Drill', 'Simulated ransomware on the production network.', 'ransomware', 8, now() + interval '20 days', null, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Planned with warehouse leadership.', jsonb_build_array('Review backup restore process', 'Verify air-gapped copy'), null, 'scheduled', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81390000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Data Breach Response Drill', 'Simulated breach of case data.', 'data_breach', 6, now() - interval '30 days', now() - interval '30 days', 'd4000000-0000-4000-8000-000000000002'::uuid, 'Completed with legal team.', jsonb_build_array('Notify clients within 24h', 'Preserve logs'), jsonb_build_object('summary', 'Response was effective; notification template needs polish.'), 'completed', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 24. FIELD SERVICES (Acme + Northwind)
-- ---------------------------------------------------------
insert into public.isp_assessments (id, organization_id, client_name, current_provider, current_cost, recommended_provider, recommended_cost, services, bandwidth_current, bandwidth_needed, contract_status, phone_lines, voip_ready, notes, status, created_by) values
  ('81400000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Manufacturing', 'Maine Fiber Co', 1499.00, 'Maine Fiber Co', 1499.00, 'fiber,voip', '500/500', '500/500', 'locked', 8, true, 'Contract renewed through 2027.', 'completed', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81400000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Legal', 'Coastal Tel', 899.00, 'Coastal Tel', 850.00, 'fiber,voip', '300/300', '300/300', 'renewal_due', 6, true, 'Renegotiation underway.', 'in_progress', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.unifi_surveys (id, organization_id, site_name, site_address, access_points, switches, cameras, nvr_estimated_storage_tb, outdoor_aps, cable_runs_estimated, poe_budget_watts, survey_date, notes, status, created_by) values
  ('81410000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Main Plant', '1 Industrial Way', 14, 3, 8, 4.2, 2, 12, 600, '2026-07-20', 'Survey complete for main plant.', 'completed', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81410000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Offices', '55 Court St', 6, 2, 4, 1.1, 0, 8, 240, '2026-07-22', 'Survey complete for offices.', 'completed', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.port_maps (id, organization_id, switch_name, port_number, vlan_id, vlan_name, wall_jack_label, connected_device, device_type, uplink, poe_enabled, speed, notes, created_by) values
  ('81420000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'SW-PLANT-1', 1, 10, 'Management', 'PLANT-A1', 'AP-Plant-Lobby', 'access_point', false, true, '1G', 'Lobby AP.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81420000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'SW-PLANT-1', 24, null, null, 'PLANT-UPLINK', 'SW-CORE-PLANT', 'uplink', true, false, '10G', 'Uplink to core.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81420000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'SW-OFFICE-1', 5, 20, 'Voice', 'OFF-5', 'Phone-05', 'voip_phone', false, true, '1G', 'Reception phone.', 'f1000000-0000-4000-8000-000000000005'::uuid),
  ('81420000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'SW-OFFICE-1', 24, null, null, 'OFF-UPLINK', 'SW-CORE-OFFICE', 'uplink', true, false, '10G', 'Uplink to core.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.camera_calculations (id, organization_id, site_name, camera_count, avg_bitrate_mbps, resolution, retention_days, estimated_storage_tb, recommended_nvr, notes, status, created_by) values
  ('81430000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Main Plant', 20, 5.00, '4MP', 30, 3.60, 'UNVR Pro', 'Plant-wide coverage.', 'completed', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81430000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Offices', 8, 4.00, '4MP', 30, 1.15, 'UNVR', 'Office coverage.', 'completed', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.hardware_staging (id, organization_id, device_type, device_name, serial_number, asset_tag, configured, tested, labeled, imaged, qa_verified, staged_by, staged_at, notes, status, created_by) values
  ('81440000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Laptop', 'FIN-LAP-1002', 'SN-LAP-01002', 'AT-LAP-1002', true, true, true, true, true, 'd4000000-0000-4000-8000-000000000001'::uuid, now() - interval '2 days', 'Ready for finance.', 'ready', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81440000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Workstation', 'ARCH-PC-01', 'SN-ARCH-001', 'AT-ARCH-001', true, false, false, true, false, null, null, 'Needs labeling.', 'staged', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.network_diagrams (id, organization_id, site_name, diagram_data, device_count, vlan_count, wan_count, wireless_zones, camera_zones, notes, status, created_by) values
  ('81450000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Main Plant', jsonb_build_object('nodes', jsonb_build_array(jsonb_build_object('id', 'core-plant', 'type', 'switch')), 'edges', jsonb_build_array()), 18, 4, 1, 3, 2, 'Plant network diagram.', 'published', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81450000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Offices', jsonb_build_object('nodes', jsonb_build_array(), 'edges', jsonb_build_array()), 10, 3, 1, 1, 1, 'Office diagram.', 'draft', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 25. EDU AUTOMATION (Acme + Northwind)
-- ---------------------------------------------------------
insert into public.sop_library (id, organization_id, title, sop_number, category, version, framework, content, status, last_reviewed_at, next_review_at, created_by) values
  ('81460000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Scanner Troubleshooting', 'SOP-101', 'Operations', '1.0', '{}', 'Steps to diagnose WMS scanner sync issues.', 'published', now() - interval '20 days', now() + interval '70 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81460000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Digitization Workflow', 'SOP-202', 'Records', '1.2', '{}', 'Standard workflow for archive scanning.', 'published', now() - interval '10 days', now() + interval '80 days', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.compliance_readiness (id, organization_id, framework, control_id, control_description, is_compliant, evidence_collected, notes, assessed_at, status, created_by) values
  ('81470000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'SOC 2', 'CC6.1', 'Logical and physical access controls', false, false, 'Access reviews need completion.', now() - interval '5 days', 'in_progress', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81470000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'ABA', 'Client confidentiality', 'Client data confidentiality controls', true, true, 'Policy and training in place.', now() - interval '12 days', 'compliant', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.insurance_evidence (id, organization_id, category, evidence_description, evidence_status, document_reference, collected_at, renewal_date, notes, evidence_type, title, status, coverage_area, insurance_provider, policy_number, expiry_date, last_verified_at, created_by) values
  ('81480000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'cyber', 'Cyber liability policy certificate', 'collected', 'https://example.invalid/docs/acme-cyber.pdf', now() - interval '60 days', '2026-12-01', 'Renewal in December.', 'cyber_liability', 'Cyber Liability', 'active', 'US', 'SafeGuard Insurance', 'POL-ACME-001', '2026-12-01', now() - interval '60 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81480000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'errors_omissions', 'E&O policy certificate', 'needed', null, null, '2026-11-15', 'Awaiting renewal certificate.', 'errors_omissions', 'E&O Insurance', 'needed', 'US', 'LegalShield Mutual', 'POL-NW-002', '2026-11-15', null, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.ai_policies (id, organization_id, title, content, approved_tools, data_handling_rules, employee_guidance, status, approved_by, approved_at, created_by) values
  ('81490000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme AI Usage Policy', 'Guidance on approved AI tools and data handling.', '{copilot,chatgpt}'::text[], 'No customer data in public AI tools.', 'Never paste sensitive production data.', 'published', 'f1000000-0000-4000-8000-000000000004'::uuid, now() - interval '30 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81490000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind AI Policy', 'AI usage for legal document drafting.', '{copilot}'::text[], 'Attorney review required for AI drafts.', 'Draft only - always review.', 'published', 'f1000000-0000-4000-8000-000000000005'::uuid, now() - interval '15 days', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.knowledge_articles (id, organization_id, title, content, category, tags, is_published, view_count, helpful_count, not_helpful_count, created_by) values
  ('81500000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'How to reset the warehouse scanner', 'Power cycle the scanner and re-pair with the WMS.', 'hardware', '{scanner,warehouse}', true, 42, 38, 4, 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81500000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Requesting a DMS training session', 'How to book document management training.', 'training', '{dms,training}', true, 25, 22, 3, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.training_modules (id, organization_id, title, description, category, duration_minutes, is_required, completion_count, status, created_by) values
  ('81510000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Phishing Awareness 2026', 'Annual phishing awareness training.', 'security', 30, true, 38, 'active', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81510000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Client Data Handling', 'Handling client data safely.', 'compliance', 20, true, 22, 'active', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.phishing_campaigns (id, organization_id, campaign_name, target_count, opened_count, clicked_count, reported_count, started_at, ended_at, notes, status, created_by) values
  ('81520000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Q2 Phish Test', 45, 30, 5, 3, now() - interval '14 days', now() - interval '7 days', '5 clicked - training assigned.', 'completed', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81520000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Q2 Phish Test', 30, 20, 2, 4, now() - interval '10 days', null, '2 clicked - follow-up scheduled.', 'in_progress', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.cyber_scorecards (id, organization_id, category, score, max_score, badge, last_updated) values
  ('81530000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Security', 72, 100, 'Needs Attention', now() - interval '5 days'),
  ('81530000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Operations', 85, 100, 'Strong', now() - interval '5 days'),
  ('81530000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Security', 88, 100, 'Strong', now() - interval '4 days')
on conflict (id) do nothing;

insert into public.automation_workflows (id, organization_id, name, description, script_type, trigger_type, is_active, last_run_at, last_run_status, run_count, created_by) values
  ('81540000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Weekly scanner health report', 'Generates a weekly scanner health report.', 'powershell', 'schedule', true, now() - interval '3 days', 'success', 12, 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81540000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive index nightly sync', 'Syncs the archive index nightly.', 'python', 'schedule', true, now() - interval '1 day', 'success', 90, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.powershell_scripts (id, organization_id, name, script_content, policy_checked, approval_required, approved_by, approved_at, status, created_by) values
  ('81550000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Set-ScannerPolicy', 'Script body here.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '30 days', 'approved', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81550000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Export-ArchiveIndex', 'Script body here.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '15 days', 'approved', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.kb_article_generations (id, organization_id, source_ticket_id, source_title, generated_content, reviewed_content, status, reviewed_by, reviewed_at, created_by) values
  ('81560000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '52700000-0000-0000-0000-000000000001'::uuid, 'Scanner sync failure', 'Generated draft from the scanner ticket.', 'Reviewed content.', 'approved', 'd4000000-0000-4000-8000-000000000001'::uuid, now() - interval '2 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81560000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '52700000-0000-0000-0000-000000000003'::uuid, 'DMS training request', 'Generated draft for the training KB article.', null, 'draft', null, null, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 26. FINAL BATCH (Acme + Northwind)
-- ---------------------------------------------------------
insert into public.sharepoint_plans (id, organization_id, site_name, team_name, structure_type, owner, sensitivity_label, external_sharing, notes, status, created_by) values
  ('81570000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Finance', 'Finance Team', 'team_site', 'Finance Manager', 'General', 'disabled', 'Finance site ready.', 'planned', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81570000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Case Management', 'Case Team', 'team_site', 'Managing Partner', 'Confidential', 'disabled', 'Case team site planned.', 'planned', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.device_profiles (id, organization_id, profile_name, device_type, os, settings, description, status, created_by) values
  ('81580000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Standard', 'workstation', 'Windows 11', jsonb_build_object('screen_lock_minutes', 5), 'Standard warehouse PC profile.', 'active', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81580000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Standard', 'workstation', 'Windows 11', jsonb_build_object('usb_write_blocked', true), 'Archive PC profile with USB write blocking.', 'active', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.saas_audits (id, organization_id, vendor_name, service_name, monthly_cost, annual_cost, payment_method, classification, usage_frequency, cancellation_risk, has_data_access, renewal_date, notes, created_by) values
  ('81590000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'WMS Software', 'WMS Platform', 3200.00, 38400.00, 'credit_card', 'critical', 'daily', 'high', true, '2026-12-31', 'Critical production system.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81590000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'LexSearch', 'Legal research tool', 450.00, 5400.00, 'invoice', 'core', 'daily', 'medium', false, '2026-10-01', 'Renewal approaching.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.procurement_quotes (id, organization_id, vendor_name, product, quote_amount, competitor_quote, comparison_notes, selected, purchased_at, notes, created_by) values
  ('81600000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Dell', 'PowerEdge R750', 18500.00, 19200.00, 'Dell quote slightly lower; better support.', true, now() - interval '30 days', 'ERP host purchased.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81600000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Fujitsu', 'fi-7160 scanner', 2200.00, 2350.00, 'Fujitsu recommended.', false, null, 'Waiting for approval.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.dns_change_requests (id, organization_id, domain, change_type, change_description, proposed_value, current_value, status, approved_by, implemented_at, created_by) values
  ('81610000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', 'txt', 'Add SPF record for warehouse mail.', 'v=SPF1 include:_spf.example.com ~all', 'none', 'approved', 'f1000000-0000-4000-8000-000000000004'::uuid, now() - interval '2 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81610000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'northwind.example', 'a', 'Add mail server A record.', '203.0.113.20', 'none', 'pending', null, null, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.custom_forms (id, organization_id, form_name, form_description, form_fields, is_active, submission_count, created_by) values
  ('81620000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'New Vendor Request', 'Request onboarding for a new vendor.', '[{"key": "vendor_name", "label": "Vendor Name", "type": "text"}]'::jsonb, true, 3, 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81620000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'File Retrieval Request', 'Request a file from the archive.', '[{"key": "case_id", "label": "Case ID", "type": "text"}]'::jsonb, true, 8, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.client_runbooks (id, organization_id, title, content, category, version, status, last_reviewed_at, next_review_at, created_by) values
  ('81630000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Ops Runbook', 'Quick reference for Acme operations.', 'manufacturing', '1.1', 'published', now() - interval '15 days', now() + interval '75 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81630000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Runbook', 'Quick reference for Northwind.', 'legal', '1.0', 'draft', null, null, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.budget_roadmaps (id, organization_id, item_name, category, estimated_cost, fiscal_year, quarter, priority, status, notes, created_by) values
  ('81640000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'ERP Migration', 'software', 45000.00, 2027, 1, 'high', 'approved', 'Approved for Q1.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81640000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Expansion', 'hardware', 15000.00, 2027, 2, 'medium', 'planned', 'Planned expansion.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.dynamic_client_forms (id, organization_id, title, description, form_type, status, fields, settings, published_at, closes_at, created_by) values
  ('81650000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Access Request', 'Request access to the warehouse systems.', 'access_request', 'published', '[{"key": "employee", "label": "Employee", "type": "text"}, {"key": "system", "label": "System", "type": "select", "options": ["WMS", "VPN", "Email"]}]'::jsonb, jsonb_build_object('require_login', true), now() - interval '10 days', now() + interval '20 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81650000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Archive Retrieval Form', 'Request archived case files.', 'request', 'published', '[{"key": "case_id", "label": "Case ID", "type": "text"}, {"key": "reason", "label": "Reason", "type": "textarea"}]'::jsonb, jsonb_build_object(), now() - interval '5 days', null, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.dynamic_form_submissions (id, form_id, organization_id, respondent_id, respondent_email, answers, status, submitted_at) values
  ('81660000-0000-0000-0000-000000000001'::uuid, '81650000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'casey@acme.example', jsonb_build_object('employee', 'New Hire', 'system', 'WMS'), 'submitted', now() - interval '2 days'),
  ('81660000-0000-0000-0000-000000000002'::uuid, '81650000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'jordan@northwind.example', jsonb_build_object('case_id', 'NW-1044', 'reason', 'Client request'), 'submitted', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.client_onboarding_command_center_records (id, organization_id, client_name, client_domain, client_contact_email, client_contact_phone, onboarding_lead_id, status, phase, risk_level, discovery_notes, m365_setup_status, m365_tenant_id, m365_licenses, access_collection_status, access_credentials, network_baseline_status, network_diagram_url, network_scan_results, documentation_status, documentation_url, security_baseline_status, security_baseline_score, security_findings, support_handoff_status, support_handoff_notes, handoff_completed_at, next_review_at, started_at, completed_at) values
  ('81670000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Annex Facility', 'acmeannex.example', 'it@acmeannex.example', '555-0901', 'f1000000-0000-4000-8000-000000000004'::uuid, 'in_progress', 'm365', 'medium', 'Annex facility onboarding.', 'complete', 'acmeannex.onmicrosoft.com', jsonb_build_object('m365_business_premium', 12), 'in_progress', jsonb_build_object(), 'not_started', null, jsonb_build_object(), 'not_started', null, 'not_started', null, jsonb_build_array(), 'not_started', null, null, now() + interval '30 days', now() - interval '12 days', null),
  ('81670000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Second Office', 'northwind2.example', 'it@northwind2.example', '555-0902', 'f1000000-0000-4000-8000-000000000005'::uuid, 'completed', 'handoff', 'low', 'Second office completed.', 'complete', 'northwind2.onmicrosoft.com', jsonb_build_object('m365_business_standard', 15), 'complete', jsonb_build_object('credential_collected', true), 'complete', 'https://example.invalid/diagrams/nw2', jsonb_build_object('scan_complete', true, 'findings', 1), 'complete', 'https://example.invalid/docs/nw2', 'complete', 90, jsonb_build_array(), 'complete', 'Handoff complete.', now() - interval '5 days', now() + interval '55 days', now() - interval '40 days', now() - interval '5 days')
on conflict (id) do nothing;

insert into public.client_onboarding_checklist_items (id, organization_id, onboarding_record_id, phase, item_key, label, description, is_required, is_completed, completed_by, completed_at, notes, sort_order) values
  ('81680000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '81670000-0000-0000-0000-000000000001'::uuid, 'discovery', 'kickoff', 'Kickoff call completed', 'Initial discovery call.', true, true, 'f1000000-0000-4000-8000-000000000004'::uuid, now() - interval '10 days', null, 1),
  ('81680000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '81670000-0000-0000-0000-000000000001'::uuid, 'm365', 'tenant_created', 'M365 tenant configured', 'Tenant and domains configured.', true, false, null, null, 'Pending domain verification.', 2),
  ('81680000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '81670000-0000-0000-0000-000000000002'::uuid, 'handoff', 'handoff_verified', 'Handoff verified', 'Support handoff verified.', true, true, 'f1000000-0000-4000-8000-000000000005'::uuid, now() - interval '4 days', null, 3)
on conflict (id) do nothing;

insert into public.score_history (id, organization_id, category, score, recorded_at) values
  ('81690000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Security', 70, now() - interval '30 days'),
  ('81690000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Security', 72, now() - interval '5 days'),
  ('81690000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Security', 85, now() - interval '20 days'),
  ('81690000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Security', 88, now() - interval '4 days')
on conflict (id) do nothing;

insert into public.badges_earned (id, organization_id, badge_name, category, earned_at, points) values
  ('81700000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Phishing Free Quarter', 'security', now() - interval '45 days', 100),
  ('81700000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Security Champion', 'security', now() - interval '20 days', 150)
on conflict (id) do nothing;

insert into public.license_allocations (id, organization_id, software_name, license_type, total_seats, used_seats, cost_per_seat, billing_cycle, last_audit_date, status, notes, created_by) values
  ('81710000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'WMS Platform', 'per_seat', 40, 38, 80.00, 'monthly', now() - interval '30 days', 'active', 'Two seats spare.', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81710000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'LexSearch', 'per_seat', 30, 25, 15.00, 'monthly', now() - interval '45 days', 'active', 'Five seats unused.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.dmarc_analyses (id, organization_id, domain, dmarc_record, spf_record, dkim_record, dmarc_policy, alignment_mode, pct, overall_grade, issues, recommendations, analyzed_at, created_by) values
  ('81720000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', 'v=DMARC1; p=none;', 'v=SPF1 include:_spf.example.com ~all', 'selector1', 'none', 'relaxed', 100, 'B', jsonb_build_array('Policy should move to quarantine'), jsonb_build_array('Set p=quarantine in 30 days'), now() - interval '7 days', 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81720000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'northwind.example', 'v=DMARC1; p=reject;', 'v=SPF1 include:_spf.example.com ~all', 'selector1', 'reject', 'strict', 100, 'A', jsonb_build_array(), jsonb_build_array('Maintain current policy'), now() - interval '10 days', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.training_courses (id, organization_id, title, description, category, difficulty, estimated_minutes, status, passing_score, created_by) values
  ('81730000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Warehouse Safety Basics', 'Safety training for warehouse staff.', 'safety', 'beginner', 20, 'published', 80, 'f1000000-0000-4000-8000-000000000004'::uuid),
  ('81730000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Client Data Handling for Staff', 'How to handle client data safely.', 'compliance', 'beginner', 25, 'published', 80, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.training_lessons (id, course_id, title, content, lesson_type, sort_order) values
  ('81740000-0000-0000-0000-000000000001'::uuid, '81730000-0000-0000-0000-000000000001'::uuid, 'Scanner Safety', 'Lesson content.', 'video', 1),
  ('81740000-0000-0000-0000-000000000002'::uuid, '81730000-0000-0000-0000-000000000002'::uuid, 'Client Data Rules', 'Lesson content.', 'text', 1)
on conflict (id) do nothing;

insert into public.training_enrollments (id, course_id, user_id, status, progress_percent, completed_at, enrolled_at) values
  ('81750000-0000-0000-0000-000000000001'::uuid, '81730000-0000-0000-0000-000000000001'::uuid, '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'completed', 100, now() - interval '10 days', now() - interval '30 days'),
  ('81750000-0000-0000-0000-000000000002'::uuid, '81730000-0000-0000-0000-000000000002'::uuid, '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'in_progress', 60, null, now() - interval '5 days')
on conflict (id) do nothing;

insert into public.store_quote_requests (id, status, customer, items, selected_promo_ids, recommended_bundle_ids, notes) values
  ('83240000-0000-0000-0000-000000000001'::uuid, 'submitted', jsonb_build_object('name', 'Acme Ops', 'email', 'ops@acme.example', 'company', 'Acme Manufacturing'), '[{"product_slug": "managed-workstation", "quantity": 25}]'::jsonb, '{}'::text[], '{bundle-essentials}'::text[], 'Requested via the ops portal.'),
  ('83240000-0000-0000-0000-000000000002'::uuid, 'reviewed', jsonb_build_object('name', 'Northwind IT', 'email', 'it@northwind.example', 'company', 'Northwind Legal'), '[{"product_slug": "archive-digitization", "quantity": 1}]'::jsonb, '{}'::text[], '{}'::text[], 'Quote for archive digitization.')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 27. EXTRAS FOR HARBORVIEW / BRIGHTLINE / SUMMIT (thicker orgs)
-- ---------------------------------------------------------
insert into public.m365_hardening (id, organization_id, tenant_domain, mfa_enforced, conditional_access_configured, legacy_auth_blocked, admin_count, guest_count, shared_mailbox_count, audit_logging_enabled, dlp_configured, defender_configured, last_assessment_at, next_review_at, overall_score, status, notes, created_by) values
  ('81810000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.onmicrosoft.com', true, true, true, 6, 5, 12, true, false, true, now() - interval '25 days', now() + interval '5 days', 72, 'needs_review', 'DLP pending for clinical mail.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81810000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.onmicrosoft.com', true, true, true, 4, 8, 20, true, true, true, now() - interval '18 days', now() + interval '12 days', 85, 'healthy', 'M365 healthy.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81810000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit.onmicrosoft.com', true, true, true, 3, 2, 5, true, true, true, now() - interval '10 days', now() + interval '20 days', 92, 'healthy', 'M365 fully hardened.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.incident_responses (id, organization_id, incident_type, title, description, severity, detected_at, contained_at, eradicated_at, recovered_at, closed_at, affected_systems, root_cause, lessons_learned, status, lead_user_id, created_by) values
  ('81820000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'outage', 'EHR database performance incident', 'EHR database degraded for 20 minutes during a backup window.', 'medium', now() - interval '7 days', now() - interval '7 days', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days', '{ehr}', 'Backup job resource contention', 'Stagger backup windows.', 'closed', 'd4000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81820000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'outage', 'Store 42 network outage', 'Store 42 lost network connectivity for 15 minutes.', 'high', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', '{store42,pos}', 'Switch firmware crash', 'Schedule firmware updates.', 'closed', 'd4000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.patch_compliance (id, organization_id, device_group, total_devices, patched_devices, pending_patches, critical_patches, last_patch_date, next_maintenance_window, exception_count, compliance_pct, status, notes, created_by) values
  ('81800000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical PCs', 120, 118, 2, 0, now() - interval '5 days', now() + interval '9 days', 1, 98, 'healthy', 'Two exceptions approved.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81800000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store POS', 48, 45, 3, 1, now() - interval '6 days', now() + interval '8 days', 2, 94, 'attention', 'One critical patch pending.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81800000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptops', 60, 58, 2, 0, now() - interval '4 days', now() + interval '10 days', 1, 97, 'healthy', 'Two in exception window.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.endpoint_security (id, organization_id, device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled, local_admin_removed, firewall_enabled, edr_deployed, coverage_pct, status, notes, created_by) values
  ('81840000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical PCs', 120, 120, 118, 120, 115, 120, 120, 99, 'healthy', 'Two encryption exceptions.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81840000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store POS', 48, 48, 48, 48, 45, 48, 46, 96, 'healthy', 'Three EDR agents pending.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81840000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptops', 60, 60, 60, 60, 58, 60, 60, 100, 'healthy', 'Fully compliant.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.retention_policies (id, organization_id, data_category, system_name, retention_period_days, disposal_method, is_regulated, regulation_reference, last_reviewed_at, next_review_at, status, notes, created_by) values
  ('81850000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Patient Records', 'EHR', 3285, 'secure_delete', true, 'HIPAA', now() - interval '20 days', now() + interval '340 days', 'active', '9-year retention per HIPAA.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81850000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Sales Records', 'ERP', 2190, 'archive', true, 'Retail regulations', now() - interval '10 days', now() + interval '350 days', 'active', '6-year retention.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.tabletop_exercises (id, organization_id, title, scenario, scenario_type, participants, scheduled_date, completed_at, facilitator_id, notes, action_items, after_action_report, status, created_by) values
  ('81860000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Ransomware Drill', 'Simulated ransomware on the EHR.', 'ransomware', 10, now() + interval '15 days', null, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Scheduled with clinical IT.', jsonb_build_array('Test EHR restore', 'Verify comms plan'), null, 'scheduled', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81860000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Outage Drill', 'Simulated POS outage across stores.', 'outage', 6, now() + interval '25 days', null, 'd4000000-0000-4000-8000-000000000001'::uuid, 'Planned with store ops.', jsonb_build_array('Test offline mode'), null, 'scheduled', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.offboarding_checklists (id, organization_id, employee_name, employee_email, department, offboarding_date, account_disabled, mailbox_converted, onedrive_transferred, license_reclaimed, access_reviewed, evidence_collected, completed_at, status, notes, created_by) values
  ('81770000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Nina Petrova', 'nina.petrova@harborview.example', 'Nursing', '2026-08-20', false, false, false, false, false, false, null, 'not_started', 'Scheduled for next month.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81770000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Leo Torres', 'leo.torres@brightline.example', 'Store Ops', '2026-08-10', true, true, true, true, false, false, null, 'in_progress', 'Access review pending.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81770000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Ava Chen', 'ava.chen@summit.example', 'Compliance', '2026-07-15', true, true, true, true, true, true, now() - interval '14 days', 'completed', 'Offboarding complete.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.break_glass_accounts (id, organization_id, account_name, system, custodian_name, last_rotated_at, next_rotation_at, last_used_at, last_tested_at, access_procedure, test_notes, status, created_by) values
  ('81780000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'BG-HV-EHR', 'EHR System', 'Aisha Johnson', now() - interval '45 days', now() + interval '45 days', null, now() - interval '45 days', 'Sealed envelope in IT safe.', 'Tested during EHR DR drill.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81780000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'BG-BL-POS', 'POS Systems', 'Aisha Johnson', now() - interval '20 days', now() + interval '70 days', now() - interval '5 days', now() - interval '20 days', 'Password manager vault.', 'Used during Store 42 incident.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.onboarding_clients (id, organization_id, client_name, discovery_complete, m365_setup_complete, network_documented, security_baseline_applied, documentation_prepared, backup_configured, handoff_complete, started_at, completed_at, status, notes, created_by) values
  ('81790000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Radiology Wing Expansion', true, true, true, false, false, false, false, now() - interval '10 days', null, 'in_progress', 'Security baseline pending.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81790000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 12 Refresh', true, false, false, false, false, false, false, now() - interval '5 days', null, 'in_progress', 'M365 setup pending.', 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

insert into public.isp_assessments (id, organization_id, client_name, current_provider, current_cost, recommended_provider, recommended_cost, services, bandwidth_current, bandwidth_needed, contract_status, phone_lines, voip_ready, notes, status, created_by) values
  ('81870000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Health Systems', 'StateLink Fiber', 1999.00, 'StateLink Fiber', 1999.00, 'fiber,voip,circuit', '1G/1G', '1G/1G', 'locked', 15, true, 'Contract good through 2027.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81870000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Retail Group', 'StoreNet', 2400.00, 'StoreNet', 2300.00, 'fiber,voip,circuit', '10G/10G', '10G/10G', 'renewal_due', 22, true, 'Multi-store renewal negotiation.', 'in_progress', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.unifi_surveys (id, organization_id, site_name, site_address, access_points, switches, cameras, nvr_estimated_storage_tb, outdoor_aps, cable_runs_estimated, poe_budget_watts, survey_date, notes, status, created_by) values
  ('81880000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Main Hospital', '1 Hospital Way', 32, 8, 24, 11.4, 4, 30, 1800, '2026-07-18', 'Full hospital survey.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81880000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline HQ', '10 Retail Blvd', 12, 3, 6, 2.8, 1, 14, 600, '2026-07-25', 'HQ survey.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.camera_calculations (id, organization_id, site_name, camera_count, avg_bitrate_mbps, resolution, retention_days, estimated_storage_tb, recommended_nvr, notes, status, created_by) values
  ('81900000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Main Hospital', 40, 6.00, '4MP', 60, 14.40, 'Enterprise NVR (64ch)', 'Full hospital coverage.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81900000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline HQ', 10, 4.00, '4MP', 30, 1.44, 'UNVR Pro', 'HQ coverage.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.sop_library (id, organization_id, title, sop_number, category, version, framework, content, status, last_reviewed_at, next_review_at, created_by) values
  ('81930000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Restore Procedure', 'SOP-301', 'Backup', '2.0', '{}', 'Step-by-step EHR restore procedure.', 'published', now() - interval '25 days', now() + interval '65 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81930000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Failure Handling', 'SOP-402', 'Retail', '1.1', '{}', 'POS failure response for store staff.', 'published', now() - interval '12 days', now() + interval '78 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.compliance_readiness (id, organization_id, framework, control_id, control_description, is_compliant, evidence_collected, notes, assessed_at, status, created_by) values
  ('81940000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA', '164.312(a)', 'Access control for ePHI', true, true, 'Access review evidence collected.', now() - interval '8 days', 'compliant', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81940000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'PCI DSS', '3.3', 'Mask PAN when displayed', false, false, 'POS screens need masking review.', now() - interval '6 days', 'in_progress', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.insurance_evidence (id, organization_id, category, evidence_description, evidence_status, document_reference, collected_at, renewal_date, notes, evidence_type, title, status, coverage_area, insurance_provider, policy_number, expiry_date, last_verified_at, created_by) values
  ('81950000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'malpractice', 'Clinical malpractice policy', 'collected', 'https://example.invalid/docs/hv-malpractice.pdf', now() - interval '30 days', '2026-10-01', 'Renewal in October.', 'malpractice', 'Clinical Malpractice', 'active', 'US', 'MedGuard Mutual', 'POL-HV-003', '2026-10-01', now() - interval '30 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81950000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'property', 'Store property insurance', 'needed', null, null, '2026-09-15', 'Awaiting certificate.', 'property', 'Property Insurance', 'needed', 'US', 'Retail Shield', 'POL-BL-004', '2026-09-15', null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.ai_policies (id, organization_id, title, content, approved_tools, data_handling_rules, employee_guidance, status, approved_by, approved_at, created_by) values
  ('81960000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview AI Policy', 'AI usage for clinical staff.', '{copilot}'::text[], 'No PHI in AI tools.', 'Never enter patient data into AI.', 'published', 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '45 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81960000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline AI Policy', 'AI usage for retail analytics.', '{copilot,chatgpt}'::text[], 'No customer payment data.', 'Redact payment data before use.', 'published', 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '20 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.knowledge_articles (id, organization_id, title, content, category, tags, is_published, view_count, helpful_count, not_helpful_count, created_by) values
  ('81970000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Resetting the patient portal password', 'Steps to reset a patient portal password.', 'support', '{portal,password}', true, 88, 80, 8, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81970000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Handling a POS transaction failure', 'Steps for staff when a POS transaction fails.', 'retail', '{pos,transactions}', true, 65, 60, 5, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81970000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Enrolling in the zero trust gateway', 'Advisor enrollment steps.', 'security', '{ztg,onboarding}', true, 40, 37, 3, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.training_modules (id, organization_id, title, description, category, duration_minutes, is_required, completion_count, status, created_by) values
  ('81980000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA Privacy Basics', 'HIPAA privacy training for all staff.', 'compliance', 45, true, 105, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81980000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'PCI Awareness', 'Payment card data awareness.', 'compliance', 25, true, 40, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81980000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Security Essentials', 'Security essentials for advisors.', 'security', 30, true, 52, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.phishing_campaigns (id, organization_id, campaign_name, target_count, opened_count, clicked_count, reported_count, started_at, ended_at, notes, status, created_by) values
  ('81990000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Q2 Phish Test', 120, 80, 12, 9, now() - interval '12 days', now() - interval '5 days', '12 clicked - training assigned.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81990000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Q2 Phish Test', 60, 42, 6, 5, now() - interval '8 days', null, '6 clicked - in progress.', 'in_progress', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81990000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Q2 Phish Test', 40, 30, 3, 4, now() - interval '6 days', now() - interval '1 day', '3 clicked - complete.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.cyber_scorecards (id, organization_id, category, score, max_score, badge, last_updated) values
  ('82000000-0000-0000-0000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Compliance', 90, 100, 'Strong', now() - interval '4 days'),
  ('82000000-0000-0000-0000-000000000005'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Security', 80, 100, 'Strong', now() - interval '3 days'),
  ('82000000-0000-0000-0000-000000000006'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Security', 91, 100, 'Strong', now() - interval '3 days')
on conflict (id) do nothing;

insert into public.automation_workflows (id, organization_id, name, description, script_type, trigger_type, is_active, last_run_at, last_run_status, run_count, created_by) values
  ('82010000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR backup verification', 'Verifies EHR backups automatically.', 'powershell', 'schedule', true, now() - interval '2 days', 'success', 45, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82010000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store config drift check', 'Checks store configs for drift.', 'powershell', 'schedule', true, now() - interval '1 day', 'warning', 30, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.powershell_scripts (id, organization_id, name, script_content, policy_checked, approval_required, approved_by, approved_at, status, created_by) values
  ('82020000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Test-EHRBackup', 'Script body here.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '40 days', 'approved', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82020000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Compare-StoreConfig', 'Script body here.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '25 days', 'approved', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.kb_article_generations (id, organization_id, source_ticket_id, source_title, generated_content, reviewed_content, status, reviewed_by, reviewed_at, created_by) values
  ('82030000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '52700000-0000-0000-0000-000000000005'::uuid, 'Certificate warning', 'Draft KB for certificate warnings.', 'Reviewed.', 'approved', 'd4000000-0000-4000-8000-000000000003'::uuid, now() - interval '1 day', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82030000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, '52700000-0000-0000-0000-000000000007'::uuid, 'Gift card printer offline', 'Draft KB for printer issues.', null, 'draft', null, null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.sharepoint_plans (id, organization_id, site_name, team_name, structure_type, owner, sensitivity_label, external_sharing, notes, status, created_by) values
  ('82040000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Ops', 'Clinical Team', 'team_site', 'IT Director', 'Confidential', 'disabled', 'Clinical site planned.', 'planned', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82040000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Ops', 'Store Team', 'team_site', 'VP of IT', 'General', 'disabled', 'Store site planned.', 'planned', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.device_profiles (id, organization_id, profile_name, device_type, os, settings, description, status, created_by) values
  ('82050000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Standard', 'workstation', 'Windows 11', jsonb_build_object('screen_lock_minutes', 2), 'Clinical PC profile with strict lock.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82050000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Standard', 'pos', 'Windows 10 IoT', jsonb_build_object('allow_list_only', true), 'POS profile with app allow-listing.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82050000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Standard', 'laptop', 'Windows 11', jsonb_build_object('bitlocker_required', true), 'Advisor laptop profile.', 'active', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.saas_audits (id, organization_id, vendor_name, service_name, monthly_cost, annual_cost, payment_method, classification, usage_frequency, cancellation_risk, has_data_access, renewal_date, notes, created_by) values
  ('82060000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Cloud', 'EHR Platform', 8900.00, 106800.00, 'invoice', 'critical', 'daily', 'high', true, '2026-12-31', 'Critical clinical system.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82060000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Analytics', 'Retail analytics', 650.00, 7800.00, 'credit_card', 'core', 'daily', 'medium', true, '2026-09-30', 'Renewal approaching.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82060000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor CRM', 'CRM Platform', 1200.00, 14400.00, 'invoice', 'critical', 'daily', 'high', true, '2027-01-15', 'Critical CRM.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.procurement_quotes (id, organization_id, vendor_name, product, quote_amount, competitor_quote, comparison_notes, selected, purchased_at, notes, created_by) values
  ('82070000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HPE', 'ProLiant DL380', 12500.00, 12900.00, 'HPE recommended for clinical.', true, now() - interval '15 days', 'EHR host expansion.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82070000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'NCR', 'POS terminals (10)', 24000.00, 25100.00, 'NCR recommended.', false, null, 'Store refresh pending.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dns_change_requests (id, organization_id, domain, change_type, change_description, proposed_value, current_value, status, approved_by, implemented_at, created_by) values
  ('82080000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', 'cname', 'Add patient portal CNAME.', 'portal.harborview.example -> edge.example', 'none', 'approved', 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '1 day', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82080000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', 'txt', 'Add DMARC record.', 'v=DMARC1; p=quarantine;', 'none', 'pending', null, null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.custom_forms (id, organization_id, form_name, form_description, form_fields, is_active, submission_count, created_by) values
  ('82090000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Access Request', 'Request clinical system access.', '[{"key": "department", "label": "Department", "type": "text"}]'::jsonb, true, 6, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82090000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Issue Report', 'Report a store issue.', '[{"key": "store", "label": "Store", "type": "text"}]'::jsonb, true, 11, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82090000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Equipment Request', 'Request advisor equipment.', '[{"key": "item", "label": "Item", "type": "text"}]'::jsonb, true, 4, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.client_runbooks (id, organization_id, title, content, category, version, status, last_reviewed_at, next_review_at, created_by) values
  ('82100000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Ops Runbook', 'Operations runbook for Harborview.', 'healthcare', '1.3', 'published', now() - interval '12 days', now() + interval '78 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82100000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Ops Runbook', 'Operations runbook for Brightline.', 'retail', '1.0', 'draft', null, null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82100000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Ops Runbook', 'Operations runbook for Summit.', 'finance', '1.2', 'published', now() - interval '8 days', now() + interval '82 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.budget_roadmaps (id, organization_id, item_name, category, estimated_cost, fiscal_year, quarter, priority, status, notes, created_by) values
  ('82110000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical EDR Expansion', 'security', 22000.00, 2027, 1, 'high', 'approved', 'Approved.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82110000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 12 Refresh', 'hardware', 24000.00, 2026, 4, 'high', 'in_progress', 'In progress.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82110000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero Trust Expansion', 'security', 18000.00, 2027, 2, 'medium', 'planned', 'Planned.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dynamic_client_forms (id, organization_id, title, description, form_type, status, fields, settings, published_at, closes_at, created_by) values
  ('82120000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical System Access', 'Request clinical system access.', 'access_request', 'published', '[{"key": "system", "label": "System", "type": "select", "options": ["EHR", "PACS", "Pharmacy"]}]'::jsonb, jsonb_build_object('require_login', true), now() - interval '8 days', now() + interval '22 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82120000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store System Access', 'Request store system access.', 'access_request', 'published', '[{"key": "store", "label": "Store", "type": "text"}]'::jsonb, jsonb_build_object(), now() - interval '4 days', null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82120000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Onboarding Form', 'Advisor onboarding checklist.', 'onboarding', 'draft', '[{"key": "advisor", "label": "Advisor", "type": "text"}]'::jsonb, jsonb_build_object(), null, null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dynamic_form_submissions (id, form_id, organization_id, respondent_id, respondent_email, answers, status, submitted_at) values
  ('82130000-0000-0000-0000-000000000003'::uuid, '82120000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000004'::uuid, 'tom@harborview.example', jsonb_build_object('system', 'PACS'), 'submitted', now() - interval '3 days'),
  ('82130000-0000-0000-0000-000000000004'::uuid, '82120000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000004'::uuid, 'liam@brightline.example', jsonb_build_object('store', 'Store 42'), 'submitted', now() - interval '2 days')
on conflict (id) do nothing;

insert into public.score_history (id, organization_id, category, score, recorded_at) values
  ('82140000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Compliance', 85, now() - interval '15 days'),
  ('82140000-0000-0000-0000-000000000006'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Compliance', 90, now() - interval '4 days'),
  ('82140000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Security', 78, now() - interval '12 days'),
  ('82140000-0000-0000-0000-000000000008'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Security', 80, now() - interval '3 days'),
  ('82140000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Security', 89, now() - interval '10 days'),
  ('82140000-0000-0000-0000-000000000010'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Security', 91, now() - interval '3 days')
on conflict (id) do nothing;

insert into public.badges_earned (id, organization_id, badge_name, category, earned_at, points) values
  ('82150000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Compliance Leader', 'compliance', now() - interval '30 days', 200),
  ('82150000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Security Improver', 'security', now() - interval '18 days', 120),
  ('82150000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero Trust Leader', 'security', now() - interval '12 days', 180)
on conflict (id) do nothing;

insert into public.license_allocations (id, organization_id, software_name, license_type, total_seats, used_seats, cost_per_seat, billing_cycle, last_audit_date, status, notes, created_by) values
  ('82160000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Platform', 'per_seat', 250, 240, 35.00, 'monthly', now() - interval '20 days', 'active', 'Ten seats spare.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82160000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Software', 'per_device', 50, 48, 20.00, 'monthly', now() - interval '15 days', 'active', 'Two devices spare.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82160000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor CRM', 'per_seat', 40, 38, 30.00, 'monthly', now() - interval '10 days', 'active', 'Two seats spare.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dmarc_analyses (id, organization_id, domain, dmarc_record, spf_record, dkim_record, dmarc_policy, alignment_mode, pct, overall_grade, issues, recommendations, analyzed_at, created_by) values
  ('82170000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', 'v=DMARC1; p=quarantine;', 'v=SPF1 include:_spf.example.com ~all', 'selector1', 'quarantine', 'relaxed', 100, 'A', jsonb_build_array(), jsonb_build_array('Move to reject in 60 days'), now() - interval '6 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82170000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', 'v=DMARC1; p=none;', 'v=SPF1 include:_spf.example.com ~all', 'selector1', 'none', 'relaxed', 100, 'C', jsonb_build_array('No DMARC enforcement'), jsonb_build_array('Enable quarantine policy'), now() - interval '9 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.training_courses (id, organization_id, title, description, category, difficulty, estimated_minutes, status, passing_score, created_by) values
  ('82180000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA Refresher 2026', 'Annual HIPAA refresher.', 'compliance', 'intermediate', 40, 'published', 85, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82180000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'PCI Compliance Basics', 'PCI DSS fundamentals for store staff.', 'compliance', 'beginner', 25, 'published', 80, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82180000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Phishing Defense', 'Recognizing and reporting phishing.', 'security', 'beginner', 20, 'published', 80, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.training_lessons (id, course_id, title, content, lesson_type, sort_order) values
  ('82190000-0000-0000-0000-000000000003'::uuid, '82180000-0000-0000-0000-000000000003'::uuid, 'ePHI Handling', 'Lesson content.', 'video', 1),
  ('82190000-0000-0000-0000-000000000004'::uuid, '82180000-0000-0000-0000-000000000004'::uuid, 'PAN Handling', 'Lesson content.', 'video', 1),
  ('82190000-0000-0000-0000-000000000005'::uuid, '82180000-0000-0000-0000-000000000005'::uuid, 'Spotting Phishing', 'Lesson content.', 'text', 1)
on conflict (id) do nothing;

insert into public.training_enrollments (id, course_id, user_id, status, progress_percent, completed_at, enrolled_at) values
  ('82200000-0000-0000-0000-000000000003'::uuid, '82180000-0000-0000-0000-000000000003'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'in_progress', 40, null, now() - interval '3 days'),
  ('82200000-0000-0000-0000-000000000004'::uuid, '82180000-0000-0000-0000-000000000004'::uuid, 'b2000000-0000-4000-8000-000000000004'::uuid, 'completed', 100, now() - interval '2 days', now() - interval '8 days'),
  ('82200000-0000-0000-0000-000000000005'::uuid, '82180000-0000-0000-0000-000000000005'::uuid, 'c3000000-0000-4000-8000-000000000002'::uuid, 'completed', 100, now() - interval '5 days', now() - interval '12 days')
on conflict (id) do nothing;

commit;
