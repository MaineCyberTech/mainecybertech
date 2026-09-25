-- =========================================================
-- 5302121: Permission edge cases + thin-coverage demo data
--
-- Mirrors supabase/seeds/07_permission_edge_cases.sql so the
-- edge-status organizations, permission-case users, second
-- webhook, and public_interactions rows reach HOSTED databases
-- (seeds only run for local reset and E2E; migrations run
-- everywhere via supabase db push).
--
-- SAFETY GUARD: the whole block is skipped when the database
-- already contains production-like tenants (any organization
-- with a real domain, i.e. not *.example / *.local). Demo
-- accounts all use the password: 1 (dev only).
-- =========================================================

do $$
begin
  if exists (
    select 1 from public.organizations
    where primary_domain is not null
      and primary_domain not like '%.example'
      and primary_domain not like '%.local'
  ) then
    raise notice '5302121: production-like organization domains detected - skipping demo permission data';
    return;
  end if;


-- =========================================================
-- 0. EDGE-STATUS ORGANIZATIONS
-- =========================================================
insert into public.organizations (
  id, name, slug, status, primary_domain, support_plan, brand_color, accent_color, settings
)
values
  ('66666666-6666-4666-8666-666666666666'::uuid, 'Westbrook Dental', 'westbrook', 'pending'::public.org_status, 'westbrook.example', 'Managed IT Standard', '#0EA5E9', '#F59E0B', jsonb_build_object('seeded', true, 'industry', 'healthcare')),
  ('77777777-7777-4777-8777-777777777777'::uuid, 'Portland Legal', 'portland', 'suspended'::public.org_status, 'portland.example', 'Managed Security Premium', '#6366F1', '#EF4444', jsonb_build_object('seeded', true, 'industry', 'legal'))
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  primary_domain = excluded.primary_domain,
  support_plan = excluded.support_plan,
  brand_color = excluded.brand_color,
  accent_color = excluded.accent_color,
  settings = excluded.settings,
  updated_at = now();

insert into public.organization_domains (organization_id, domain, auto_approve)
values
  ('66666666-6666-4666-8666-666666666666'::uuid, 'westbrook.example', false),
  ('77777777-7777-4777-8777-777777777777'::uuid, 'portland.example', false)
on conflict (domain) do update
set organization_id = excluded.organization_id,
    auto_approve = excluded.auto_approve;

-- =========================================================
-- 1. NEW USERS (5 accounts, password: 1)
-- =========================================================
delete from auth.identities
where user_id in (
  'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000004',
  'e1000000-0000-4000-8000-000000000005'
)
   or provider_id in (
  'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000004',
  'e1000000-0000-4000-8000-000000000005'
)
   or id in (
  'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000004',
  'e1000000-0000-4000-8000-000000000005'
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
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'paige.norton@westbrook.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-03 08:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-03 08:00:00+00', '2026-08-03 08:00:00+00', '555-0801', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'devon.marsh@acme.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-03 08:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-03 08:05:00+00', '2026-08-03 08:05:00+00', '555-0802', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'ines.ribeiro@harborview.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-03 08:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-03 08:10:00+00', '2026-08-03 08:10:00+00', '555-0803', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'theo.novak@brightline.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-03 08:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-03 08:15:00+00', '2026-08-03 08:15:00+00', '555-0804', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'wren.callahan@summit.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-03 08:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-03 08:20:00+00', '2026-08-03 08:20:00+00', '555-0805', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
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
  ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', '{"sub": "e1000000-0000-4000-8000-000000000001", "email": "paige.norton@westbrook.example", "email_verified": true}'::jsonb, 'email', 'e1000000-0000-4000-8000-000000000001', NULL, '2026-08-03 08:00:00+00', '2026-08-03 08:00:00+00'),
  ('e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', '{"sub": "e1000000-0000-4000-8000-000000000002", "email": "devon.marsh@acme.example", "email_verified": true}'::jsonb, 'email', 'e1000000-0000-4000-8000-000000000002', NULL, '2026-08-03 08:05:00+00', '2026-08-03 08:05:00+00'),
  ('e1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003', '{"sub": "e1000000-0000-4000-8000-000000000003", "email": "ines.ribeiro@harborview.example", "email_verified": true}'::jsonb, 'email', 'e1000000-0000-4000-8000-000000000003', NULL, '2026-08-03 08:10:00+00', '2026-08-03 08:10:00+00'),
  ('e1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000004', '{"sub": "e1000000-0000-4000-8000-000000000004", "email": "theo.novak@brightline.example", "email_verified": true}'::jsonb, 'email', 'e1000000-0000-4000-8000-000000000004', NULL, '2026-08-03 08:15:00+00', '2026-08-03 08:15:00+00'),
  ('e1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000005', '{"sub": "e1000000-0000-4000-8000-000000000005", "email": "wren.callahan@summit.example", "email_verified": true}'::jsonb, 'email', 'e1000000-0000-4000-8000-000000000005', NULL, '2026-08-03 08:20:00+00', '2026-08-03 08:20:00+00')
on conflict (id) do nothing;

insert into public.profiles (
  id, email, full_name, phone, title, is_super_admin, default_organization_id, metadata
)
select
  u.user_id, u.email, u.full_name, u.phone, u.title, u.is_super_admin, u.default_org_id,
  jsonb_build_object('seeded', true, 'demo_label', u.demo_label)
from (
  values
    ('e1000000-0000-4000-8000-000000000001'::uuid, 'paige.norton@westbrook.example', 'Paige Norton', '555-0801', 'Office Manager', false, '66666666-6666-4666-8666-666666666666'::uuid, 'paige@westbrook.example'),
    ('e1000000-0000-4000-8000-000000000002'::uuid, 'devon.marsh@acme.example', 'Devon Marsh', '555-0802', 'IT Consultant', false, '11111111-1111-1111-1111-111111111111'::uuid, 'devon@acme.example'),
    ('e1000000-0000-4000-8000-000000000003'::uuid, 'ines.ribeiro@harborview.example', 'Ines Ribeiro', '555-0803', 'Compliance Director', false, '33333333-3333-4333-8333-333333333333'::uuid, 'ines@harborview.example'),
    ('e1000000-0000-4000-8000-000000000004'::uuid, 'theo.novak@brightline.example', 'Theo Novak', '555-0804', 'On-Site Technician', false, '44444444-4444-4444-8444-444444444444'::uuid, 'theo@brightline.example'),
    ('e1000000-0000-4000-8000-000000000005'::uuid, 'wren.callahan@summit.example', 'Wren Callahan', '555-0805', 'Office Coordinator', false, '55555555-5555-4555-8555-555555555555'::uuid, 'wren@summit.example')
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

-- =========================================================
-- 2. MEMBERSHIPS (edge cases)
--    Devon Marsh is deliberately multi-role: client_admin @ Acme
--    AND technician @ Northwind. Paige Norton has NO memberships.
-- =========================================================
with membership_rows(user_id, organization_id, role_key, status, job_title, is_billing_contact, is_security_contact) as (
  values
    ('e1000000-0000-4000-8000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'client_admin', 'approved', 'IT Consultant', true, true),
    ('e1000000-0000-4000-8000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'technician', 'approved', 'IT Consultant', false, false),
    ('e1000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'client_admin', 'approved', 'Compliance Director', true, true),
    ('e1000000-0000-4000-8000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'technician', 'approved', 'On-Site Technician', false, true),
    ('e1000000-0000-4000-8000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'client_user', 'approved', 'Office Coordinator', false, false)
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

-- =========================================================
-- 3. USER PERMISSION OVERRIDES (new edge cases)
--    - DENY organizations:view for a client_admin (admin-scope deny)
--    - ALLOW users:view for a technician (admin-scope allow)
--    - ALLOW tickets:delete for a client_user (core allow, lowest role)
-- =========================================================
insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '33333333-3333-4333-8333-333333333333'::uuid, 'e1000000-0000-4000-8000-000000000003'::uuid, p.id, false
from public.permissions p where p.module_key = 'organizations' and p.action_key = 'view'
on conflict (organization_id, user_id, permission_id) do nothing;

insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '44444444-4444-4444-8444-444444444444'::uuid, 'e1000000-0000-4000-8000-000000000004'::uuid, p.id, true
from public.permissions p where p.module_key = 'users' and p.action_key = 'view'
on conflict (organization_id, user_id, permission_id) do nothing;

insert into public.user_permission_overrides (organization_id, user_id, permission_id, is_allowed)
select '55555555-5555-4555-8555-555555555555'::uuid, 'e1000000-0000-4000-8000-000000000005'::uuid, p.id, true
from public.permissions p where p.module_key = 'tickets' and p.action_key = 'delete'
on conflict (organization_id, user_id, permission_id) do nothing;

-- =========================================================
-- 4. NOTIFICATION PREFERENCES (new users)
-- =========================================================
insert into public.notification_preferences (organization_id, user_id, module_key, channel, enabled)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'e1000000-0000-4000-8000-000000000002'::uuid, 'tickets', 'email', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'e1000000-0000-4000-8000-000000000002'::uuid, 'tickets', 'in_app', false),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'e1000000-0000-4000-8000-000000000003'::uuid, 'documents', 'in_app', true),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'e1000000-0000-4000-8000-000000000004'::uuid, 'projects', 'email', true),
  ('55555555-5555-4555-8555-555555555555'::uuid, 'e1000000-0000-4000-8000-000000000005'::uuid, 'tickets', 'in_app', true)
on conflict (organization_id, user_id, module_key, channel) do nothing;

-- =========================================================
-- 5. NOTIFICATIONS (new users)
-- =========================================================
insert into public.notifications (user_id, organization_id, title, body, module, module_id, action, read, created_at)
values
  ('e1000000-0000-4000-8000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Approval Needed', 'A change request awaits your approval.', 'approvals', '57600000-0000-0000-0000-000000000001', 'created', false, now() - interval '2 hours'),
  ('e1000000-0000-4000-8000-000000000003'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Document Shared', 'A HIPAA policy document was shared with you.', 'documents', '54600000-0000-0000-0000-000000000001', 'shared', false, now() - interval '1 day'),
  ('e1000000-0000-4000-8000-000000000004'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Task Assigned', 'You were assigned "Replace switch at Store 17".', 'projects', '53700000-0000-0000-0000-000000000003', 'assigned', false, now() - interval '45 minutes'),
  ('e1000000-0000-4000-8000-000000000005'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 'Ticket Updated', 'Your ticket "Client portal enrollment" was updated.', 'tickets', '52600000-0000-0000-0000-000000000007', 'updated', true, now() - interval '3 hours')
on conflict do nothing;

-- =========================================================
-- 6. SECOND WEBHOOK ENDPOINT + DELIVERY LOG (Harborview)
--    Exercises the webhook detail UI with multi-org data and
--    success/failed/pending delivery states.
-- =========================================================
insert into public.webhook_endpoints (
  id, organization_id, name, url, secret, events, is_active, created_by
)
values (
  '63000000-0000-0000-0000-000000000001'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  'Harborview Teams Alerts',
  'https://outlook.office.com/webhook/harborview-demo',
  'whsec_harborview_demo',
  '{incident.created,incident.updated,ticket.created}',
  true,
  '66ce903f-6fe0-45da-878b-a0398e6b1981'::uuid
) on conflict (id) do nothing;

insert into public.webhook_deliveries (
  id, webhook_id, event, status, request_body, response_status, response_body, duration_ms, created_at
)
values
  (
    '63100000-0000-0000-0000-000000000001'::uuid,
    '63000000-0000-0000-0000-000000000001'::uuid,
    'incident.created',
    'success',
    jsonb_build_object('event', 'incident.created', 'data', jsonb_build_object('id', '81510000-0000-0000-0000-000000000001')),
    200,
    'ok',
    190,
    now() - interval '5 days'
  ),
  (
    '63100000-0000-0000-0000-000000000002'::uuid,
    '63000000-0000-0000-0000-000000000001'::uuid,
    'ticket.created',
    'failed',
    jsonb_build_object('event', 'ticket.created'),
    408,
    'Timeout',
    15000,
    now() - interval '2 days'
  ),
  (
    '63100000-0000-0000-0000-000000000003'::uuid,
    '63000000-0000-0000-0000-000000000001'::uuid,
    'incident.updated',
    'pending',
    jsonb_build_object('event', 'incident.updated'),
    null,
    null,
    null,
    now() - interval '10 minutes'
  )
on conflict (id) do nothing;

update public.webhook_endpoints
set
  last_success_at = now() - interval '5 days',
  last_failure_at = now() - interval '2 days',
  last_error = 'HTTP 408'
where id = '63000000-0000-0000-0000-000000000001'::uuid;

-- =========================================================
-- 7. PUBLIC INTERACTIONS (contact-form rows for retention worker)
-- =========================================================
insert into public.public_interactions (
  id, ip_address, location, user_agent, platform, referrer, created_at, status,
  company_name, client_name, client_email, client_phone, services_requested,
  employees, urgency, client_message, submitted_at
)
values
  ('64000000-0000-0000-0000-000000000001'::uuid, '198.51.100.10', 'Portland, ME', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'https://www.mainecybertech.us/', now() - interval '60 days', 'submitted', 'Westbrook Dental', 'Paige Norton', 'paige.norton@westbrook.example', '555-0801', 'Managed IT, Security Review', '11-25', '2-4 weeks', 'Interested in managed IT for a dental practice with 3 locations.', now() - interval '60 days'),
  ('64000000-0000-0000-0000-000000000002'::uuid, '198.51.100.42', 'Portland, ME', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', 'mobile', 'https://www.mainecybertech.us/services', now() - interval '3 days', 'submitted', 'Portland Legal', 'Matt Oakes', 'matt@portlandlaw.example', '555-0802', 'Microsoft 365, Backup', '1-10', 'within a week', 'Need M365 tenant cleanup and backup review before an audit.', now() - interval '3 days'),
  ('64000000-0000-0000-0000-000000000003'::uuid, '203.0.113.7', 'Bangor, ME', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', null, now() - interval '90 days', 'started', null, 'Anonymous Visitor', null, null, 'Zero Trust', '51-100', null, null, null)
on conflict (id) do nothing;

-- =========================================================
-- 8. SATISFACTION PULSE (cross-org scheduling exercise)
-- =========================================================
insert into public.satisfaction_pulse_templates (id, organization_id, name, description, type, questions, is_active, created_by)
values
  ('64100000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Harborview Quarterly Pulse', 'Quarterly support pulse for Harborview Health Systems.', 'nps', '[{"text": "How likely are you to recommend us?", "type": "rating", "max": 10}]'::jsonb, true, 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;

insert into public.satisfaction_pulse_schedules (id, organization_id, template_id, name, trigger_type, trigger_config, frequency, cron_expression, is_active, last_run_at, next_run_at, created_by)
values
  ('64110000-0000-0000-0000-000000000001'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, '64100000-0000-0000-0000-000000000001'::uuid, 'Harborview Quarterly Pulse', 'scheduled', jsonb_build_object(), 'quarterly', '0 0 1 1 *', true, now() - interval '30 days', now() + interval '30 days', 'd4000000-0000-4000-8000-000000000004'::uuid)
on conflict (id) do nothing;


end $$;

