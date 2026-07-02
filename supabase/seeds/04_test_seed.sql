-- 04_test_seed.sql
-- Comprehensive test seed data for all features.
-- Adds Jira/JSM integration fields, branding, webhooks, notifications, overrides.
-- LOCAL / DEV ONLY.

begin;

-- =========================================================
-- ORGANIZATION BRANDING
-- =========================================================
update public.organizations
set
  logo_url = null,
  brand_color = '#059669',
  accent_color = '#0D9488',
  custom_domain = 'portal.acme.mainecybertech.com'
where id = '11111111-1111-1111-1111-111111111111'::uuid;

update public.organizations
set
  logo_url = null,
  brand_color = '#2563EB',
  accent_color = '#7C3AED',
  custom_domain = 'portal.northwind.mainecybertech.com'
where id = '22222222-2222-2222-2222-222222222222'::uuid;

-- =========================================================
-- TICKETS — Add JSM fields to existing tickets
-- =========================================================
update public.tickets
set
  external_jsm_issue_key = 'HELPDESK-42',
  labels = '{network,vpn,connectivity}',
  resolution = null,
  jira_last_synced_at = now()
where id = '52000000-0000-0000-0000-000000000001'::uuid;

update public.tickets
set
  external_jsm_issue_key = 'HELPDESK-57',
  labels = '{onboarding,process}',
  resolution = null,
  jira_last_synced_at = now()
where id = '52000000-0000-0000-0000-000000000002'::uuid;

-- Add JSM ticket with resolution (closed/resolved)
insert into public.tickets (
  id, organization_id, created_by, assigned_to, title, description, status, priority, category, source, external_jsm_issue_key, labels, resolution, jira_last_synced_at, metadata
)
values (
  '52000000-0000-0000-0000-000000000003'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
  'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
  'Password reset portal not sending emails',
  'Users cannot reset their passwords via the portal.',
  'resolved',
  'urgent',
  'security',
  'jsm',
  'HELPDESK-58',
  '{password,auth,security}',
  'Fixed',
  now() - interval '3 days',
  jsonb_build_object('seeded', true, 'resolution_notes', 'SMTP relay was misconfigured. Now fixed and verified.')
) on conflict (id) do nothing;

-- =========================================================
-- PROJECTS — Add Jira fields
-- =========================================================
update public.projects
set
  external_jira_project_key = 'SEC',
  jira_last_synced_at = now()
where id = '53000000-0000-0000-0000-000000000001'::uuid;

-- Add a second project with Jira key for org 2
insert into public.projects (
  id, organization_id, created_by, owner_id, name, description, status, priority, starts_at, due_at, progress_percent, external_jira_project_key, jira_last_synced_at, metadata
)
values (
  '53000000-0000-0000-0000-000000000002'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
  'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
  'Infrastructure Migration',
  'Migrate on-prem file servers to SharePoint Online.',
  'active',
  'high',
  now() - interval '5 days',
  now() + interval '30 days',
  25,
  'INFRA',
  now(),
  jsonb_build_object('seeded', true)
) on conflict (id) do nothing;

-- project_members table removed in migration 5302055
-- insert into public.project_members (project_id, user_id, role) values (...);

-- =========================================================
-- TASKS — Add Jira fields to existing tasks
-- =========================================================
update public.project_tasks
set
  external_jira_issue_key = 'SEC-101',
  issue_type = 'Task',
  priority = 'high',
  labels = '{mfa,security,exceptions}',
  epic_key = 'SEC-50',
  sprint = 'Sprint 12',
  resolution = null,
  jira_last_synced_at = now()
where id = '53100000-0000-0000-0000-000000000001'::uuid;

update public.project_tasks
set
  external_jira_issue_key = 'SEC-102',
  issue_type = 'Story',
  priority = 'normal',
  labels = '{encryption,policy}',
  epic_key = 'SEC-51',
  sprint = 'Sprint 12',
  resolution = null,
  jira_last_synced_at = now()
where id = '53100000-0000-0000-0000-000000000002'::uuid;

-- Add tasks for the second project
insert into public.project_tasks (
  id, project_id, organization_id, created_by, owner_id, title, description, details, status, due_at, sort_order, estimate_hours, external_jira_issue_key, issue_type, priority, labels, epic_key, sprint, metadata
)
values
  (
    '53100000-0000-0000-0000-000000000003'::uuid,
    '53000000-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'SharePoint site provisioning',
    'Create and configure SharePoint sites for all departments.',
    'Follow the migration template in the project wiki.',
    'in_progress',
    now() + interval '10 days',
    10,
    16.00,
    'INFRA-201',
    'Task',
    'high',
    '{sharepoint,migration,teams}',
    'INFRA-100',
    'Sprint 1',
    jsonb_build_object('seeded', true)
  ),
  (
    '53100000-0000-0000-0000-000000000004'::uuid,
    '53000000-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
    'Approve migration timeline',
    'Client to sign off on the proposed migration schedule.',
    'Review the migration phases document before approving.',
    'todo',
    now() + interval '5 days',
    5,
    2.00,
    'INFRA-202',
    'Story',
    'normal',
    '{approval,planning}',
    'INFRA-100',
    'Sprint 1',
    jsonb_build_object('seeded', true, 'approval_required', true)
  )
on conflict (id) do nothing;

-- =========================================================
-- NOTIFICATIONS — Seed in-app notifications
-- =========================================================
insert into public.notifications (user_id, organization_id, title, body, module, module_id, action, read, created_at)
values
  ('ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Ticket Updated', 'Your ticket "VPN access intermittently drops" has been updated.', 'tickets', '52000000-0000-0000-0000-000000000001', 'updated', false, now() - interval '2 hours'),
  ('ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'New Comment', 'Taylor Technician added a comment to your ticket.', 'tickets', '52000000-0000-0000-0000-000000000001', 'comment', false, now() - interval '1 hour'),
  ('ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Task Assigned', 'You have been assigned "Approve migration timeline".', 'projects', '53100000-0000-0000-0000-000000000004', 'assigned', false, now() - interval '30 minutes'),
  ('817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Invoice Overdue', 'Invoice MCT-ACME-1001 is now overdue.', 'billing', null, 'overdue', true, now() - interval '5 days'),
  ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, null, 'System Maintenance', 'Scheduled maintenance on Sunday 2AM-4AM EST.', 'system', null, 'updated', false, now() - interval '1 day'),
  ('b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Task Due Soon', '"Review MFA exclusions" is due in 3 days.', 'projects', '53100000-0000-0000-0000-000000000001', 'due_soon', false, now() - interval '6 hours')
on conflict do nothing;

-- =========================================================
-- WEBHOOK ENDPOINTS — Seed a sample webhook
-- =========================================================
insert into public.webhook_endpoints (
  id, organization_id, name, url, secret, events, is_active, created_by
)
values (
  '60000000-0000-0000-0000-000000000001'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Slack Notifications',
  'https://hooks.slack.com/services/T00/B00/xxxxxxxx',
  'whsec_example_secret',
  '{ticket.created,ticket.updated,ticket.assigned,project.created}',
  true,
  '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid
) on conflict (id) do nothing;

-- =========================================================
-- WEBHOOK DELIVERIES — Seed delivery log entries
-- =========================================================
insert into public.webhook_deliveries (
  id, webhook_id, event, status, request_body, response_status, response_body, duration_ms, created_at
)
values
  (
    '60100000-0000-0000-0000-000000000001'::uuid,
    '60000000-0000-0000-0000-000000000001'::uuid,
    'ticket.created',
    'success',
    jsonb_build_object('event', 'ticket.created', 'data', jsonb_build_object('id', '52000000-0000-0000-0000-000000000001')),
    200,
    'ok',
    245,
    now() - interval '3 days'
  ),
  (
    '60100000-0000-0000-0000-000000000002'::uuid,
    '60000000-0000-0000-0000-000000000001'::uuid,
    'ticket.updated',
    'success',
    jsonb_build_object('event', 'ticket.updated'),
    200,
    'ok',
    180,
    now() - interval '1 day'
  ),
  (
    '60100000-0000-0000-0000-000000000003'::uuid,
    '60000000-0000-0000-0000-000000000001'::uuid,
    'project.created',
    'failed',
    jsonb_build_object('event', 'project.created'),
    500,
    'Internal Server Error',
    3000,
    now() - interval '12 hours'
  )
on conflict (id) do nothing;

-- Update webhook with last delivery info
update public.webhook_endpoints
set
  last_success_at = now() - interval '1 day',
  last_failure_at = now() - interval '12 hours',
  last_error = 'HTTP 500'
where id = '60000000-0000-0000-0000-000000000001'::uuid;

-- =========================================================
-- USER PERMISSION OVERRIDES — Seed example override
-- =========================================================
do $$
declare
  v_permission_id uuid;
begin
  -- Grant technician the ability to manage billing (override)
  select id into v_permission_id from public.permissions
  where module_key = 'billing' and action_key = 'manage' limit 1;

  if v_permission_id is not null then
    insert into public.user_permission_overrides (
      organization_id, user_id, permission_id, is_allowed
    )
    values (
      '11111111-1111-1111-1111-111111111111'::uuid,
      'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
      v_permission_id,
      true
    )
    on conflict (organization_id, user_id, permission_id) do update
    set is_allowed = excluded.is_allowed;
  end if;
end $$;

-- =========================================================
-- NOTIFICATION PREFERENCES — Add more preference rows
-- =========================================================
insert into public.notification_preferences (organization_id, user_id, module_key, channel, enabled)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, 'tickets', 'email', true),
  ('11111111-1111-1111-1111-111111111111'::uuid, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, 'tickets', 'in_app', true),
  ('11111111-1111-1111-1111-111111111111'::uuid, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, 'billing', 'email', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, 'projects', 'email', false),
  ('22222222-2222-2222-2222-222222222222'::uuid, '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, 'projects', 'in_app', true)
on conflict (organization_id, user_id, module_key, channel) do update
set enabled = excluded.enabled;

-- =========================================================
-- NOTIFICATION PREFERENCES — Add disabled preferences to test toggles
-- =========================================================
insert into public.notification_preferences (organization_id, user_id, module_key, channel, enabled)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, 'billing', 'email', false),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, 'documents', 'in_app', false)
on conflict (organization_id, user_id, module_key, channel) do update
set enabled = excluded.enabled;

-- =========================================================
-- DOCUMENTS — Add a document with version history
-- =========================================================
insert into public.documents (
  id, organization_id, uploaded_by, title, name, description, file_name, folder_path, storage_bucket, storage_path, mime_type, file_size, visibility, current_version, metadata
)
values (
  '54000000-0000-0000-0000-000000000005'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
  'Security Policy v3',
  'Security Policy v3',
  'Updated information security policy document approved by leadership.',
  'security-policy-v3.pdf',
  '/policies',
  'documents',
  'orgs/11111111-1111-1111-1111-111111111111/policies/security-policy-v3.pdf',
  'application/pdf',
  512000,
  'org',
  3,
  jsonb_build_object('seeded', true, 'version_history', true)
) on conflict (id) do nothing;

-- Multiple versions for the same document
insert into public.document_versions (id, document_id, version_number, storage_path, uploaded_by, checksum, created_at)
values
  ('54100000-0000-0000-0000-000000000003'::uuid, '54000000-0000-0000-0000-000000000005'::uuid, 1, 'orgs/11111111-1111-1111-1111-111111111111/policies/security-policy-v1.pdf', '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, 'sha256-v1', now() - interval '30 days'),
  ('54100000-0000-0000-0000-000000000004'::uuid, '54000000-0000-0000-0000-000000000005'::uuid, 2, 'orgs/11111111-1111-1111-1111-111111111111/policies/security-policy-v2.pdf', 'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, 'sha256-v2', now() - interval '15 days'),
  ('54100000-0000-0000-0000-000000000005'::uuid, '54000000-0000-0000-0000-000000000005'::uuid, 3, 'orgs/11111111-1111-1111-1111-111111111111/policies/security-policy-v3.pdf', 'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, 'sha256-v3', now() - interval '1 day')
on conflict (id) do nothing;

commit;
