-- =========================================================
-- 06_comprehensive_module_data.sql
-- Comprehensive module data for every admin/portal section
-- that seeds 00-05 did not cover. Adds 5 new users (password: 1)
-- that fill role/permission edge-case gaps (embedded technician,
-- suspended client admin, allow-override, deny-override, core-org
-- client admin) plus realistic rows across ALL 5 tenants for the
-- ~60 module tables (security suite, field services, governance,
-- edu automation, store conversion, uptime/status, etc.).
--
-- LOCAL / DEV ONLY.
--
-- IMPORTANT: All test accounts use the password: 1
-- (matches seeds 00/01/05). Every insert is idempotent
-- (on conflict ... do nothing).
--
-- Tables deliberately NOT inserted here (seeded elsewhere or
-- dropped by 5302055_cleanup_dead_tables.sql): appointments,
-- chat_messages, chat_threads, comments, contracts,
-- contract_signers, document_permissions (NO - restored by
-- 5302110, so it IS seeded here), onboarding_submissions,
-- project_members. document_permissions is restored and seeded.
-- =========================================================

begin;

-- =========================================================
-- 0. NEW USERS (5 accounts, password: 1)
--    f1000000-...-001 Dani Calderon   - embedded technician @ Harborview
--    f1000000-...-002 Ravi Mehta      - client_admin @ Brightline (suspended)
--    f1000000-...-003 Grace Liu       - client_user  @ Summit + allow documents:delete
--    f1000000-...-004 Omar Farouk     - client_admin @ Acme (core org)
--    f1000000-...-005 Nora Berg       - client_user  @ Northwind + deny tickets:create
-- =========================================================
delete from auth.identities
where user_id in (
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000004',
  'f1000000-0000-4000-8000-000000000005'
)
   or provider_id in (
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000004',
  'f1000000-0000-4000-8000-000000000005'
)
   or id in (
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002',
  'f1000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000004',
  'f1000000-0000-4000-8000-000000000005'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at,
  confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
  email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
  email_change_token_current, email_change_confirm_status, banned_until,
  reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
)
values
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'dani.calderon@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-02 08:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-02 08:00:00+00', '2026-08-02 08:00:00+00', '555-0701', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ravi.mehta@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-02 08:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-02 08:05:00+00', '2026-08-02 08:05:00+00', '555-0702', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'grace.liu@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-02 08:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-02 08:10:00+00', '2026-08-02 08:10:00+00', '555-0703', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'omar.farouk@acme.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-02 08:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-02 08:15:00+00', '2026-08-02 08:15:00+00', '555-0704', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'nora.berg@northwind.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-02 08:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-02 08:20:00+00', '2026-08-02 08:20:00+00', '555-0705', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
on conflict (id) do update
set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at,
  phone = excluded.phone;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
values
  ('f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', '{"sub": "f1000000-0000-4000-8000-000000000001", "email": "dani.calderon@harborview.example", "email_verified": true}'::jsonb, 'email', 'f1000000-0000-4000-8000-000000000001', NULL, '2026-08-02 08:00:00+00', '2026-08-02 08:00:00+00'),
  ('f1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', '{"sub": "f1000000-0000-4000-8000-000000000002", "email": "ravi.mehta@brightline.example", "email_verified": true}'::jsonb, 'email', 'f1000000-0000-4000-8000-000000000002', NULL, '2026-08-02 08:05:00+00', '2026-08-02 08:05:00+00'),
  ('f1000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', '{"sub": "f1000000-0000-4000-8000-000000000003", "email": "grace.liu@summit.example", "email_verified": true}'::jsonb, 'email', 'f1000000-0000-4000-8000-000000000003', NULL, '2026-08-02 08:10:00+00', '2026-08-02 08:10:00+00'),
  ('f1000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', '{"sub": "f1000000-0000-4000-8000-000000000004", "email": "omar.farouk@acme.example", "email_verified": true}'::jsonb, 'email', 'f1000000-0000-4000-8000-000000000004', NULL, '2026-08-02 08:15:00+00', '2026-08-02 08:15:00+00'),
  ('f1000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005', '{"sub": "f1000000-0000-4000-8000-000000000005", "email": "nora.berg@northwind.example", "email_verified": true}'::jsonb, 'email', 'f1000000-0000-4000-8000-000000000005', NULL, '2026-08-02 08:20:00+00', '2026-08-02 08:20:00+00')
on conflict (id) do nothing;

insert into public.profiles (
  id, email, full_name, phone, title, is_super_admin, default_organization_id, metadata
)
select
  u.user_id, u.email, u.full_name, u.phone, u.title, u.is_super_admin, u.default_org_id,
  jsonb_build_object('seeded', true, 'demo_label', u.demo_label)
from (
  values
    ('f1000000-0000-4000-8000-000000000001'::uuid, 'dani.calderon@harborview.example', 'Dani Calderon', '555-0701', 'On-Site Engineer', false, '33333333-3333-4333-8333-333333333333'::uuid, 'dani@harborview.example'),
    ('f1000000-0000-4000-8000-000000000002'::uuid, 'ravi.mehta@brightline.example', 'Ravi Mehta', '555-0702', 'IT Manager (Suspended)', false, '44444444-4444-4444-8444-444444444444'::uuid, 'ravi@brightline.example'),
    ('f1000000-0000-4000-8000-000000000003'::uuid, 'grace.liu@summit.example', 'Grace Liu', '555-0703', 'Compliance Associate', false, '55555555-5555-4555-8555-555555555555'::uuid, 'grace@summit.example'),
    ('f1000000-0000-4000-8000-000000000004'::uuid, 'omar.farouk@acme.example', 'Omar Farouk', '555-0704', 'IT Coordinator', false, '11111111-1111-1111-1111-111111111111'::uuid, 'omar@acme.example'),
    ('f1000000-0000-4000-8000-000000000005'::uuid, 'nora.berg@northwind.example', 'Nora Berg', '555-0705', 'Logistics Analyst', false, '22222222-2222-2222-2222-222222222222'::uuid, 'nora@northwind.example')
) as u(user_id, email, full_name, phone, title, is_super_admin, default_org_id, demo_label)
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

with membership_rows(user_id, organization_id, role_key, status, job_title, is_billing_contact, is_security_contact) as (
  values
    ('f1000000-0000-4000-8000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'technician', 'approved', 'On-Site Engineer', false, true),
    ('f1000000-0000-4000-8000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'client_admin', 'suspended', 'IT Manager (Suspended)', true, true),
    ('f1000000-0000-4000-8000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'approved', 'Compliance Associate', false, false),
    ('f1000000-0000-4000-8000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'client_admin', 'approved', 'IT Coordinator', true, true),
    ('f1000000-0000-4000-8000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'client_user', 'approved', 'Logistics Analyst', false, false)
)
insert into public.memberships (
  organization_id, user_id, role_id, status, approved_by, approved_at, job_title,
  is_billing_contact, is_security_contact
)
select
  m.organization_id, m.user_id, r.id, m.status::public.membership_status,
  '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid,
  case when m.status = 'approved' then now() else null end,
  m.job_title, m.is_billing_contact, m.is_security_contact
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

-- User permission overrides (edge cases: allow documents:delete, deny tickets:create)
insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '55555555-5555-4555-8555-555555555555'::uuid, 'f1000000-0000-4000-8000-000000000003'::uuid, p.id, true
from public.permissions p where p.module_key = 'documents' and p.action_key = 'delete'
on conflict (organization_id, user_id, permission_id) do nothing;

insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, p.id, false
from public.permissions p where p.module_key = 'tickets' and p.action_key = 'create'
on conflict (organization_id, user_id, permission_id) do nothing;

-- =========================================================
-- 1. PORTAL MODULE SETTINGS
-- =========================================================
insert into public.portal_module_settings (id, organization_id, module_key, settings) values
  ('81010000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'documents', jsonb_build_object('default_visibility', 'org', 'allow_upload', true)),
  ('81010000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'tickets', jsonb_build_object('show_status_pills', true)),
  ('81010000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'documents', jsonb_build_object('default_visibility', 'org', 'allow_upload', true)),
  ('81010000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'training', jsonb_build_object('require_completion', true)),
  ('81010000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'tickets', jsonb_build_object('show_status_pills', true))
on conflict (id) do nothing;

-- =========================================================
-- 2. API KEYS (admin-managed, seeded for 3 tenants)
-- =========================================================
insert into public.api_keys (id, organization_id, name, key_hash, key_prefix, permissions, created_by, is_active, last_used_at) values
  ('81020000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Integration', 'sha256_acme_integration_seed_hash', 'mct_ack_', '["tickets:read", "tickets:write", "documents:read"]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, true, now() - interval '2 days'),
  ('81020000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Sync', 'sha256_ehr_sync_seed_hash', 'mct_hv_', '["tickets:read", "tickets:write"]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, true, now() - interval '6 hours'),
  ('81020000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Gateway', 'sha256_pos_gateway_seed_hash', 'mct_bl_', '["tickets:read"]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, false, now() - interval '30 days')
on conflict (id) do nothing;

-- =========================================================
-- 3. WEBHOOK DEAD LETTERS (references seed-04 webhook 60000000-...-001)
-- =========================================================
insert into public.webhook_dead_letters (id, webhook_id, event, request_body, last_error, attempt_count, last_attempt_at) values
  ('81030000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, 'ticket.created', jsonb_build_object('event', 'ticket.created', 'retries', 3), 'Connection reset by peer', 3, now() - interval '1 day'),
  ('81030000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, 'ticket.updated', jsonb_build_object('event', 'ticket.updated', 'retries', 2), 'HTTP 429 Too Many Requests', 2, now() - interval '5 hours'),
  ('81030000-0000-0000-0000-000000000003'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, 'project.created', jsonb_build_object('event', 'project.created', 'retries', 5), 'Timed out after 10000ms', 5, now() - interval '2 hours')
on conflict (id) do nothing;

-- =========================================================
-- 4. DOCUMENT SHARES (external share links, refs docs 54600000-...)
-- =========================================================
insert into public.document_shares (id, document_id, organization_id, created_by, token, expires_at, access_count, max_access) values
  ('81040000-0000-0000-0000-000000000001'::uuid, '54600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'sh_seed_harbor_hipaa_001', now() + interval '14 days', 3, 10),
  ('81040000-0000-0000-0000-000000000002'::uuid, '54600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000001'::uuid, 'sh_seed_bright_store42_002', now() + interval '7 days', 1, 5),
  ('81040000-0000-0000-0000-000000000003'::uuid, '54600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, 'sh_seed_harbor_revoked_003', now() + interval '30 days', 9, 10)
on conflict (id) do nothing;

-- mark one revoked for list-state coverage
update public.document_shares
set revoked_at = now() - interval '3 days'
where id = '81040000-0000-0000-0000-000000000003'::uuid
  and revoked_at is null;

-- =========================================================
-- 5. DOCUMENT PERMISSIONS (restored table; granular access rows)
-- =========================================================
insert into public.document_permissions (id, document_id, user_id, role_id, can_view, can_edit, can_share)
select
  '81050000-0000-0000-0000-000000000001'::uuid,
  '54600000-0000-0000-0000-000000000001'::uuid,
  'a1000000-0000-4000-8000-000000000002'::uuid,
  r.id, true, true, true
from public.roles r where r.key = 'client_user'
on conflict (id) do nothing;

insert into public.document_permissions (id, document_id, user_id, role_id, can_view, can_edit, can_share)
select
  '81050000-0000-0000-0000-000000000002'::uuid,
  '54600000-0000-0000-0000-000000000002'::uuid,
  null,
  r.id, true, false, false
from public.roles r where r.key = 'technician'
on conflict (id) do nothing;

insert into public.document_permissions (id, document_id, user_id, role_id, can_view, can_edit, can_share)
select
  '81050000-0000-0000-0000-000000000003'::uuid,
  '54600000-0000-0000-0000-000000000003'::uuid,
  'b2000000-0000-4000-8000-000000000002'::uuid,
  null, true, true, true
on conflict (id) do nothing;

-- =========================================================
-- 6. AI DRAFT OUTPUTS (ai tools)
-- =========================================================
insert into public.ai_draft_outputs (id, organization_id, module_key, prompt_key, prompt_version, draft_content, status, created_by, source_entity_type, source_entity_id) values
  ('81060000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'tickets', 'first_response', '1.0', jsonb_build_object('subject', 'Re: VPN drops on Radiology floor', 'body', 'Thanks for reaching out. We are investigating the VPN drops on the Radiology floor.'), 'approved', 'd4000000-0000-4000-8000-000000000003'::uuid, 'ticket', '52600000-0000-0000-0000-000000000001'),
  ('81060000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'proposals', 'proposal_summary', '1.0', jsonb_build_object('summary', 'Store 42 refresh proposal covering 30 POS terminals and network upgrade.'), 'draft', 'd4000000-0000-4000-8000-000000000001'::uuid, 'proposal', null),
  ('81060000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'documents', 'policy_summary', '2.1', jsonb_build_object('summary', 'Summarized HIPAA policy for executive review.'), 'rejected', 'd4000000-0000-4000-8000-000000000002'::uuid, 'document', '54600000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- =========================================================
-- 7. MODULE COMMENTS (cross-module discussion)
-- =========================================================
insert into public.module_comments (id, organization_id, module_key, entity_type, entity_id, author_id, body, is_internal) values
  ('81070000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'findings', 'finding', '55600000-0000-0000-0000-000000000001', 'a1000000-0000-4000-8000-000000000003'::uuid, 'Please add evidence links for the HIPAA finding.', false),
  ('81070000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'findings', 'finding', '55600000-0000-0000-0000-000000000001', 'd4000000-0000-4000-8000-000000000001'::uuid, 'Evidence collected, attaching to the finding record.', true),
  ('81070000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'projects', 'project', '53600000-0000-0000-0000-000000000003', 'b2000000-0000-4000-8000-000000000002'::uuid, 'Store 42 network cutover is scheduled for Friday.', false),
  ('81070000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'risk', 'risk', null, 'f1000000-0000-4000-8000-000000000003'::uuid, 'Flagging elevated risk from the recent external pen test.', false),
  ('81070000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'tickets', 'ticket', '52600000-0000-0000-0000-000000000007', 'f1000000-0000-4000-8000-000000000004'::uuid, 'User reported access issue again after password reset.', false)
on conflict (id) do nothing;

-- =========================================================
-- 8. MODULE TIMELINE EVENTS (activity feeds per entity)
-- =========================================================
insert into public.module_timeline_events (id, organization_id, module_key, entity_type, entity_id, event_type, event_data, actor_user_id) values
  ('81080000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'findings', 'finding', '55600000-0000-0000-0000-000000000001', 'status_changed', jsonb_build_object('from', 'open', 'to', 'in_review'), 'd4000000-0000-4000-8000-000000000001'),
  ('81080000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'tickets', 'ticket', '52600000-0000-0000-0000-000000000001', 'assigned', jsonb_build_object('assignee', 'd4000000-0000-4000-8000-000000000002'), 'a1000000-0000-4000-8000-000000000001'),
  ('81080000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'projects', 'project', '53600000-0000-0000-0000-000000000003', 'progress_updated', jsonb_build_object('progress', 50), 'b2000000-0000-4000-8000-000000000002'),
  ('81080000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'documents', 'document', '54600000-0000-0000-0000-000000000001', 'version_created', jsonb_build_object('version', 2), 'c3000000-0000-4000-8000-000000000004'),
  ('81080000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'tickets', 'ticket', '52600000-0000-0000-0000-000000000002', 'comment_added', jsonb_build_object('internal', false), 'f1000000-0000-4000-8000-000000000005')
on conflict (id) do nothing;

-- =========================================================
-- 9. SCHEDULED CHECK RESULTS (domain + website monitor history)
-- =========================================================
insert into public.scheduled_check_results (id, organization_id, module_key, check_type, check_target, status, result_data, duration_ms, checked_at, next_check_at) values
  ('81090000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'domain-monitors', 'dns', 'harborview.example', 'ok', jsonb_build_object('ttl', 3600, 'records', 3), 120, now() - interval '2 hours', now() + interval '4 hours'),
  ('81090000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'website-monitors', 'http', 'https://harborview.example', 'warning', jsonb_build_object('response_ms', 1890, 'status', 200), 1900, now() - interval '1 hour', now() + interval '1 hour'),
  ('81090000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'domain-monitors', 'spf', 'brightline.example', 'failed', jsonb_build_object('error', 'SPF record missing'), 90, now() - interval '3 hours', now() + interval '3 hours'),
  ('81090000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'website-monitors', 'http', 'https://summit.example', 'ok', jsonb_build_object('response_ms', 420, 'status', 200), 430, now() - interval '30 minutes', now() + interval '6 hours')
on conflict (id) do nothing;

-- =========================================================
-- 10. PROPOSALS + PHASES + LINE ITEMS
-- =========================================================
insert into public.proposals (id, organization_id, title, description, status, visibility, total_labor, total_materials, total_recurring, total_one_time, grand_total, valid_until, sent_at, approved_at, owner_user_id, created_by, metadata) values
  ('81100000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Network Segmentation Proposal', 'Segmentation of the hospital network into clinical and administrative zones.', 'sent', 'internal', 24000.00, 8500.00, 0, 32500.00, 32500.00, now() + interval '30 days', now() - interval '10 days', null, 'd4000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('81100000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Store 42 Refresh Proposal', 'Full IT refresh including POS terminals and network hardware.', 'draft', 'internal', 18000.00, 22000.00, 1200.00, 0, 41200.00, null, null, null, 'b2000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('81100000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Zero Trust Access Proposal', 'Zero trust architecture rollout for 40 remote advisors.', 'approved', 'internal', 32000.00, 0, 7200.00, 0, 39200.00, now() + interval '45 days', now() - interval '20 days', now() - interval '2 days', 'c3000000-0000-4000-8000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true)),
  ('81100000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme Managed Workstation Expansion', '25 additional managed workstations for the finance team.', 'rejected', 'internal', 12000.00, 9000.00, 0, 21000.00, 21000.00, null, now() - interval '15 days', null, 'f1000000-0000-4000-8000-000000000004'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

insert into public.proposal_phases (id, proposal_id, sort_order, title, description) values
  ('81110000-0000-0000-0000-000000000001'::uuid, '81100000-0000-0000-0000-000000000001'::uuid, 1, 'Discovery & Assessment', 'Review existing network topology and clinical systems.'),
  ('81110000-0000-0000-0000-000000000002'::uuid, '81100000-0000-0000-0000-000000000001'::uuid, 2, 'Segmentation Design', 'Design VLANs and firewall rules for clinical and admin zones.'),
  ('81110000-0000-0000-0000-000000000003'::uuid, '81100000-0000-0000-0000-000000000002'::uuid, 1, 'POS Hardware Refresh', 'Replace POS terminals at Store 42 flagship location.'),
  ('81110000-0000-0000-0000-000000000004'::uuid, '81100000-0000-0000-0000-000000000003'::uuid, 1, 'Zero Trust Pilot', 'Pilot zero trust access with 10 advisors.'),
  ('81110000-0000-0000-0000-000000000005'::uuid, '81100000-0000-0000-0000-000000000003'::uuid, 2, 'Full Rollout', 'Extend zero trust to all 40 advisors.')
on conflict (id) do nothing;

insert into public.proposal_line_items (id, proposal_id, phase_id, sort_order, item_type, name, description, quantity, unit_price, total_price, is_optional, is_recurring, recurring_interval) values
  ('81120000-0000-0000-0000-000000000001'::uuid, '81100000-0000-0000-0000-000000000001'::uuid, '81110000-0000-0000-0000-000000000001'::uuid, 1, 'labor', 'Discovery & Assessment', 'On-site network discovery.', 40, 150.00, 6000.00, false, false, null),
  ('81120000-0000-0000-0000-000000000002'::uuid, '81100000-0000-0000-0000-000000000001'::uuid, '81110000-0000-0000-0000-000000000002'::uuid, 2, 'labor', 'Segmentation Design', 'VLAN + firewall rule design.', 120, 150.00, 18000.00, false, false, null),
  ('81120000-0000-0000-0000-000000000003'::uuid, '81100000-0000-0000-0000-000000000002'::uuid, '81110000-0000-0000-0000-000000000003'::uuid, 1, 'materials', 'POS Terminals', '30x POS terminals with peripherals.', 30, 700.00, 21000.00, false, false, null),
  ('81120000-0000-0000-0000-000000000004'::uuid, '81100000-0000-0000-0000-000000000003'::uuid, '81110000-0000-0000-0000-000000000004'::uuid, 1, 'service', 'Zero Trust Pilot', 'Pilot license + configuration.', 10, 120.00, 1200.00, false, true, 'monthly'),
  ('81120000-0000-0000-0000-000000000005'::uuid, '81100000-0000-0000-0000-000000000003'::uuid, '81110000-0000-0000-0000-000000000005'::uuid, 2, 'service', 'Zero Trust Full Rollout', 'Full rollout licenses.', 40, 150.00, 6000.00, false, true, 'monthly')
on conflict (id) do nothing;

-- =========================================================
-- 11. TICKET TRIAGE DRAFTS
-- =========================================================
insert into public.ticket_triage_drafts (id, organization_id, raw_description, suggested_category, suggested_priority, suggested_subject, missing_info, first_response_draft, confidence_score, status, converted_ticket_id, reviewed_by, reviewed_at, created_by, metadata) values
  ('81200000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'VPN drops every morning on the Radiology floor, affecting 4 workstations.', 'network', 'high', 'VPN drops on Radiology floor', '{"affected_device_ids"}', 'Investigating recurring VPN drops on the Radiology floor - can you confirm which workstations are affected?', 88, 'converted', '52600000-0000-0000-0000-000000000001'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, now() - interval '5 days', 'd4000000-0000-4000-8000-000000000001'::uuid, jsonb_build_object('seeded', true)),
  ('81200000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Card reader on register 3 not powering on after overnight power blip.', 'hardware', 'normal', 'Register 3 card reader power failure', '{"serial_number"}', 'We will dispatch a technician to inspect register 3 card reader power.', 76, 'converted', '52600000-0000-0000-0000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, now() - interval '2 days', 'd4000000-0000-4000-8000-000000000002'::uuid, jsonb_build_object('seeded', true)),
  ('81200000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor cannot access client files from home VPN.', 'access', 'high', 'Advisor VPN file access blocked', '{"vpn_client_version", "last_successful_login"}', 'We are checking VPN policy and conditional access for this account.', 92, 'reviewed', null, 'd4000000-0000-4000-8000-000000000003'::uuid, now() - interval '1 day', 'd4000000-0000-4000-8000-000000000003'::uuid, jsonb_build_object('seeded', true)),
  ('81200000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Shipping label printer at dock door offline.', 'hardware', 'low', 'Dock door label printer offline', '{}', 'Recommend power cycle and cable reseat; monitoring.', 64, 'draft', null, null, null, 'f1000000-0000-4000-8000-000000000005'::uuid, jsonb_build_object('seeded', true))
on conflict (id) do nothing;

-- =========================================================
-- 12. LICENSE TRACKING / STATUS ITEMS / DMARC ASSESSMENTS
-- =========================================================
insert into public.license_tracking (id, organization_id, vendor, product_name, total_seats, assigned_seats, unused_seats, cost_per_seat, annual_cost, renewal_date, status, optimization_notes, reclaimable_savings, created_by) values
  ('81300000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Microsoft', 'M365 E3', 250, 231, 19, 32.00, 96000.00, '2026-09-30', 'active', '19 unused seats can be reclaimed before renewal.', 7296.00, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81300000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Cisco', 'Duo Beyond', 120, 98, 22, 5.00, 7200.00, '2026-08-15', 'renewal_soon', 'Trim 22 unused Duo seats at renewal.', 1320.00, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81300000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Microsoft', 'M365 Business Premium', 60, 60, 0, 22.00, 15840.00, '2026-10-31', 'active', null, 0, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81300000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Adobe', 'Acrobat Pro', 15, 12, 3, 25.00, 4500.00, '2026-12-01', 'active', 'Consolidate under 10 licenses.', 900.00, 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.status_items (id, organization_id, title, description, severity, status, is_public, is_resolved, scheduled_start, scheduled_end, created_by) values
  ('81310000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Network maintenance Sunday', 'Planned maintenance on core switch to implement segmentation.', 'info', 'scheduled', true, false, now() + interval '3 days', now() + interval '3 days' + interval '4 hours', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81310000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'VPN degraded', 'Intermittent VPN connectivity for Radiology floor.', 'major', 'resolved', true, true, null, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81310000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS gateway degraded', 'Intermittent payment processing delays across stores.', 'major', 'active', true, false, null, null, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81310000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Email quarantine alert', 'Elevated email quarantine volume flagged for review.', 'minor', 'active', false, false, null, null, 'c3000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dmarc_assessments (id, organization_id, domain, spf_record, spf_valid, dkim_configured, dkim_selector, dmarc_record, dmarc_policy, dmarc_valid, dmarc_pct, bimi_configured, recommendation_notes, last_checked_at, status, created_by) values
  ('81320000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', 'v=spf1 include:_spf.harborview.example ~all', true, true, 'selector1', 'v=DMARC1; p=reject; rua=mailto:dmarc@harborview.example', 'reject', true, 100, true, 'DMARC fully enforced with BIMI in place.', now() - interval '7 days', 'compliant', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81320000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', 'v=spf1 include:_spf.brightline.example ~all', true, false, 'selector1', 'v=DMARC1; p=none; rua=mailto:dmarc@brightline.example', 'none', true, 100, false, 'DKIM not configured for selector1; enable before moving to quarantine.', now() - interval '3 days', 'needs_review', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81320000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit.example', null, false, false, null, null, null, false, null, false, 'No SPF or DMARC records found - high spoofing risk.', now() - interval '1 day', 'needs_review', 'c3000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 13. OFFBOARDING / BREAK GLASS / ONBOARDING / PATCH COMPLIANCE
-- =========================================================
insert into public.offboarding_checklists (id, organization_id, employee_name, employee_email, department, offboarding_date, account_disabled, mailbox_converted, onedrive_transferred, license_reclaimed, access_reviewed, evidence_collected, completed_at, status, notes, created_by) values
  ('81400000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Jordan Ellis', 'jordan.ellis@harborview.example', 'Radiology', '2026-08-15', true, true, true, true, true, false, null, 'in_progress', 'Access review in progress with department head.', 'f1000000-0000-4000-8000-000000000001'::uuid),
  ('81400000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Casey Nguyen', 'casey.nguyen@harborview.example', 'Nursing Admin', '2026-07-20', true, true, true, true, true, true, now() - interval '5 days', 'completed', 'Offboarding completed and evidence archived.', 'f1000000-0000-4000-8000-000000000001'::uuid),
  ('81400000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Taylor Brooks', 'taylor.brooks@brightline.example', 'Store Ops', '2026-09-01', false, false, false, false, false, false, null, 'pending', 'Scheduled offboarding; coordinator not assigned yet.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81400000-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Sam Whitfield', 'sam.whitfield@northwind.example', 'Logistics', '2026-08-05', true, true, false, false, true, false, null, 'in_progress', 'OneDrive transfer pending.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.break_glass_accounts (id, organization_id, account_name, system, custodian_name, last_rotated_at, next_rotation_at, last_used_at, last_tested_at, access_procedure, test_notes, status, created_by) values
  ('81410000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'breakglass-harborview', 'Azure AD', 'Dr. Hannah Reyes', now() - interval '60 days', now() + interval '305 days', now() - interval '12 days', now() - interval '30 days', 'Sealed envelope in hospital safe; CISO approval required.', 'Login + password change verified.', 'active', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81410000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'bg-brightline-pos', 'POS Admin', 'Sarah Patel', now() - interval '10 days', now() + interval '355 days', null, now() - interval '10 days', 'Stored in store safe; regional manager approval required.', 'Rotation performed after audit.', 'active', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81410000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit-omni', 'On-prem DC', 'Elena Volkov', now() - interval '200 days', now() - interval '5 days', now() - interval '200 days', null, 'Compliance binder at HQ.', 'Rotation OVERDUE - schedule immediately.', 'overdue', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.onboarding_clients (id, organization_id, client_name, discovery_complete, m365_setup_complete, network_documented, security_baseline_applied, documentation_prepared, backup_configured, handoff_complete, started_at, completed_at, status, notes, created_by) values
  ('81420000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Westbrook Dental', true, true, true, false, false, false, false, now() - interval '21 days', null, 'security_baseline', 'Baseline applied next week.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81420000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Portland Law Group', true, true, true, true, true, true, true, now() - interval '60 days', now() - interval '5 days', 'handoff_complete', 'Fully onboarded and handed off to support.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81420000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Maritime Freight Co', true, false, false, false, false, false, false, now() - interval '7 days', null, 'discovery', 'Awaiting tenant access credentials.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.patch_compliance (id, organization_id, device_group, total_devices, patched_devices, pending_patches, critical_patches, last_patch_date, next_maintenance_window, exception_count, compliance_pct, status, notes, created_by) values
  ('81430000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Workstations', 180, 162, 18, 2, now() - interval '6 days', now() + interval '2 days', 3, 90.00, 'active', '2 critical patches pending on radiology imaging PCs.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81430000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Servers', 24, 24, 0, 0, now() - interval '3 days', now() + interval '14 days', 0, 100.00, 'active', 'Fully patched.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81430000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store POS Terminals', 210, 176, 34, 5, now() - interval '12 days', now() + interval '1 day', 8, 83.81, 'active', '5 critical patches; schedule after-hours window.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81430000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptops', 60, 55, 5, 0, now() - interval '8 days', now() + interval '3 days', 1, 91.67, 'active', 'One exception for offline device.', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 14. SECURITY SUITE (M365 hardening, incidents, ID verification, endpoints)
-- =========================================================
insert into public.m365_hardening (id, organization_id, tenant_domain, mfa_enforced, conditional_access_configured, legacy_auth_blocked, admin_count, guest_count, shared_mailbox_count, audit_logging_enabled, dlp_configured, defender_configured, last_assessment_at, next_review_at, overall_score, status, notes, created_by) values
  ('81500000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.onmicrosoft.com', true, true, true, 4, 6, 12, true, false, true, now() - interval '5 days', now() + interval '25 days', 82, 'needs_review', 'DLP not configured for PHI data.', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81500000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.onmicrosoft.com', true, false, false, 6, 10, 3, true, false, true, now() - interval '12 days', now() + interval '18 days', 61, 'needs_review', 'Legacy auth still enabled for POS integrations.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81500000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit.onmicrosoft.com', true, true, true, 2, 1, 4, true, true, true, now() - interval '2 days', now() + interval '28 days', 95, 'compliant', 'All baselines met.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81500000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.onmicrosoft.com', false, false, false, 8, 3, 5, true, false, true, now() - interval '20 days', now() - interval '5 days', 45, 'needs_review', 'MFA not enforced tenant-wide; assessment overdue.', 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.incident_responses (id, organization_id, incident_type, title, description, severity, detected_at, contained_at, eradicated_at, recovered_at, closed_at, affected_systems, root_cause, lessons_learned, status, lead_user_id, created_by) values
  ('81510000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'malware', 'Emotet detection on Radiology PC', 'Trojan detected on imaging workstation; isolated immediately.', 'critical', now() - interval '4 days', now() - interval '4 days', now() - interval '3 days', now() - interval '2 days', now() - interval '2 days', 'Radiology imaging PC-12', 'Phishing attachment from compromised vendor email.', 'Enable macro blocking across clinical fleet.', 'closed', 'd4000000-0000-4000-8000-000000000003'::uuid, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81510000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'outage', 'Store payment gateway outage', 'Payment processing down across 12 stores for 45 minutes.', 'major', now() - interval '1 day', now() - interval '1 day', null, now() - interval '1 day', now() - interval '1 day', 'POS gateway service', 'Third-party gateway regional outage.', 'Add gateway failover route.', 'closed', 'd4000000-0000-4000-8000-000000000002'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81510000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'phishing', 'Credential phishing campaign', 'Spear-phishing emails targeting advisor accounts with fake login page.', 'high', now() - interval '12 hours', null, null, null, null, 'Advisor mailboxes', 'Ongoing investigation.', 'Under investigation.', 'detected', 'c3000000-0000-4000-8000-000000000004'::uuid, 'c3000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.identity_verifications (id, organization_id, requestor_name, requestor_email, verification_method, verification_pass, action_authorized, authorized_by, authorized_at, notes, status, created_by) values
  ('81520000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Dr. Maya Patel', 'maya.patel@harborview.example', 'video_call', true, 'Password reset on admin account', '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '2 days', 'Identity confirmed via video + employee badge.', 'completed', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81520000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Alex Rivera', 'alex.rivera@brightline.example', 'ticket_submission', false, null, null, null, 'Unable to confirm identity from provided information.', 'failed', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81520000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Kenji Tanaka', 'kenji.tanaka@summit.example', 'manager_approval', true, 'Add user to VPN group', '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '1 day', 'Manager approval captured.', 'completed', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

insert into public.endpoint_security (id, organization_id, device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled, local_admin_removed, firewall_enabled, edr_deployed, coverage_pct, status, notes, created_by) values
  ('81530000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Workstations', 180, 178, 180, 165, 140, 175, 90, 90.00, 'active', 'MDM enrollment gaps on 15 imaging PCs.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81530000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Servers', 24, 24, 24, 24, 20, 24, 24, 100.00, 'active', 'Local admin removed on 20 of 24.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81530000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store POS', 210, 205, 185, 120, 95, 200, 150, 85.00, 'active', 'Disk encryption rollout at 88% for POS.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81530000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptops', 60, 60, 58, 60, 55, 60, 60, 96.67, 'active', '2 laptops pending BitLocker recovery key.', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 15. GOVERNANCE (retention policies, tabletop exercises)
-- =========================================================
insert into public.retention_policies (id, organization_id, data_category, system_name, retention_period_days, disposal_method, is_regulated, regulation_reference, last_reviewed_at, next_review_at, status, notes, created_by) values
  ('81600000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Patient Records', 'EHR', 2555, 'secure_delete', true, 'HIPAA 45 CFR 164.316', now() - interval '30 days', now() + interval '60 days', 'active', '7-year retention for PHI.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81600000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Security Audit Logs', 'M365', 365, 'archive', true, 'HIPAA', now() - interval '60 days', now() + interval '30 days', 'active', '1-year audit log retention.', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81600000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Transaction Records', 'POS', 1095, 'archive', true, 'PCI-DSS', now() - interval '10 days', now() + interval '80 days', 'active', 'PCI-DSS 3-year retention.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81600000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Client Records', 'CRM', 1825, 'archive', false, null, now() - interval '120 days', now() - interval '30 days', 'needs_review', 'Review overdue.', 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.tabletop_exercises (id, organization_id, title, scenario, scenario_type, participants, scheduled_date, completed_at, facilitator_id, notes, action_items, after_action_report, status, created_by) values
  ('81610000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Ransomware Response Drill', 'Simulated ransomware encryption of clinical file servers.', 'cyber_incident', 'CISO, IT Director, NOC, Legal', now() + interval '14 days', null, 'd4000000-0000-4000-8000-000000000003'::uuid, 'Quarterly drill.', null, null, 'scheduled', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81610000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Active Shooter Comm Plan', 'Communications exercise for an active shooter scenario.', 'physical_incident', 'Security, HR, Comms', now() - interval '20 days', now() - interval '18 days', 'd4000000-0000-4000-8000-000000000004'::uuid, 'Two improvement items identified.', 'Update emergency contact tree; add SMS blast.', 'Report filed with HR.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81610000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Data Breach Response', 'Simulated cardholder data breach at store locations.', 'data_breach', 'Store Ops, IT, Comms, Legal', now() + interval '30 days', null, 'd4000000-0000-4000-8000-000000000002'::uuid, 'New PCI-DSS exercise.', null, null, 'planned', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 16. FIELD SERVICES (ISP, UniFi, port maps, cameras, staging, diagrams)
-- =========================================================
insert into public.isp_assessments (id, organization_id, client_name, current_provider, current_cost, recommended_provider, recommended_cost, services, bandwidth_current, bandwidth_needed, contract_status, phone_lines, voip_ready, notes, status, created_by) values
  ('81700000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Main Campus', 'Spectrum', 850.00, 'Consolidated Fiber', 690.00, 'fiber_wan', '500/500 Mbps', '1 Gbps', 'negotiating', 40, true, 'Fiber quote received; negotiating multi-year.', 'in_review', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81700000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Store 42', 'Comcast', 320.00, null, null, 'business_internet', '200/20 Mbps', '500/500 Mbps', 'current', 6, false, 'Awaiting fiber availability check.', 'draft', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81700000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit HQ', 'Lumen', 1200.00, 'Lumen Metro E', 1100.00, 'dedicated_internet', '1 Gbps', '1 Gbps', 'current', 20, true, 'Satisfied with current provider.', 'completed', 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

insert into public.unifi_surveys (id, organization_id, site_name, site_address, access_points, switches, cameras, nvr_estimated_storage_tb, outdoor_aps, cable_runs_estimated, poe_budget_watts, survey_date, notes, status, created_by) values
  ('81710000-0000-0000-0000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42', '42 Main St, Portland ME', 8, 3, 12, 8.00, 2, 15, 900, '2026-07-20', 'Survey completed; PoE budget adequate.', 'completed', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81710000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 17', '17 Elm St, Bangor ME', 4, 2, 6, 4.00, 0, 8, 480, null, 'Survey scheduled for next week.', 'draft', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81710000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Radiology Wing', 'Harborview Hospital', 12, 4, 16, 10.00, 0, 22, 1200, '2026-07-28', 'High-density AP plan for imaging stations.', 'completed', 'f1000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

insert into public.port_maps (id, organization_id, switch_name, port_number, vlan_id, vlan_name, wall_jack_label, connected_device, device_type, uplink, poe_enabled, speed, notes, created_by) values
  ('81720000-0000-0000-0000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'SW42-1', 1, 10, 'Management', 'JACK-A1', 'AP-42-Lobby', 'access_point', false, true, '1G', 'Front lobby AP.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81720000-0000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'SW42-1', 2, 20, 'POS', 'JACK-A2', 'REG-3', 'pos_terminal', false, true, '1G', 'Register 3.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81720000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'SW42-1', 24, null, null, 'JACK-A24', 'SW42-UPLINK', 'uplink', true, false, '10G', 'Uplink to core.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81720000-0000-0000-0000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'SW-RAD-1', 5, 30, 'Clinical', 'RAD-J5', 'IMG-PC-12', 'workstation', false, false, '1G', 'Imaging PC.', 'f1000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

insert into public.camera_calculations (id, organization_id, site_name, camera_count, avg_bitrate_mbps, resolution, retention_days, estimated_storage_tb, recommended_nvr, notes, status, created_by) values
  ('81730000-0000-0000-0000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42', 12, 4.00, '4MP', 30, 1.73, 'UNVR Pro', 'Covers lobby, stockroom, registers, exterior.', 'completed', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81730000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Radiology', 16, 6.00, '8MP', 60, 8.30, 'Enterprise NVR (32ch)', 'High-res imaging surveillance needs.', 'draft', 'f1000000-0000-4000-8000-000000000001'::uuid),
  ('81730000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind Dock', 4, 2.00, '2MP', 14, 0.19, 'UNVR', 'Dock door + yard coverage.', 'completed', 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

insert into public.hardware_staging (id, organization_id, device_type, device_name, serial_number, asset_tag, configured, tested, labeled, imaged, qa_verified, staged_by, staged_at, notes, status, created_by) values
  ('81740000-0000-0000-0000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Terminal', 'REG-42-001', 'SN-POS-42001', 'AT-POS-0001', true, true, true, true, true, 'd4000000-0000-4000-8000-000000000001'::uuid, now() - interval '3 days', 'Ready for deployment.', 'ready', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81740000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Terminal', 'REG-42-002', 'SN-POS-42002', 'AT-POS-0002', true, false, false, true, false, 'd4000000-0000-4000-8000-000000000001'::uuid, null, 'Needs testing + labeling.', 'staged', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81740000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Workstation', 'RAD-IMG-13', 'SN-IMG-13013', 'AT-IMG-0013', true, true, true, true, true, 'f1000000-0000-4000-8000-000000000001'::uuid, now() - interval '1 day', 'Imaging PC ready for Radiology.', 'ready', 'f1000000-0000-4000-8000-000000000001'::uuid),
  ('81740000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Laptop', 'FIN-LAP-1001', 'SN-LAP-01001', 'AT-LAP-1001', false, false, false, false, false, null, null, 'Awaiting imaging template.', 'pending', 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.network_diagrams (id, organization_id, site_name, diagram_data, device_count, vlan_count, wan_count, wireless_zones, camera_zones, notes, status, created_by) values
  ('81750000-0000-0000-0000-000000000001'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42', jsonb_build_object('nodes', jsonb_build_array(jsonb_build_object('id', 'core', 'type', 'switch'), jsonb_build_object('id', 'ap1', 'type', 'ap')), 'edges', jsonb_build_array(jsonb_build_object('from', 'core', 'to', 'ap1'))), 12, 4, 1, 2, 1, 'Current store topology.', 'published', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81750000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Radiology', jsonb_build_object('nodes', jsonb_build_array(jsonb_build_object('id', 'core-rad', 'type', 'switch')), 'edges', jsonb_build_array()), 22, 5, 1, 3, 2, 'Draft segmentation plan.', 'draft', 'f1000000-0000-4000-8000-000000000001'::uuid),
  ('81750000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind HQ', jsonb_build_object('nodes', jsonb_build_array(), 'edges', jsonb_build_array()), 8, 3, 1, 1, 1, 'Reviewed with client.', 'published', 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 17. EDU AUTOMATION (SOPs, compliance, insurance, AI, KB, training, phishing,
--     scorecards, automation, powershell, KB generations)
-- =========================================================
insert into public.sop_library (id, organization_id, title, sop_number, category, version, framework, content, status, last_reviewed_at, next_review_at, created_by) values
  ('81800000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'New User Onboarding', 'SOP-001', 'HR IT', '2.1', '{HIPAA,ISO27001}', 'Steps to create accounts, assign licenses, and enroll in MFA.', 'published', now() - interval '10 days', now() + interval '80 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81800000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Incident Response - Malware', 'SOP-002', 'Security', '1.4', '{HIPAA,NIST-CSF}', 'Isolation, containment, eradication, and reporting steps.', 'published', now() - interval '5 days', now() + interval '85 days', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81800000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Terminal Setup', 'SOP-003', 'Store Ops', '1.0', '{PCI-DSS}', 'Imaging and configuration of POS terminals.', 'draft', null, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81800000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Backup Verification', 'SOP-004', 'DR', '1.2', '{NIST-CSF}', 'Monthly restore testing and validation.', 'published', now() - interval '2 days', now() + interval '88 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81800000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Firewall Change Management', 'SOP-005', 'Network', '1.0', '{}', 'Request, review, and rollback procedures for firewall changes.', 'draft', null, null, 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.compliance_readiness (id, organization_id, framework, control_id, control_description, is_compliant, evidence_collected, notes, assessed_at, status, created_by) values
  ('81810000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA', '164.312(a)', 'Access control', true, true, 'RBAC in place across EHR.', now() - interval '3 days', 'compliant', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81810000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA', '164.312(e)', 'Transmission security', false, false, 'VPN + TLS review pending.', now() - interval '3 days', 'in_progress', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81810000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'PCI-DSS', '10.2', 'Audit logging', true, true, 'Logging enabled on POS network.', now() - interval '1 day', 'compliant', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81810000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'SOC 2', 'CC6.1', 'Logical access controls', false, false, 'SOC 2 readiness review kicked off.', now() - interval '7 days', 'in_progress', 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.insurance_evidence (id, organization_id, category, evidence_description, evidence_status, document_reference, collected_at, renewal_date, notes, evidence_type, title, status, coverage_area, insurance_provider, policy_number, expiry_date, last_verified_at, created_by) values
  ('81820000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'cyber_liability', 'Current cyber liability policy evidence.', 'collected', 'ref-cyber-2026-001', now() - interval '40 days', '2027-05-01', 'Policy renewed annually.', 'document', 'Cyber Liability Policy 2026', 'verified', 'corporate', 'Chubb', 'POL-CYBER-2026-4412', '2027-05-01', now() - interval '40 days', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81820000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'professional_liability', 'E&O policy binder.', 'collected', 'ref-eo-2026-001', now() - interval '120 days', '2027-01-15', null, 'document', 'E&O Binder', 'verified', 'corporate', 'Travelers', 'POL-EO-2026-1209', '2027-01-15', now() - interval '120 days', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81820000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'cyber_liability', 'Retail cyber policy awaiting quote.', 'needed', null, null, null, 'Quoted but not bound.', 'document', 'Retail Cyber Quote', 'pending', 'retail', 'Hiscox', null, null, null, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81820000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'general_liability', 'General liability certificate for office lease.', 'collected', 'ref-gl-2026-001', now() - interval '200 days', '2026-12-01', 'Expiring soon - remind leasing office.', 'document', 'GL Certificate', 'expiring_soon', 'office', 'Liberty Mutual', 'POL-GL-2025-881', '2026-12-01', now() - interval '200 days', 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.ai_policies (id, organization_id, title, content, approved_tools, data_handling_rules, employee_guidance, status, approved_by, approved_at, created_by) values
  ('81830000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'AI Usage Policy', 'Policy governing employee use of AI tools for business data.', '{ChatGPT,Claude,Copilot}', 'No PHI in public AI tools. Anonymize before submission.', 'Always anonymize patient data before using AI tools.', 'approved', '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '15 days', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81830000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'AI Tool Approval', 'Approved AI tooling for retail operations.', '{Copilot}', 'No cardholder data allowed.', 'Approved list only.', 'draft', null, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81830000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'AI Data Handling', 'Data handling rules for AI-assisted analysis.', '{ChatGPT}', 'Client financial data requires encryption at rest and in transit.', 'Do not upload client PII.', 'approved', '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '5 days', 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.knowledge_articles (id, organization_id, title, content, category, tags, is_published, view_count, helpful_count, not_helpful_count, created_by) values
  ('81840000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'How to reset your MFA device', 'Follow these steps to re-enroll MFA for your account.', 'security', '{mfa,self-service}', true, 142, 130, 12, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81840000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Connecting to the VPN from home', 'VPN client download and connection guide.', 'remote_access', '{vpn,home}', true, 210, 195, 15, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81840000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Rebooting a POS terminal', 'Safe reboot procedure for store registers.', 'store_ops', '{pos,registers}', true, 98, 92, 6, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81840000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Requesting a new laptop', 'Equipment request workflow for advisors.', 'equipment', '{laptops,requests}', false, 12, 10, 2, 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.training_modules (id, organization_id, title, description, category, duration_minutes, is_required, completion_count, status, created_by) values
  ('81850000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA Privacy Basics', 'Mandatory annual HIPAA privacy training.', 'compliance', 30, true, 215, 'active', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81850000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Phishing Awareness', 'Interactive phishing recognition training.', 'security', 15, true, 198, 'active', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81850000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'PCI-DSS Store Compliance', 'Cardholder data handling for store staff.', 'compliance', 20, true, 175, 'active', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81850000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Client Data Protection', 'Protecting client financial information.', 'security', 12, true, 58, 'active', 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.phishing_campaigns (id, organization_id, campaign_name, target_count, opened_count, clicked_count, reported_count, started_at, ended_at, notes, status, created_by) values
  ('81860000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'August 2026 Quarterly Phish', 240, 180, 24, 22, now() - interval '20 days', now() - interval '6 days', '10% click rate - down from 16% last quarter.', 'completed', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81860000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Vendors Phish Test', 210, 160, 31, 10, now() - interval '10 days', now() - interval '2 days', '14.8% click rate - needs targeted re-training.', 'completed', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81860000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Executive BEC Simulation', 12, 11, 1, 1, null, null, 'Scheduled for executive team.', 'scheduled', 'd4000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.cyber_scorecards (id, organization_id, category, score, max_score, badge, last_updated) values
  ('81870000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Endpoint Protection', 88, 100, 'Strong', now() - interval '1 day'),
  ('81870000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Email Security', 82, 100, 'Solid', now() - interval '1 day'),
  ('81870000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Identity & Access', 79, 100, 'Good', now() - interval '1 day'),
  ('81870000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Endpoint Protection', 65, 100, 'Fair', now() - interval '2 days'),
  ('81870000-0000-0000-0000-000000000005'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Email Security', 71, 100, 'Good', now() - interval '2 days'),
  ('81870000-0000-0000-0000-000000000006'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Identity & Access', 91, 100, 'Strong', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.automation_workflows (id, organization_id, name, description, script_type, trigger_type, is_active, last_run_at, last_run_status, run_count, created_by) values
  ('81880000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Daily Backup Check', 'Verifies backup jobs completed and alerts on failure.', 'powershell', 'schedule', true, now() - interval '3 hours', 'success', 142, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81880000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'User Deprovisioning', 'Disables and removes access for offboarded users.', 'powershell', 'manual', true, now() - interval '5 days', 'success', 12, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('81880000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Software Update', 'Pushes approved POS software update to terminals.', 'powershell', 'schedule', false, now() - interval '30 days', 'failed', 4, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81880000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'MFA Enrollment Report', 'Generates monthly MFA enrollment report.', 'powershell', 'schedule', true, now() - interval '2 days', 'success', 8, 'd4000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.powershell_scripts (id, organization_id, name, script_content, policy_checked, approval_required, approved_by, approved_at, status, created_by) values
  ('81890000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Remove-StaleUser', 'Get-ADUser -Filter ... | Disable-ADAccount', true, true, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '30 days', 'approved', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('81890000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Get-MFAStatus', 'Get-MgUser ... | Select MFA status', true, false, null, null, 'active', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81890000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Update-POSRegistry', 'Set-ItemProperty for POS hardening', false, true, null, null, 'pending_review', 'd4000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

insert into public.kb_article_generations (id, organization_id, source_ticket_id, source_title, generated_content, reviewed_content, status, reviewed_by, reviewed_at, created_by) values
  ('81900000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '52600000-0000-0000-0000-000000000001'::uuid, 'VPN drops on Radiology floor', 'Generated KB article on VPN troubleshooting steps.', null, 'draft', null, null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('81900000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, '52600000-0000-0000-0000-000000000003'::uuid, 'Card reader power failure', 'Generated article on POS card reader power diagnostics.', 'Reviewed and published version.', 'published', 'd4000000-0000-4000-8000-000000000001'::uuid, now() - interval '2 days', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('81900000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, null, 'Zero Trust rollout guide', 'Generated onboarding guide for zero trust rollout.', null, 'draft', null, null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 18. FINAL BATCH (SharePoint plans, device profiles, SaaS audits,
--     procurement quotes, DNS change requests)
-- =========================================================
insert into public.sharepoint_plans (id, organization_id, site_name, team_name, structure_type, owner, sensitivity_label, external_sharing, notes, status, created_by) values
  ('82000000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview HR', 'Human Resources', 'team_site', 'Dr. Hannah Reyes', 'Confidential', 'disabled', 'HR document library restructure.', 'in_progress', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82000000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Ops Hub', 'Store Operations', 'communication_site', 'Sarah Patel', 'Internal', 'external_viewing', 'Vendor sharing for POS docs.', 'planned', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82000000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Resources', 'Advisor Success', 'team_site', 'Elena Volkov', 'Internal', 'disabled', 'Central resource library for advisors.', 'completed', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.device_profiles (id, organization_id, profile_name, device_type, os, settings, description, status, created_by) values
  ('82010000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Clinical Workstation Standard', 'workstation', 'Windows 11', jsonb_build_object('bitlocker', true, 'edr', true, 'local_admin', false), 'Standard build for clinical PCs.', 'active', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82010000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Terminal Standard', 'pos_terminal', 'Windows 11 IoT', jsonb_build_object('pos_lockdown', true, 'edr', true), 'Locked-down POS build.', 'active', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82010000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Laptop Standard', 'laptop', 'Windows 11', jsonb_build_object('bitlocker', true, 'edr', true, 'mdm', true), 'Advisor laptop build with VPN preinstalled.', 'active', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

insert into public.saas_audits (id, organization_id, vendor_name, service_name, monthly_cost, annual_cost, payment_method, classification, usage_frequency, cancellation_risk, has_data_access, renewal_date, notes, created_by) values
  ('82020000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Zoom', 'Zoom Business', 299.00, 3588.00, 'credit_card', 'collaboration', 'daily', 'low', true, '2026-11-30', 'Usage at 60% of seats.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82020000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Slack', 'Slack Pro', 180.00, 2160.00, 'credit_card', 'collaboration', 'daily', 'low', true, '2026-12-15', 'Consider consolidating with Teams.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82020000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Adobe', 'Acrobat Pro', 125.00, 1500.00, 'invoice', 'productivity', 'weekly', 'low', false, '2027-01-31', 'Renewal OK.', 'c3000000-0000-4000-8000-000000000003'::uuid),
  ('82020000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'LastPass', 'LastPass Business', 96.00, 1152.00, 'credit_card', 'security', 'daily', 'high', true, '2026-09-30', 'Deprecate - moving to Entra P1.', 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.procurement_quotes (id, organization_id, vendor_name, product, quote_amount, competitor_quote, comparison_notes, selected, purchased_at, notes, created_by) values
  ('82030000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Dell', 'Latitude 5450 (50 units)', 58500.00, 60400.00, 'Dell undercut HP by 3%.', true, now() - interval '10 days', 'Purchased for clinical refresh.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82030000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'CDW', 'POS terminals (30 units)', 31800.00, 30500.00, 'Twinlinet cheaper by 4%.', false, null, 'Awaiting decision.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82030000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Apple', 'MacBook Air M4 (15 units)', 17100.00, null, 'No competitor quote yet.', true, now() - interval '3 days', 'Advisor laptops.', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dns_change_requests (id, organization_id, domain, change_type, change_description, proposed_value, current_value, status, approved_by, implemented_at, created_by) values
  ('82040000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', 'add_txt', 'Add DMARC reporting RUA record.', 'v=DMARC1; p=none; rua=mailto:dmarc@harborview.example', 'none', 'pending', null, null, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82040000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', 'update_spf', 'Add third-party email service to SPF.', 'v=spf1 include:_spf.brightline.example include:mailer3p.example ~all', 'v=spf1 include:_spf.brightline.example ~all', 'approved', '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '1 day', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82040000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit.example', 'add_cname', 'Add CNAME for client portal subdomain.', 'portal.summit.example', 'CNAME api.example.net', 'implemented', '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() - interval '4 days', 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 19. SATISFACTION PULSES + BACKUP STATUS
-- =========================================================
insert into public.satisfaction_pulses (id, organization_id, subject, question, rating, feedback, source, source_entity_id, source_entity_type, sent_at, responded_at, status, respondent_user_id, respondent_organization_id) values
  ('82100000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Ticket 52600000-...-001 resolution', 'How satisfied were you with the resolution of your VPN issue?', 9, 'Fast response and clear communication.', 'ticket', '52600000-0000-0000-0000-000000000001', 'ticket', now() - interval '4 days', now() - interval '3 days', 'responded', 'a1000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333'),
  ('82100000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 support', 'Rate your recent support experience.', 6, 'Resolved but took longer than expected.', 'ticket', '52600000-0000-0000-0000-000000000003', 'ticket', now() - interval '2 days', now() - interval '1 day', 'responded', 'b2000000-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444'),
  ('82100000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor VPN fix', 'How satisfied are you with the VPN fix?', null, null, 'ticket', '52600000-0000-0000-0000-000000000005', 'ticket', now() - interval '6 hours', null, 'pending', null, null),
  ('82100000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Acme support', 'Rate your recent interaction with the support team.', 8, 'Helpful technician.', 'manual', null, null, now() - interval '5 days', now() - interval '4 days', 'responded', 'f1000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111'),
  ('82100000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Northwind onboarding', 'How was your onboarding experience?', null, null, 'project', '53600000-0000-0000-0000-000000000001', 'project', now() - interval '1 day', null, 'pending', null, null)
on conflict (id) do nothing;

insert into public.satisfaction_pulse_templates (id, organization_id, name, description, type, questions, is_active, created_by) values
  ('82110000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Standard CSAT', 'Default post-ticket CSAT survey.', 'csat', '[{"text": "How satisfied were you with the resolution?", "type": "rating", "max": 10}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82110000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store Ops Survey', 'Survey for store operations support.', 'csat', '[{"text": "Was your POS issue resolved?", "type": "yes_no"}, {"text": "Add any comments.", "type": "text"}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82110000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Project Delivery', 'Post-project delivery feedback.', 'nps', '[{"text": "How likely are you to recommend us?", "type": "rating", "max": 10}]'::jsonb, false, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.satisfaction_pulse_schedules (id, organization_id, template_id, name, trigger_type, trigger_config, frequency, cron_expression, is_active, last_run_at, next_run_at, created_by) values
  ('82120000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '82110000-0000-0000-0000-000000000001'::uuid, 'Ticket Closed CSAT', 'ticket_closed', jsonb_build_object('delay_hours', 24), null, null, true, now() - interval '1 day', now() + interval '1 day', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82120000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, '82110000-0000-0000-0000-000000000002'::uuid, 'POS Support Survey', 'ticket_closed', jsonb_build_object('delay_hours', 2), null, null, true, now() - interval '6 hours', now() + interval '6 hours', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82120000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, null, 'Quarterly NPS', 'scheduled', jsonb_build_object(), 'quarterly', '0 0 1 1 *', false, now() - interval '30 days', now() + interval '60 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.backup_status (id, organization_id, system_name, backup_type, last_backup_at, last_backup_status, last_backup_size_gb, next_scheduled_at, recovery_point_objective_hours, recovery_time_objective_hours, retention_days, restore_tested_at, restore_test_result, offsite_replicated, encryption_enabled, notes, status, created_by) values
  ('82200000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Database', 'full', now() - interval '3 hours', 'success', 128.50, now() + interval '21 hours', 4, 2, 30, now() - interval '7 days', 'success', true, true, 'EHR DB protected.', 'monitored', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82200000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'File Servers', 'incremental', now() - interval '6 hours', 'success', 42.10, now() + interval '18 hours', 8, 4, 30, now() - interval '15 days', 'success', true, true, 'File server backups OK.', 'monitored', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82200000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Config Server', 'full', now() - interval '2 days', 'failed', null, now() + interval '1 day', 24, 6, 14, null, null, false, true, 'Backup failed - investigate immediately.', 'attention', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82200000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Advisor Mailboxes', 'full', now() - interval '5 hours', 'success', 88.00, now() + interval '19 hours', 6, 3, 30, now() - interval '30 days', 'success', true, true, 'M365 backup OK.', 'monitored', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82200000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Finance Workstations', 'incremental', now() - interval '12 hours', 'success', 15.75, now() + interval '12 hours', 24, 12, 30, null, null, false, true, 'Workstation backups OK.', 'monitored', 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 20. CLIENT ONBOARDING COMMAND CENTER
-- =========================================================
insert into public.client_onboarding_command_center_records (id, organization_id, client_name, client_domain, client_contact_email, client_contact_phone, onboarding_lead_id, status, phase, risk_level, discovery_notes, m365_setup_status, m365_tenant_id, m365_licenses, access_collection_status, access_credentials, network_baseline_status, network_diagram_url, network_scan_results, documentation_status, documentation_url, backup_configuration_status, security_baseline_status, security_training_status, client_deliverables_status, expected_go_live, actual_go_live, created_by) values
  ('82300000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Westbrook Dental', 'westbrookdental.example', 'it@westbrookdental.example', '555-0801', 'd4000000-0000-4000-8000-000000000004'::uuid, 'in_progress', 'security_baseline', 'medium', '2 locations, 18 staff, EHR in cloud.', 'complete', 'westbrook.onmicrosoft.com', jsonb_build_object('m365_business_premium', 20), 'complete', jsonb_build_object('credential_collected', true), 'in_progress', null, jsonb_build_object('scan_ready', true), 'in_progress', null, 'not_started', 'in_progress', 'not_started', 'not_started', now() + interval '21 days', null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82300000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Portland Law Group', 'portlandlaw.example', 'matt@portlandlaw.example', '555-0802', 'd4000000-0000-4000-8000-000000000004'::uuid, 'completed', 'handoff', 'low', '25 users, 1 office.', 'complete', 'portlandlaw.onmicrosoft.com', jsonb_build_object('m365_business_standard', 30), 'complete', jsonb_build_object('credential_collected', true), 'complete', 'https://example.invalid/diagrams/plg', jsonb_build_object('scan_complete', true, 'findings', 2), 'complete', 'https://example.invalid/docs/plg', 'complete', 'complete', 'complete', 'complete', now() - interval '20 days', now() - interval '5 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82300000-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Maritime Freight Co', 'maritimefreight.example', 'ops@maritimefreight.example', '555-0803', 'f1000000-0000-4000-8000-000000000005'::uuid, 'in_progress', 'discovery', 'high', '3 locations, 45 staff, legacy on-prem.', 'not_started', null, jsonb_build_object(), 'in_progress', jsonb_build_object(), 'in_progress', null, jsonb_build_object(), 'not_started', null, 'not_started', 'not_started', 'not_started', 'not_started', now() + interval '45 days', null, 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

insert into public.client_onboarding_checklist_items (id, organization_id, onboarding_record_id, phase, item_key, label, description, is_required, is_completed, completed_by, completed_at, notes, sort_order) values
  ('82310000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '82300000-0000-0000-0000-000000000001'::uuid, 'discovery', 'kickoff', 'Kickoff call completed', 'Initial discovery call with primary contact.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '18 days', null, 1),
  ('82310000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '82300000-0000-0000-0000-000000000001'::uuid, 'discovery', 'inventory', 'Asset inventory collected', 'Inventory of all hardware and software.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '15 days', '24 devices documented.', 2),
  ('82310000-0000-0000-0000-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '82300000-0000-0000-0000-000000000001'::uuid, 'm365', 'tenant_created', 'M365 tenant configured', 'Tenant and domains configured.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '10 days', null, 3),
  ('82310000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '82300000-0000-0000-0000-000000000001'::uuid, 'security', 'baseline_applied', 'Security baseline applied', 'Security baseline policy applied to endpoints.', true, false, null, null, 'Scheduled next week.', 4),
  ('82310000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '82300000-0000-0000-0000-000000000002'::uuid, 'backup', 'backup_verified', 'Backup restore verified', 'Restore test completed successfully.', true, true, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '8 days', null, 5)
on conflict (id) do nothing;

-- =========================================================
-- 21. DYNAMIC CLIENT FORMS + SUBMISSIONS
-- =========================================================
insert into public.dynamic_client_forms (id, organization_id, title, description, form_type, status, fields, settings, published_at, closes_at, created_by) values
  ('82400000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'New User Access Request', 'Request access for a new employee.', 'intake', 'published', '[{"key": "employee_name", "label": "Employee Name", "type": "text"}, {"key": "department", "label": "Department", "type": "select", "options": ["Clinical", "Admin", "IT"]}]'::jsonb, jsonb_build_object('notify_channel', 'email'), now() - interval '10 days', null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82400000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Issue Report', 'Report a point-of-sale issue.', 'support', 'published', '[{"key": "store", "label": "Store Number", "type": "number"}, {"key": "register", "label": "Register", "type": "text"}, {"key": "issue", "label": "Issue Description", "type": "textarea"}]'::jsonb, jsonb_build_object(), now() - interval '7 days', null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82400000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Client Intake - New Advisor', 'Intake for new advisor accounts.', 'intake', 'draft', '[{"key": "advisor_name", "label": "Advisor Name", "type": "text"}]'::jsonb, jsonb_build_object(), null, null, 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.dynamic_form_submissions (id, form_id, organization_id, respondent_id, respondent_email, answers, status, submitted_at) values
  ('82410000-0000-0000-0000-000000000001'::uuid, '82400000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'hannah.reyes@harborview.example', jsonb_build_object('employee_name', 'Alex Chen', 'department', 'Clinical'), 'submitted', now() - interval '4 days'),
  ('82410000-0000-0000-0000-000000000002'::uuid, '82400000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'marcus.chen@harborview.example', jsonb_build_object('employee_name', 'Sam Rivera', 'department', 'Admin'), 'reviewed', now() - interval '2 days'),
  ('82410000-0000-0000-0000-000000000003'::uuid, '82400000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'tyler.brooks@brightline.example', jsonb_build_object('store', 42, 'register', 'REG-3', 'issue', 'Card reader not powering on.'), 'submitted', now() - interval '1 day'),
  ('82410000-0000-0000-0000-000000000004'::uuid, '82400000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, null, 'store17@brightline.example', jsonb_build_object('store', 17, 'register', 'REG-1', 'issue', 'Receipt printer jam.'), 'submitted', now() - interval '12 hours')
on conflict (id) do nothing;

-- =========================================================
-- 22. SCORE HISTORY + BADGES EARNED
-- =========================================================
insert into public.score_history (id, organization_id, category, score, recorded_at) values
  ('82500000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Endpoint Protection', 82, now() - interval '30 days'),
  ('82500000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Endpoint Protection', 85, now() - interval '15 days'),
  ('82500000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Endpoint Protection', 88, now() - interval '1 day'),
  ('82500000-0000-0000-0000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Email Security', 80, now() - interval '30 days'),
  ('82500000-0000-0000-0000-000000000005'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Email Security', 82, now() - interval '1 day'),
  ('82500000-0000-0000-0000-000000000006'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Endpoint Protection', 62, now() - interval '14 days'),
  ('82500000-0000-0000-0000-000000000007'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Endpoint Protection', 65, now() - interval '2 days'),
  ('82500000-0000-0000-0000-000000000008'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Identity & Access', 90, now() - interval '10 days'),
  ('82500000-0000-0000-0000-000000000009'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Identity & Access', 91, now() - interval '1 day')
on conflict (id) do nothing;

insert into public.badges_earned (id, organization_id, badge_name, category, earned_at, points) values
  ('82510000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Patch Perfection', 'compliance', now() - interval '5 days', 50),
  ('82510000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'MFA Champion', 'security', now() - interval '12 days', 25),
  ('82510000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Phishing Survivor', 'security', now() - interval '3 days', 10),
  ('82510000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Full Compliance', 'compliance', now() - interval '7 days', 100)
on conflict (id) do nothing;

-- =========================================================
-- 23. PROJECT PHASES / MILESTONES / DEPENDENCIES
--     (refs seed-05 projects 53600000-...-001..004)
-- =========================================================
insert into public.project_phases (id, project_id, name, description, status, start_date, end_date, sort_order) values
  ('82600000-0000-0000-0000-000000000001'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, 'Assessment', 'Evaluate current HIPAA controls.', 'completed', '2026-07-05', '2026-07-25', 1),
  ('82600000-0000-0000-0000-000000000002'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, 'Remediation', 'Implement required control fixes.', 'in_progress', '2026-07-28', '2026-08-30', 2),
  ('82600000-0000-0000-0000-000000000003'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, 'Final Report', 'Deliver HIPAA readiness report.', 'planned', '2026-09-01', '2026-09-15', 3),
  ('82600000-0000-0000-0000-000000000004'::uuid, '53600000-0000-0000-0000-000000000003'::uuid, 'Discovery', 'Store 42 site survey.', 'completed', '2026-07-10', '2026-07-20', 1),
  ('82600000-0000-0000-0000-000000000005'::uuid, '53600000-0000-0000-0000-000000000003'::uuid, 'Deployment', 'Deploy refreshed hardware.', 'in_progress', '2026-07-24', '2026-08-15', 2),
  ('82600000-0000-0000-0000-000000000006'::uuid, '53600000-0000-0000-0000-000000000004'::uuid, 'Pilot', 'Zero trust pilot for 10 advisors.', 'planned', '2026-08-10', '2026-09-10', 1),
  ('82600000-0000-0000-0000-000000000007'::uuid, '53600000-0000-0000-0000-000000000004'::uuid, 'Full Rollout', 'Extend to all 40 advisors.', 'planned', '2026-09-15', '2026-10-31', 2)
on conflict (id) do nothing;

insert into public.project_milestones (id, project_id, phase_id, title, description, due_date, completed_at, status, created_by) values
  ('82610000-0000-0000-0000-000000000001'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, '82600000-0000-0000-0000-000000000001'::uuid, 'Control gap analysis', 'Complete the HIPAA control gap analysis.', '2026-07-22', now() - interval '10 days', 'completed', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82610000-0000-0000-0000-000000000002'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, '82600000-0000-0000-0000-000000000002'::uuid, 'Policies updated', 'Update HIPAA policies per findings.', '2026-08-20', null, 'pending', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82610000-0000-0000-0000-000000000003'::uuid, '53600000-0000-0000-0000-000000000003'::uuid, '82600000-0000-0000-0000-000000000005'::uuid, 'POS cutover complete', 'Cut over register hardware at Store 42.', '2026-08-12', null, 'pending', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82610000-0000-0000-0000-000000000004'::uuid, '53600000-0000-0000-0000-000000000004'::uuid, '82600000-0000-0000-0000-000000000006'::uuid, 'Pilot sign-off', 'Advisors approve pilot.', '2026-09-08', null, 'pending', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.project_dependencies (id, project_id, depends_on_task_id, depends_on_milestone_id, blocked_by_project_id, dependency_type) values
  ('82620000-0000-0000-0000-000000000001'::uuid, '53600000-0000-0000-0000-000000000001'::uuid, null, '82610000-0000-0000-0000-000000000001'::uuid, null, 'finish_to_start'),
  ('82620000-0000-0000-0000-000000000002'::uuid, '53600000-0000-0000-0000-000000000003'::uuid, null, null, '53600000-0000-0000-0000-000000000001'::uuid, 'blocked_by'),
  ('82620000-0000-0000-0000-000000000003'::uuid, '53600000-0000-0000-0000-000000000004'::uuid, '53700000-0000-0000-0000-000000000004'::uuid, null, null, 'finish_to_start')
on conflict (id) do nothing;

-- =========================================================
-- 24. LICENSE ALLOCATIONS + DMARC ANALYSES
-- =========================================================
insert into public.license_allocations (id, organization_id, software_name, license_type, total_seats, used_seats, cost_per_seat, billing_cycle, last_audit_date, status, notes, created_by) values
  ('82700000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Microsoft 365 E3', 'per_seat', 250, 231, 32.00, 'monthly', now() - interval '15 days', 'active', '19 seats unused.', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82700000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Cisco Duo', 'per_seat', 120, 98, 5.00, 'monthly', now() - interval '20 days', 'active', '22 unused.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82700000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Microsoft 365 Business Premium', 'per_seat', 60, 60, 22.00, 'monthly', now() - interval '5 days', 'active', null, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('82700000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Adobe Acrobat Pro', 'per_seat', 15, 12, 25.00, 'monthly', now() - interval '40 days', 'active', null, 'f1000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.dmarc_analyses (id, organization_id, domain, dmarc_record, spf_record, dkim_record, dmarc_policy, alignment_mode, pct, overall_grade, issues, recommendations, analyzed_at, created_by) values
  ('82710000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'harborview.example', 'v=DMARC1; p=reject; rua=mailto:dmarc@harborview.example', 'v=spf1 include:_spf.harborview.example ~all', 'v=DKIM1; k=rsa; p=...', 'reject', 'relaxed', 100, 'A', jsonb_build_array(), jsonb_build_array(jsonb_build_object('action', 'none')), now() - interval '7 days', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82710000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'brightline.example', 'v=DMARC1; p=none; rua=mailto:dmarc@brightline.example', 'v=spf1 include:_spf.brightline.example ~all', null, 'none', 'relaxed', 100, 'C', jsonb_build_array(jsonb_build_object('type', 'dkim_missing', 'severity', 'high')), jsonb_build_array(jsonb_build_object('action', 'configure_dkim')), now() - interval '3 days', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82710000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'summit.example', null, null, null, null, null, null, 'F', jsonb_build_array(jsonb_build_object('type', 'no_dmarc', 'severity', 'critical'), jsonb_build_object('type', 'no_spf', 'severity', 'critical')), jsonb_build_array(jsonb_build_object('action', 'publish_spf'), jsonb_build_object('action', 'publish_dmarc')), now() - interval '1 day', 'c3000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 25. TRAINING HUB (courses, lessons, enrollments)
-- =========================================================
insert into public.training_courses (id, organization_id, title, description, category, difficulty, estimated_minutes, status, passing_score, created_by) values
  ('82800000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'HIPAA Fundamentals', 'Basics of HIPAA for all staff.', 'compliance', 'beginner', 30, 'published', 80, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82800000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Advanced Phishing Defense', 'Recognizing sophisticated phishing.', 'security', 'advanced', 20, 'published', 85, 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('82800000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'PCI-DSS for Store Staff', 'Cardholder data handling in retail.', 'compliance', 'beginner', 25, 'draft', 80, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82800000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Client Data Handling', 'Protecting client financial information.', 'security', 'beginner', 15, 'published', 75, 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.training_lessons (id, course_id, title, content, lesson_type, sort_order) values
  ('82810000-0000-0000-0000-000000000001'::uuid, '82800000-0000-0000-0000-000000000001'::uuid, 'What is HIPAA?', 'Introduction to HIPAA rules and who they apply to.', 'text', 1),
  ('82810000-0000-0000-0000-000000000002'::uuid, '82800000-0000-0000-0000-000000000001'::uuid, 'PHI Handling', 'How to handle protected health information.', 'text', 2),
  ('82810000-0000-0000-0000-000000000003'::uuid, '82800000-0000-0000-0000-000000000002'::uuid, 'Spear Phishing', 'Advanced techniques used in targeted attacks.', 'text', 1),
  ('82810000-0000-0000-0000-000000000004'::uuid, '82800000-0000-0000-0000-000000000004'::uuid, 'Client PII Basics', 'Understanding client PII.', 'text', 1)
on conflict (id) do nothing;

insert into public.training_enrollments (id, course_id, user_id, status, progress_percent, completed_at, enrolled_at) values
  ('82820000-0000-0000-0000-000000000001'::uuid, '82800000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-4000-8000-000000000002'::uuid, 'completed', 100, now() - interval '20 days', now() - interval '30 days'),
  ('82820000-0000-0000-0000-000000000002'::uuid, '82800000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-4000-8000-000000000003'::uuid, 'in_progress', 60, null, now() - interval '10 days'),
  ('82820000-0000-0000-0000-000000000003'::uuid, '82800000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'enrolled', 0, null, now() - interval '3 days'),
  ('82820000-0000-0000-0000-000000000004'::uuid, '82800000-0000-0000-0000-000000000001'::uuid, 'f1000000-0000-4000-8000-000000000001'::uuid, 'completed', 100, now() - interval '6 days', now() - interval '14 days'),
  ('82820000-0000-0000-0000-000000000005'::uuid, '82800000-0000-0000-0000-000000000004'::uuid, 'f1000000-0000-4000-8000-000000000003'::uuid, 'completed', 100, now() - interval '2 days', now() - interval '8 days')
on conflict (id) do nothing;

-- =========================================================
-- 26. STATUS PAGE (components, incidents, maintenance)
-- =========================================================
insert into public.status_components (id, organization_id, name, description, component_type, status, display_order) values
  ('82900000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Email', 'Harborview email service.', 'service', 'operational', 1),
  ('82900000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'VPN', 'Remote access VPN.', 'service', 'degraded', 2),
  ('82900000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'EHR Portal', 'Electronic health records portal.', 'service', 'operational', 3),
  ('82900000-0000-0000-0000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS Gateway', 'Payment processing gateway.', 'service', 'degraded', 1),
  ('82900000-0000-0000-0000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Client Portal', 'Advisor client portal.', 'service', 'operational', 1)
on conflict (id) do nothing;

insert into public.status_incidents (id, organization_id, title, description, severity, status, affected_component_ids, started_at, resolved_at, created_by) values
  ('82910000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'VPN intermittent connectivity', 'Intermittent VPN drops on Radiology floor.', 'major', 'investigating', '{82900000-0000-0000-0000-000000000002}'::uuid[], now() - interval '4 hours', null, 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82910000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Email delayed (resolved)', 'Email delivery delayed for 20 minutes.', 'minor', 'resolved', '{82900000-0000-0000-0000-000000000001}'::uuid[], now() - interval '3 days', now() - interval '3 days' + interval '25 minutes', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82910000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS gateway degraded', 'Payment processing delays across stores.', 'major', 'monitoring', '{82900000-0000-0000-0000-000000000004}'::uuid[], now() - interval '6 hours', null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82910000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Planned maintenance notice', 'Scheduled portal maintenance.', 'maintenance', 'scheduled', '{82900000-0000-0000-0000-000000000005}'::uuid[], now() + interval '2 days', null, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.maintenance_notices (id, organization_id, title, description, scheduled_start, scheduled_end, status, affected_component_ids, created_by) values
  ('82920000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Core switch maintenance', 'Planned core switch upgrade for segmentation.', now() + interval '3 days', now() + interval '3 days' + interval '4 hours', 'scheduled', '{82900000-0000-0000-0000-000000000002}'::uuid[], 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('82920000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'POS gateway upgrade', 'Gateway provider upgrade window.', now() + interval '7 days', now() + interval '7 days' + interval '2 hours', 'scheduled', '{82900000-0000-0000-0000-000000000004}'::uuid[], 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('82920000-0000-0000-0000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Backup window change (completed)', 'Maintenance completed without issue.', now() - interval '2 days', now() - interval '2 days' + interval '1 hour', 'completed', '{}'::uuid[], 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 27. UPTIME MONITOR (checks + results)
-- =========================================================
insert into public.uptime_checks (id, organization_id, url, check_type, check_interval_minutes, expected_status_code, timeout_seconds, status, created_by) values
  ('83000000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'https://harborview.example', 'http', 15, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000002'::uuid),
  ('83000000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'https://brightline.example', 'http', 15, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('83000000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'https://summit.example', 'http', 30, 200, 10, 'active', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('83000000-0000-0000-0000-000000000004'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'https://harborview.example/health', 'http', 5, 200, 5, 'paused', 'd4000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

insert into public.uptime_results (id, check_id, response_status, response_time_ms, ssl_expiry_date, ssl_days_remaining, is_up, error_message, checked_at) values
  ('83010000-0000-0000-0000-000000000001'::uuid, '83000000-0000-0000-0000-000000000001'::uuid, 200, 420, '2027-01-15', 160, true, null, now() - interval '5 minutes'),
  ('83010000-0000-0000-0000-0000-000000000002'::uuid, '83000000-0000-0000-0000-000000000001'::uuid, 200, 390, '2027-01-15', 160, true, null, now() - interval '20 minutes'),
  ('83010000-0000-0000-0000-0000-000000000003'::uuid, '83000000-0000-0000-0000-000000000001'::uuid, 500, 1200, '2027-01-15', 160, false, 'HTTP 500 Internal Server Error', now() - interval '40 minutes'),
  ('83010000-0000-0000-0000-000000000004'::uuid, '83000000-0000-0000-0000-000000000002'::uuid, 200, 610, '2026-11-20', 105, true, null, now() - interval '10 minutes'),
  ('83010000-0000-0000-0000-000000000005'::uuid, '83000000-0000-0000-0000-000000000002'::uuid, 503, 3400, '2026-11-20', 105, false, 'HTTP 503 Service Unavailable', now() - interval '45 minutes'),
  ('83010000-0000-0000-0000-000000000006'::uuid, '83000000-0000-0000-0000-000000000003'::uuid, 200, 310, '2027-03-01', 205, true, null, now() - interval '15 minutes')
on conflict (id) do nothing;

-- =========================================================
-- 28. STORE CONVERSION (quote requests, visual assets, leads,
--     proposal drafts, analytics events)
-- =========================================================
insert into public.store_quote_requests (id, status, customer, items, selected_promo_ids, recommended_bundle_ids, notes) values
  ('83200000-0000-0000-0000-000000000001'::uuid, 'submitted', jsonb_build_object('name', 'Jennifer Adams', 'email', 'jennifer.adams@harborview.example', 'company', 'Harborview Health'), '[{"product_slug": "managed-workstation", "quantity": 50}]'::jsonb, '{70600000-0000-0000-0000-000000000001}'::text[], '{bundle-essentials}'::text[], 'Requested via landing page.'),
  ('83200000-0000-0000-0000-000000000002'::uuid, 'reviewed', jsonb_build_object('name', 'Robert Kim', 'email', 'robert.kim@brightline.example', 'company', 'Brightline Retail'), '[{"product_slug": "store-it-support", "quantity": 30}]'::jsonb, '{}'::text[], '{}'::text[], 'Follow-up call completed.'),
  ('83200000-0000-0000-0000-000000000003'::uuid, 'converted', jsonb_build_object('name', 'David Park', 'email', 'david.park@acme.example', 'company', 'Acme'), '[{"product_slug": "managed-workstation", "quantity": 25}]'::jsonb, '{}'::text[], '{bundle-essentials}'::text[], 'Converted to a signed proposal.'),
  ('83200000-0000-0000-0000-000000000004'::uuid, 'closed', jsonb_build_object('name', 'Lisa Chen', 'email', 'lisa.chen@northwind.example', 'company', 'Northwind Traders'), '[{"product_slug": "managed-workstation", "quantity": 100}]'::jsonb, '{}'::text[], '{}'::text[], 'Unresponsive after multiple follow-ups.')
on conflict (id) do nothing;

insert into public.store_visual_assets (id, linked_entity_type, linked_entity_id, asset_type, icon_name, accent_color, image_url, alt_text, decorative, provenance, license_notes) values
  ('83210000-0000-0000-0000-000000000001'::uuid, 'promo', '70600000-0000-0000-0000-000000000001', 'icon', 'shield', '#059669', null, 'Security essentials badge', false, 'seed', 'Internal promo asset.'),
  ('83210000-0000-0000-0000-000000000002'::uuid, 'quote_request', '83200000-0000-0000-0000-000000000001', 'image', null, null, 'https://example.invalid/assets/quote-harborview.png', 'Quote summary graphic', false, 'generated', null),
  ('83210000-0000-0000-0000-000000000003'::uuid, 'category', 'store-it-support', 'image', null, '#F59E0B', 'https://example.invalid/assets/cat-it-support.png', 'IT support category', true, 'seed', null)
on conflict (id) do nothing;

insert into public.store_leads (id, quote_request_id, status, lead_score, lead_band, score_breakdown, assigned_owner, follow_up_due_at) values
  ('83220000-0000-0000-0000-000000000001'::uuid, '83200000-0000-0000-0000-000000000001'::uuid, 'qualified', 78, 'high', '[{"factor": "budget", "score": 20}, {"factor": "timeline", "score": 18}]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() + interval '1 day'),
  ('83220000-0000-0000-0000-000000000002'::uuid, '83200000-0000-0000-0000-000000000002'::uuid, 'contacted', 55, 'medium', '[{"factor": "budget", "score": 12}, {"factor": "timeline", "score": 10}]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, now() + interval '3 days'),
  ('83220000-0000-0000-0000-000000000003'::uuid, '83200000-0000-0000-0000-000000000003'::uuid, 'converted', 92, 'high', '[{"factor": "budget", "score": 25}, {"factor": "timeline", "score": 22}]'::jsonb, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, null),
  ('83220000-0000-0000-0000-000000000004'::uuid, '83200000-0000-0000-0000-000000000004'::uuid, 'lost', 20, 'low', '[{"factor": "budget", "score": 5}, {"factor": "timeline", "score": 2}]'::jsonb, null, null)
on conflict (id) do nothing;

insert into public.store_proposal_drafts (id, quote_request_id, status, sections, generated_by, reviewed_by) values
  ('83230000-0000-0000-0000-000000000001'::uuid, '83200000-0000-0000-0000-000000000003'::uuid, 'draft_internal', jsonb_build_object('executive_summary', '25 workstation expansion for Acme finance team.', 'pricing', jsonb_build_object('total', 21000)), '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, null),
  ('83230000-0000-0000-0000-000000000002'::uuid, '83200000-0000-0000-0000-000000000001'::uuid, 'in_review', jsonb_build_object('executive_summary', 'Managed workstation + HIPAA review for Harborview.', 'pricing', jsonb_build_object('total', 42500)), '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid),
  ('83230000-0000-0000-0000-000000000003'::uuid, '83200000-0000-0000-0000-000000000002'::uuid, 'approved', jsonb_build_object('executive_summary', 'Store IT support for Brightline locations.', 'pricing', jsonb_build_object('total', 15900)), '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid, '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid)
on conflict (id) do nothing;

insert into public.store_analytics_events (event, page, product_id, category_id, promo_id, quiz_id, quote_id, campaign_id, metadata, anonymous_id, ip_address, user_agent) values
  ('product_view', '/store/products', 'managed-workstation', null, null, null, null, null, jsonb_build_object('source', 'seed'), 'anon-seed-0001', '127.0.0.1', 'seed-bot/1.0'),
  ('quote_submit', '/store/quote', null, null, '70600000-0000-0000-0000-000000000001', null, null, null, jsonb_build_object('source', 'seed'), 'anon-seed-0002', '127.0.0.1', 'seed-bot/1.0'),
  ('promo_click', '/store', null, null, '70600000-0000-0000-0000-000000000002', null, null, null, jsonb_build_object('source', 'seed'), 'anon-seed-0003', '127.0.0.1', 'seed-bot/1.0'),
  ('category_view', '/store/categories', null, 'store-it-support', null, null, null, null, jsonb_build_object('source', 'seed'), 'anon-seed-0004', '127.0.0.1', 'seed-bot/1.0'),
  ('quiz_start', '/store/quiz', null, null, null, 'quiz-cyber-baseline', null, null, jsonb_build_object('source', 'seed'), 'anon-seed-0005', '127.0.0.1', 'seed-bot/1.0');

-- =========================================================
-- 29. CUSTOM FORMS / CLIENT RUNBOOKS / BUDGET ROADMAPS
--     (5302074 final-batch tables not covered by seeds 00-05)
-- =========================================================
insert into public.custom_forms (id, organization_id, form_name, form_description, form_fields, is_active, submission_count, created_by) values
  ('83400000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'New User Access Request', 'Collect details for new user access.', '[{"key": "employee_name", "label": "Employee Name", "type": "text"}]'::jsonb, true, 4, 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('83400000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Vendor Access Request', 'Request vendor access at a store.', '[{"key": "vendor", "label": "Vendor", "type": "text"}]'::jsonb, true, 2, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('83400000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Equipment Loan', 'Request a loaner device.', '[{"key": "reason", "label": "Reason", "type": "textarea"}]'::jsonb, false, 0, 'c3000000-0000-4000-8000-000000000003'::uuid)
on conflict (id) do nothing;

insert into public.client_runbooks (id, organization_id, title, content, category, version, status, last_reviewed_at, next_review_at, created_by) values
  ('83410000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Runbook', 'Quick-reference runbook for Harborview Health Systems.', 'healthcare', '1.2', 'published', now() - interval '10 days', now() + interval '80 days', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('83410000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Brightline Runbook', 'Store operations runbook for Brightline.', 'retail', '1.0', 'draft', null, null, 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('83410000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Summit Runbook', 'Advisor-facing runbook for Summit Financial.', 'finance', '1.1', 'published', now() - interval '5 days', now() + interval '85 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.budget_roadmaps (id, organization_id, item_name, category, estimated_cost, fiscal_year, quarter, priority, status, notes, created_by) values
  ('83420000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Network Segmentation', 'security', 32500.00, 2027, 1, 'high', 'approved', 'Approved in Q4 planning.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('83420000-0000-0000-0000-000000000002'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'DLP Deployment', 'security', 18000.00, 2027, 2, 'medium', 'planned', 'Pending M365 DLP licensing decision.', 'd4000000-0000-4000-8000-000000000003'::uuid),
  ('83420000-0000-0000-0000-000000000003'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Store 42 Refresh', 'hardware', 42000.00, 2026, 4, 'high', 'in_progress', 'Q4 refresh underway.', 'd4000000-0000-4000-8000-000000000001'::uuid),
  ('83420000-0000-0000-0000-000000000004'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Zero Trust Rollout', 'security', 39200.00, 2027, 1, 'high', 'approved', 'Approved.', 'd4000000-0000-4000-8000-000000000004'::uuid),
  ('83420000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Warehouse Cameras', 'hardware', 6500.00, 2027, 1, 'low', 'planned', 'Proposed for dock coverage.', 'f1000000-0000-4000-8000-000000000005'::uuid)
on conflict (id) do nothing;

-- =========================================================
-- 30. AUDIT LOGS (a few representative rows for activity feeds)
-- =========================================================
insert into public.audit_logs (id, organization_id, actor_user_id, actor_type, action, entity_type, entity_id, ip_address, user_agent, metadata) values
  ('83300000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'd4000000-0000-4000-8000-000000000001'::uuid, 'user', 'finding.status.update', 'finding', '55600000-0000-0000-0000-000000000001', '10.0.0.5'::inet, 'seed-agent/1.0', jsonb_build_object('from', 'open', 'to', 'in_review')),
  ('83300000-0000-0000-0000-000000000002'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'd4000000-0000-4000-8000-000000000002'::uuid, 'user', 'incident.status.update', 'incident', '81510000-0000-0000-0000-000000000002', '10.0.0.6'::inet, 'seed-agent/1.0', jsonb_build_object('from', 'detected', 'to', 'closed')),
  ('83300000-0000-0000-0000-000000000003'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'c3000000-0000-4000-8000-000000000001'::uuid, 'user', 'proposal.approve', 'proposal', '81100000-0000-0000-0000-000000000003', '10.0.0.7'::inet, 'seed-agent/1.0', jsonb_build_object('approved', true)),
  ('83300000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'f1000000-0000-4000-8000-000000000004'::uuid, 'user', 'proposal.create', 'proposal', '81100000-0000-0000-0000-000000000004', '10.0.0.8'::inet, 'seed-agent/1.0', jsonb_build_object('status', 'draft')),
  ('83300000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'f1000000-0000-4000-8000-000000000005'::uuid, 'user', 'ticket.comment.add', 'ticket', '52600000-0000-0000-0000-000000000002', '10.0.0.9'::inet, 'seed-agent/1.0', jsonb_build_object('internal', false))
on conflict (id) do nothing;

commit;
