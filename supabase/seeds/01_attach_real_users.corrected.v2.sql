-- =========================================================
-- FINAL ATTACH REAL USERS + CUSTOMIZED DEMO DATA
--
-- This file is fully customized to the real auth.users already
-- created in your Supabase project.
--
-- All local test accounts use the same password:
--   Password123!
-- =========================================================

begin;

-- ---------------------------------------------------------
-- ORGANIZATIONS (ensure canonical org rows exist before profiles/memberships)
-- ---------------------------------------------------------
insert into public.organizations (
  id,
  name,
  slug,
  status,
  settings
)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Acme Manufacturing', 'acme', 'approved'::public.org_status, '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Legal', 'northwind', 'approved'::public.org_status, '{}'::jsonb)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  settings = excluded.settings,
  updated_at = now();


-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------
with user_rows(user_id, email, full_name, title, phone, default_org_id, role_key, is_super_admin, demo_label) as (
  values
    ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, 'superadmin.real@mainecybertech.local', 'Julian Super Admin', 'Global Super Admin', '555-9001', '11111111-1111-1111-1111-111111111111'::uuid, 'super_admin', true, 'superadmin@mainecybertech.local'),
    ('817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, 'mspadmin.real@mainecybertech.local', 'Morgan MSP Admin', 'MSP Admin', '555-9002', '11111111-1111-1111-1111-111111111111'::uuid, 'admin', false, 'mspadmin@mainecybertech.local'),
    ('ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, 'clientadmin.real@acme.example', 'Avery Client Admin', 'Operations Director', '555-0101', '11111111-1111-1111-1111-111111111111'::uuid, 'client_admin', false, 'clientadmin@acme.example'),
    ('b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, 'technician.real@acme.example', 'Taylor Technician', 'Systems Technician', '555-0102', '11111111-1111-1111-1111-111111111111'::uuid, 'technician', false, 'technician@acme.example'),
    ('71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'user.real@acme.example', 'Casey Client User', 'Operations Coordinator', '555-0103', '11111111-1111-1111-1111-111111111111'::uuid, 'client_user', false, 'user@acme.example'),
    ('ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid, 'clientadmin.real@beta.example', 'Blake Client Admin', 'Managing Partner', '555-0201', '22222222-2222-2222-2222-222222222222'::uuid, 'client_admin', false, 'clientadmin@beta.example'),
    ('6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'user.real@beta.example', 'Jordan Client User', 'Office Manager', '555-0202', '22222222-2222-2222-2222-222222222222'::uuid, 'client_user', false, 'user@beta.example')
)
insert into public.profiles (
  id,
  email,
  full_name,
  phone,
  title,
  is_super_admin,
  default_organization_id,
  metadata
)
select
  u.user_id,
  u.email,
  u.full_name,
  u.phone,
  u.title,
  u.is_super_admin,
  u.default_org_id,
  jsonb_build_object('seeded', true, 'demo_label', u.demo_label)
from user_rows u
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  title = excluded.title,
  is_super_admin = excluded.is_super_admin,
  default_organization_id = excluded.default_organization_id,
  metadata = excluded.metadata,
  updated_at = now();

-- ---------------------------------------------------------
-- MEMBERSHIPS
-- ---------------------------------------------------------
with membership_rows(user_id, organization_id, role_key, job_title, is_billing_contact, is_security_contact) as (
  values
    ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'super_admin', 'Global Super Admin', true, true),
    ('66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'super_admin', 'Global Super Admin', true, true),
    ('817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'admin', 'MSP Admin', true, true),
    ('817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'admin', 'MSP Admin', true, true),
    ('ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'client_admin', 'Client Admin', true, true),
    ('b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'technician', 'Technician', false, true),
    ('71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'client_user', 'Client User', false, false),
    ('ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'client_admin', 'Client Admin', true, true),
    ('6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'client_user', 'Client User', false, false)
)
insert into public.memberships (
  organization_id,
  user_id,
  role_id,
  status,
  approved_by,
  approved_at,
  job_title,
  is_billing_contact,
  is_security_contact
)
select
  m.organization_id,
  m.user_id,
  r.id,
  'approved'::public.membership_status,
  '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid,
  now(),
  m.job_title,
  m.is_billing_contact,
  m.is_security_contact
from membership_rows m
join public.roles r on r.key = m.role_key
on conflict (organization_id, user_id) do update
set
  role_id = excluded.role_id,
  status = excluded.status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  job_title = excluded.job_title,
  is_billing_contact = excluded.is_billing_contact,
  is_security_contact = excluded.is_security_contact,
  updated_at = now();

-- ---------------------------------------------------------
-- NOTIFICATION PREFERENCES
-- ---------------------------------------------------------
insert into public.notification_preferences (
  organization_id,
  user_id,
  module_key,
  channel,
  enabled
)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, 'tickets', 'email', true),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, 'projects', 'in_app', true),
  ('11111111-1111-1111-1111-111111111111'::uuid, '71d23f2a-39b9-42f7-9ddc-115ac45ef12e'::uuid, 'documents', 'in_app', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid, 'documents', 'email', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid, 'tickets', 'in_app', true),
  ('11111111-1111-1111-1111-111111111111'::uuid, '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, 'billing', 'email', true)
on conflict (organization_id, user_id, module_key, channel) do update
set enabled = excluded.enabled;

-- ---------------------------------------------------------
-- ONBOARDING
-- ---------------------------------------------------------
insert into public.onboarding_submissions (
  id,
  organization_id,
  submitted_by,
  status,
  progress_percent,
  company_profile,
  contacts,
  technical_environment,
  service_requirements,
  security_requirements,
  uploaded_artifacts,
  submitted_at
)
values
  (
    '51000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'submitted',
    100,
    jsonb_build_object('employee_count', 85, 'hq', 'Portland, ME'),
    jsonb_build_array(jsonb_build_object('name', 'Avery Client Admin', 'email', 'clientadmin.real@acme.example')),
    jsonb_build_object('m365', true, 'endpoint_count', 92),
    jsonb_build_object('services', jsonb_build_array('managed-it', 'soc', 'backup')),
    jsonb_build_object('mfa_required', true, 'edr', true),
    jsonb_build_array(jsonb_build_object('name', 'network-diagram.pdf')),
    now() - interval '14 days'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- TICKETS + COMMENTS
-- ---------------------------------------------------------
insert into public.tickets (
  id, organization_id, created_by, assigned_to, title, description, status, priority, category, source, metadata
)
values
  (
    '52000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'VPN access intermittently drops',
    'Users report disconnects when working remotely.',
    'in_progress',
    'high',
    'network',
    'portal',
    jsonb_build_object('seeded', true)
  ),
  (
    '52000000-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '6adfefa6-27c2-480e-9881-6514f4e9b708'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'Need new user onboarding checklist',
    'Please prepare a checklist for our new paralegal hire.',
    'new',
    'normal',
    'process',
    'portal',
    jsonb_build_object('seeded', true)
  )
on conflict (id) do nothing;

insert into public.ticket_comments (
  id, ticket_id, organization_id, author_id, body, is_internal
)
values
  (
    '52100000-0000-0000-0000-000000000001'::uuid,
    '52000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'Reviewed firewall logs and suspect ISP edge instability.',
    true
  ),
  (
    '52100000-0000-0000-0000-000000000002'::uuid,
    '52000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'Thanks — keep me posted after the circuit check.',
    false
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- PROJECTS / TASKS / UPDATES / COMMENTS
-- ---------------------------------------------------------
insert into public.projects (
  id, organization_id, created_by, owner_id, name, description, status, priority, start_date, due_date, starts_at, due_at, progress_percent, metadata
)
values
  (
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'Quarterly Security Hardening',
    'Roll out MFA enforcement, BitLocker review, and admin tiering updates.',
    'active',
    'high',
    current_date - 15,
    current_date + 20,
    now() - interval '15 days',
    now() + interval '20 days',
    55,
    jsonb_build_object('seeded', true)
  )
on conflict (id) do nothing;

insert into public.project_members (project_id, user_id, role)
values
  ('53000000-0000-0000-0000-000000000001'::uuid, 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, 'stakeholder'),
  ('53000000-0000-0000-0000-000000000001'::uuid, 'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, 'owner'),
  ('53000000-0000-0000-0000-000000000001'::uuid, '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, 'msp_admin')
on conflict (project_id, user_id) do update set role = excluded.role;

insert into public.project_tasks (
  id, project_id, organization_id, created_by, owner_id, title, description, details, status, due_date, due_at, sort_order, estimate_hours, actual_hours, approval_required, approved_by, approved_at, metadata
)
values
  (
    '53100000-0000-0000-0000-000000000001'::uuid,
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'Review MFA exclusions',
    'Audit all current MFA bypasses and emergency accounts.',
    'Validate each exception with business owner approval.',
    'in_progress',
    current_date + 3,
    now() + interval '3 days',
    10,
    6.00,
    2.50,
    false,
    null,
    null,
    jsonb_build_object('seeded', true)
  ),
  (
    '53100000-0000-0000-0000-000000000002'::uuid,
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'Approve endpoint encryption policy',
    'Client approval for updated BitLocker baseline.',
    'Confirm rollout timing with operations lead.',
    'todo',
    current_date + 7,
    now() + interval '7 days',
    20,
    1.50,
    0,
    true,
    null,
    null,
    jsonb_build_object('seeded', true)
  )
on conflict (id) do nothing;

insert into public.project_updates (
  id, project_id, organization_id, author_id, body, is_internal, is_pinned
)
values
  (
    '53200000-0000-0000-0000-000000000001'::uuid,
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'MFA review started. Initial exception list is smaller than expected.',
    false,
    true
  ),
  (
    '53200000-0000-0000-0000-000000000002'::uuid,
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'Internal note: confirm break-glass account handling before rollout.',
    true,
    false
  )
on conflict (id) do nothing;

insert into public.project_task_comments (
  id, task_id, project_id, organization_id, author_id, body, is_internal
)
values
  (
    '53300000-0000-0000-0000-000000000001'::uuid,
    '53100000-0000-0000-0000-000000000001'::uuid,
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'I have 3 accounts left to validate with department heads.',
    false
  ),
  (
    '53300000-0000-0000-0000-000000000002'::uuid,
    '53100000-0000-0000-0000-000000000002'::uuid,
    '53000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'Keep this internal until the policy language is finalized.',
    true
  )
on conflict (id) do nothing;

insert into public.project_task_comment_reads (
  user_id, task_id, organization_id, last_seen_at
)
values
  ('ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, '53100000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, now() - interval '1 hour'),
  ('b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, '53100000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, now() - interval '15 minutes'),
  ('817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, '53100000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, now() - interval '5 minutes')
on conflict (user_id, task_id) do update set last_seen_at = excluded.last_seen_at;

-- ---------------------------------------------------------
-- DOCUMENTS / VERSIONS / PERMISSIONS
-- ---------------------------------------------------------
insert into public.documents (
  id, organization_id, uploaded_by, title, name, description, file_name, folder_path, storage_bucket, storage_path, mime_type, file_size, visibility, current_version, metadata
)
values
  (
    '54000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'Acme Network Diagram',
    'Acme Network Diagram',
    'Current network and site connectivity map.',
    'acme-network-diagram.pdf',
    '/network',
    'documents',
    'orgs/11111111-1111-1111-1111-111111111111/network/acme-network-diagram-v1.pdf',
    'application/pdf',
    248000,
    'internal',
    1,
    jsonb_build_object('seeded', true)
  ),
  (
    '54000000-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
    'Beta Engagement Letter',
    'Beta Engagement Letter',
    'Client-visible engagement summary and scope.',
    'beta-engagement-letter.pdf',
    '/contracts',
    'documents',
    'orgs/22222222-2222-2222-2222-222222222222/contracts/beta-engagement-letter-v1.pdf',
    'application/pdf',
    145000,
    'org',
    1,
    jsonb_build_object('seeded', true)
  ),
  (
    '54000000-0000-0000-0000-000000000003'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'Executive Roadmap',
    'Executive Roadmap',
    'Private planning deck for leadership only.',
    'executive-roadmap.pdf',
    '/executive',
    'documents',
    'orgs/11111111-1111-1111-1111-111111111111/executive/executive-roadmap-v1.pdf',
    'application/pdf',
    99000,
    'private',
    1,
    jsonb_build_object('seeded', true)
  ),
  (
    '54000000-0000-0000-0000-000000000004'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
    'Client Welcome Guide',
    'Client Welcome Guide',
    'General portal guide for all Beta users.',
    'beta-welcome-guide.pdf',
    '/welcome',
    'documents',
    'orgs/22222222-2222-2222-2222-222222222222/welcome/beta-welcome-guide-v1.pdf',
    'application/pdf',
    87000,
    'public',
    1,
    jsonb_build_object('seeded', true)
  )
on conflict (id) do nothing;

insert into public.document_versions (
  id, document_id, version_number, storage_path, uploaded_by, checksum
)
values
  ('54100000-0000-0000-0000-000000000001'::uuid, '54000000-0000-0000-0000-000000000001'::uuid, 1, 'orgs/11111111-1111-1111-1111-111111111111/network/acme-network-diagram-v1.pdf', 'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid, 'seed-acme-diagram-v1'),
  ('54100000-0000-0000-0000-000000000002'::uuid, '54000000-0000-0000-0000-000000000002'::uuid, 1, 'orgs/22222222-2222-2222-2222-222222222222/contracts/beta-engagement-letter-v1.pdf', 'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid, 'seed-beta-engagement-v1')
on conflict (id) do nothing;

insert into public.document_permissions (
  id, document_id, user_id, role_id, can_view, can_edit, can_share
)
values
  ('54200000-0000-0000-0000-000000000001'::uuid, '54000000-0000-0000-0000-000000000003'::uuid, '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid, null, true, true, true),
  ('54200000-0000-0000-0000-000000000002'::uuid, '54000000-0000-0000-0000-000000000003'::uuid, 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid, null, true, false, false),
  ('54200000-0000-0000-0000-000000000003'::uuid, '54000000-0000-0000-0000-000000000004'::uuid, null, (select id from public.roles where key = 'client_user' limit 1), true, false, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- CONTRACTS / SIGNERS
-- ---------------------------------------------------------
insert into public.contracts (
  id, organization_id, created_by, document_id, title, status, external_signature_provider, external_envelope_id, effective_date, expiration_date
)
values
  (
    '55000000-0000-0000-0000-000000000001'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
    '54000000-0000-0000-0000-000000000002'::uuid,
    'Beta Legal Managed Services Agreement',
    'pending_signature',
    'docusign',
    'env_seed_beta_001',
    current_date,
    current_date + 365
  )
on conflict (id) do nothing;

insert into public.contract_signers (
  id, contract_id, user_id, email, signer_name, signing_order, signed_at, status
)
values
  (
    '55100000-0000-0000-0000-000000000001'::uuid,
    '55000000-0000-0000-0000-000000000001'::uuid,
    'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
    'clientadmin.real@beta.example',
    'Blake Client Admin',
    1,
    null,
    'pending'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- APPOINTMENTS
-- ---------------------------------------------------------
insert into public.appointments (
  id, organization_id, created_by, owner_id, title, description, starts_at, ends_at, location, meeting_url, type
)
values
  (
    '56000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'b0a65dea-16c7-4f54-8192-d9267a4219d1'::uuid,
    'Security Review Meeting',
    'Weekly hardening project review.',
    now() + interval '2 days',
    now() + interval '2 days 1 hour',
    'Teams',
    'https://example.invalid/meet/security-review',
    'meeting'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- CHAT
-- ---------------------------------------------------------
insert into public.chat_threads (
  id, organization_id, created_by, title, status
)
values
  (
    '57000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'Open items for MFA rollout',
    'open'
  )
on conflict (id) do nothing;

insert into public.chat_messages (
  id, thread_id, organization_id, author_id, body, is_bot
)
values
  (
    '57100000-0000-0000-0000-000000000001'::uuid,
    '57000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ef0370d6-0da8-43a1-8f24-d8c4f19448a0'::uuid,
    'Please post the current list of excluded accounts here for review.',
    false
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- AUDIT
-- ---------------------------------------------------------
insert into public.audit_logs (
  id, organization_id, actor_user_id, actor_type, action, entity_type, entity_id, metadata
)
values
  (
    '58000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '817016dc-cc3b-49d1-8ee6-637f880fa0a4'::uuid,
    'user',
    'seed.projects.created',
    'project',
    '53000000-0000-0000-0000-000000000001',
    jsonb_build_object('seeded', true)
  ),
  (
    '58000000-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'ebc615c1-6c95-46a6-9bf1-68a4af87b1d8'::uuid,
    'user',
    'seed.documents.created',
    'document',
    '54000000-0000-0000-0000-000000000004',
    jsonb_build_object('seeded', true)
  )
on conflict (id) do nothing;

commit;
