-- =========================================================
-- 5302128: Expanded role catalog
--
-- Adds 8 roles to cover the real MSP + client user base:
--   MSP internal (platform-admins, work across all tenants):
--     dispatcher            - helpdesk intake/triage
--     engineer              - ops + field work (tickets, projects, assets,
--                              monitors, backups, field-services, light security)
--     security-analyst      - security domain (m365, endpoints, patch,
--                              incidents, risk, phishing, dmarc, compliance,
--                              scorecards)
--     project-manager       - projects, proposals, QBR, catalog, vendors,
--                              budgets, procurement, approvals
--     finance               - billing, licenses, vendors, procurement,
--                              budgets, saas-audit, service-catalog, audit
--     onboarding-specialist - onboarding/offboarding/command-center,
--                              training, forms, satisfaction, file-requests
--   Client (org-scoped):
--     client-viewer         - read-only portal access
--     client-billing        - billing + invoices (view/manage)
--
-- The roles + permission assignments are REAL configuration (unguarded,
-- needed in every environment). The demo user accounts at the bottom are
-- dev-only and guarded by the production-domain check like 5302119.
-- =========================================================

-- ---------------------------------------------------------
-- 1. ROLES
-- ---------------------------------------------------------
insert into public.roles (id, key, name, description, is_system) values
  ('53000000-0000-4000-8000-000000000001'::uuid, 'dispatcher', 'Dispatcher', 'Helpdesk intake and ticket triage', true),
  ('53000000-0000-4000-8000-000000000002'::uuid, 'engineer', 'Engineer', 'Operations and field engineer', true),
  ('53000000-0000-4000-8000-000000000003'::uuid, 'security-analyst', 'Security Analyst', 'Security operations analyst', true),
  ('53000000-0000-4000-8000-000000000004'::uuid, 'project-manager', 'Project Manager', 'Client project and proposal manager', true),
  ('53000000-0000-4000-8000-000000000005'::uuid, 'finance', 'Finance', 'Billing, licensing, and procurement', true),
  ('53000000-0000-4000-8000-000000000006'::uuid, 'onboarding-specialist', 'Onboarding Specialist', 'Client onboarding and training specialist', true),
  ('53000000-0000-4000-8000-000000000007'::uuid, 'client-viewer', 'Client Viewer', 'Read-only client portal access', true),
  ('53000000-0000-4000-8000-000000000008'::uuid, 'client-billing', 'Client Billing', 'Client billing and invoice contact', true)
on conflict (id) do update
set key = excluded.key, name = excluded.name, description = excluded.description, is_system = excluded.is_system;

-- ---------------------------------------------------------
-- 2. PERMISSION ASSIGNMENTS
-- ---------------------------------------------------------
-- Dispatcher: helpdesk intake/triage + read-only visibility
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'dispatcher'
  and (
    (p.module_key = 'tickets' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'search' and p.action_key = 'view')
    or (p.module_key = 'timeline' and p.action_key = 'view')
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
    or (p.module_key = 'documents' and p.action_key = 'view')
    or (p.module_key = 'projects' and p.action_key = 'view')
    or (p.module_key = 'assets' and p.action_key = 'view')
    or (p.module_key = 'sla' and p.action_key = 'view')
  )
on conflict (role_id, permission_id) do nothing;

-- Engineer: ops + field services + light security
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'engineer'
  and (
    (p.module_key = 'tickets' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'projects' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'assets' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'findings' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'documents' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'domain-monitors' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'website-monitors' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'uptime-monitor' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'status' and p.action_key = 'view')
    or (p.module_key = 'status-pages' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'backup-dr' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'field-services' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'camera-calculator' and p.action_key in ('view', 'create'))
    or (p.module_key = 'network-port-maps' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'hardware-staging' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'time-entries' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendor-contracts' and p.action_key = 'view')
    or (p.module_key = 'vendor-contacts' and p.action_key = 'view')
    or (p.module_key = 'service-catalog' and p.action_key = 'view')
    or (p.module_key = 'sla' and p.action_key = 'view')
    or (p.module_key = 'change-requests' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'risk-register' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'incidents' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'incident-response' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'break-glass' and p.action_key = 'view')
    or (p.module_key = 'id-verify' and p.action_key = 'view')
    or (p.module_key = 'identity-verification' and p.action_key = 'view')
    or (p.module_key = 'patch-compliance' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'endpoint-security' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'm365-hardening' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'runbooks' and p.action_key = 'view')
    or (p.module_key = 'sop-library' and p.action_key = 'view')
    or (p.module_key = 'automation' and p.action_key = 'view')
    or (p.module_key = 'client-knowledge-base' and p.action_key = 'view')
    or (p.module_key = 'compliance-readiness' and p.action_key = 'view')
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'search' and p.action_key = 'view')
    or (p.module_key = 'timeline' and p.action_key = 'view')
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
  )
on conflict (role_id, permission_id) do nothing;

-- Security Analyst: security domain + read-only ops visibility
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'security-analyst'
  and (
    (p.module_key = 'm365-hardening' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'endpoint-security' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'patch-compliance' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'incidents' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'incident-response' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'identity-verification' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'id-verify' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'break-glass' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'risk-register' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'findings' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'phishing-simulations' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'dmarc-coach' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'dmarc' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'compliance-readiness' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'scoreboard' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'tabletop' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'governance' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'change-requests' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'retention' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'security-suite' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'security-ops' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'onboarding' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'offboarding' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'domain-monitors' and p.action_key = 'view')
    or (p.module_key = 'website-monitors' and p.action_key = 'view')
    or (p.module_key = 'uptime-monitor' and p.action_key = 'view')
    or (p.module_key = 'backup-dr' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'search' and p.action_key = 'view')
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
    or (p.module_key = 'tickets' and p.action_key = 'view')
    or (p.module_key = 'documents' and p.action_key = 'view')
    or (p.module_key = 'audit' and p.action_key in ('view', 'export'))
    or (p.module_key = 'sla' and p.action_key = 'view')
    or (p.module_key = 'insurance-binder' and p.action_key = 'view')
  )
on conflict (role_id, permission_id) do nothing;

-- Project Manager: project/proposal/QBR/vendor/budget domain
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'project-manager'
  and (
    (p.module_key = 'projects' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'proposals' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'qbr' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'service-catalog' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'time-entries' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'budgets' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'procurement' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendors' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendor-contracts' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendor-contacts' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'approvals' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'tickets' and p.action_key = 'view')
    or (p.module_key = 'documents' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'findings' and p.action_key = 'view')
    or (p.module_key = 'risk-register' and p.action_key = 'view')
    or (p.module_key = 'client-onboarding-command-center' and p.action_key = 'view')
    or (p.module_key = 'dynamic-forms' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'satisfaction-pulse' and p.action_key = 'view')
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'search' and p.action_key = 'view')
    or (p.module_key = 'timeline' and p.action_key = 'view')
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
    or (p.module_key = 'sla' and p.action_key = 'view')
  )
on conflict (role_id, permission_id) do nothing;

-- Finance: billing, licensing, procurement, audit
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'finance'
  and (
    (p.module_key = 'billing' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'licenses' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'license-optimizer' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendors' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendor-contracts' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendor-contacts' and p.action_key = 'view')
    or (p.module_key = 'procurement' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'budgets' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'saas-audit' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'time-entries' and p.action_key = 'view')
    or (p.module_key = 'service-catalog' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'insurance-binder' and p.action_key = 'view')
    or (p.module_key = 'audit' and p.action_key in ('view', 'export'))
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'search' and p.action_key = 'view')
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
    or (p.module_key = 'documents' and p.action_key = 'view')
    or (p.module_key = 'projects' and p.action_key = 'view')
    or (p.module_key = 'proposals' and p.action_key = 'view')
    or (p.module_key = 'qbr' and p.action_key = 'view')
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'store' and p.action_key = 'view')
  )
on conflict (role_id, permission_id) do nothing;

-- Onboarding Specialist: onboarding, training, forms, satisfaction
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'onboarding-specialist'
  and (
    (p.module_key = 'onboarding' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'offboarding' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'client-onboarding-command-center' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'break-glass' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'id-verify' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'identity-verification' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'training-hub' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'dynamic-forms' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'satisfaction-pulse' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'file-requests' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'vendor-contracts' and p.action_key = 'view')
    or (p.module_key = 'vendor-contacts' and p.action_key = 'view')
    or (p.module_key = 'documents' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'tickets' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'search' and p.action_key = 'view')
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
    or (p.module_key = 'training-modules' and p.action_key in ('view', 'create', 'edit'))
    or (p.module_key = 'client-knowledge-base' and p.action_key in ('view', 'create', 'edit'))
  )
on conflict (role_id, permission_id) do nothing;

-- Client Viewer: read-only across the portal
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'client-viewer'
  and p.action_key = 'view'
  and p.scope in ('both', 'portal')
on conflict (role_id, permission_id) do nothing;

-- Client Billing: billing + invoice visibility
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'client-billing'
  and (
    (p.module_key = 'billing' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'documents' and p.action_key = 'view')
    or (p.module_key = 'service-catalog' and p.action_key = 'view')
    or (p.module_key = 'dashboard' and p.action_key = 'view')
    or (p.module_key = 'notifications' and p.action_key in ('view', 'manage'))
    or (p.module_key = 'profile' and p.action_key in ('view', 'edit'))
    or (p.module_key = 'store' and p.action_key = 'view')
    or (p.module_key = 'projects' and p.action_key = 'view')
    or (p.module_key = 'proposals' and p.action_key = 'view')
    or (p.module_key = 'qbr' and p.action_key = 'view')
  )
on conflict (role_id, permission_id) do nothing;

-- ---------------------------------------------------------
-- 3. DEMO USERS (dev only - guarded like 5302119)
-- ---------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.organizations
    where primary_domain is not null
      and primary_domain not like '%.example'
      and primary_domain not like '%.local'
  ) then
    raise notice '5302128: production-like organization domains detected - skipping demo users';
    return;
  end if;

  -- Dispatcher / Engineer / Security Analyst / Project Manager / Finance /
  -- Onboarding Specialist get approved memberships in ALL 5 demo tenants.
  -- Client Viewer + Client Billing get memberships in Acme only.
  delete from auth.identities
  where user_id in (
    'f2000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002',
    'f2000000-0000-4000-8000-000000000003','f2000000-0000-4000-8000-000000000004',
    'f2000000-0000-4000-8000-000000000005','f2000000-0000-4000-8000-000000000006',
    'f3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000002'
  )
     or provider_id in (
    'f2000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000002',
    'f2000000-0000-4000-8000-000000000003','f2000000-0000-4000-8000-000000000004',
    'f2000000-0000-4000-8000-000000000005','f2000000-0000-4000-8000-000000000006',
    'f3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000002'
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
    ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'dispatcher.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:00:00+00', '2026-08-05 12:00:00+00', '555-0901', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'engineer.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:05:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:05:00+00', '2026-08-05 12:05:00+00', '555-0902', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'security.analyst.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:10:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:10:00+00', '2026-08-05 12:10:00+00', '555-0903', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'project.manager.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:15:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:15:00+00', '2026-08-05 12:15:00+00', '555-0904', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'finance.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:20:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:20:00+00', '2026-08-05 12:20:00+00', '555-0905', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'onboarding.specialist.real@mainecybertech.local', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:25:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:25:00+00', '2026-08-05 12:25:00+00', '555-0906', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f3000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'viewer.real@acme.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:30:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:30:00+00', '2026-08-05 12:30:00+00', '555-0907', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
    ('00000000-0000-0000-0000-000000000000', 'f3000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'billing.real@acme.example', '$2a$10$WBaKteRHgBxhGdSfULyK0eqwF2ccw0JygnROECp.fFpypkkkTV1NC', '2026-08-05 12:35:00+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, NULL, '2026-08-05 12:35:00+00', '2026-08-05 12:35:00+00', '555-0908', NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
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
    ('f2000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', '{"sub": "f2000000-0000-4000-8000-000000000001", "email": "dispatcher.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'f2000000-0000-4000-8000-000000000001', NULL, '2026-08-05 12:00:00+00', '2026-08-05 12:00:00+00'),
    ('f2000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000002', '{"sub": "f2000000-0000-4000-8000-000000000002", "email": "engineer.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'f2000000-0000-4000-8000-000000000002', NULL, '2026-08-05 12:05:00+00', '2026-08-05 12:05:00+00'),
    ('f2000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000003', '{"sub": "f2000000-0000-4000-8000-000000000003", "email": "security.analyst.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'f2000000-0000-4000-8000-000000000003', NULL, '2026-08-05 12:10:00+00', '2026-08-05 12:10:00+00'),
    ('f2000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000004', '{"sub": "f2000000-0000-4000-8000-000000000004", "email": "project.manager.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'f2000000-0000-4000-8000-000000000004', NULL, '2026-08-05 12:15:00+00', '2026-08-05 12:15:00+00'),
    ('f2000000-0000-4000-8000-000000000005', 'f2000000-0000-4000-8000-000000000005', '{"sub": "f2000000-0000-4000-8000-000000000005", "email": "finance.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'f2000000-0000-4000-8000-000000000005', NULL, '2026-08-05 12:20:00+00', '2026-08-05 12:20:00+00'),
    ('f2000000-0000-4000-8000-000000000006', 'f2000000-0000-4000-8000-000000000006', '{"sub": "f2000000-0000-4000-8000-000000000006", "email": "onboarding.specialist.real@mainecybertech.local", "email_verified": true}'::jsonb, 'email', 'f2000000-0000-4000-8000-000000000006', NULL, '2026-08-05 12:25:00+00', '2026-08-05 12:25:00+00'),
    ('f3000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', '{"sub": "f3000000-0000-4000-8000-000000000001", "email": "viewer.real@acme.example", "email_verified": true}'::jsonb, 'email', 'f3000000-0000-4000-8000-000000000001', NULL, '2026-08-05 12:30:00+00', '2026-08-05 12:30:00+00'),
    ('f3000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', '{"sub": "f3000000-0000-4000-8000-000000000002", "email": "billing.real@acme.example", "email_verified": true}'::jsonb, 'email', 'f3000000-0000-4000-8000-000000000002', NULL, '2026-08-05 12:35:00+00', '2026-08-05 12:35:00+00')
  on conflict (id) do nothing;

  insert into public.profiles (id, email, full_name, title, phone, default_organization_id, is_super_admin)
  values
    ('f2000000-0000-4000-8000-000000000001', 'dispatcher.real@mainecybertech.local', 'Dana Dispatcher', 'Service Desk Dispatcher', '555-0901', '11111111-1111-1111-1111-111111111111', false),
    ('f2000000-0000-4000-8000-000000000002', 'engineer.real@mainecybertech.local', 'Eli Engineer', 'Field Engineer', '555-0902', '11111111-1111-1111-1111-111111111111', false),
    ('f2000000-0000-4000-8000-000000000003', 'security.analyst.real@mainecybertech.local', 'Sasha Security', 'Security Analyst', '555-0903', '11111111-1111-1111-1111-111111111111', false),
    ('f2000000-0000-4000-8000-000000000004', 'project.manager.real@mainecybertech.local', 'Priya Projects', 'Project Manager', '555-0904', '11111111-1111-1111-1111-111111111111', false),
    ('f2000000-0000-4000-8000-000000000005', 'finance.real@mainecybertech.local', 'Frank Finance', 'Finance Manager', '555-0905', '11111111-1111-1111-1111-111111111111', false),
    ('f2000000-0000-4000-8000-000000000006', 'onboarding.specialist.real@mainecybertech.local', 'Ollie Onboarding', 'Onboarding Specialist', '555-0906', '11111111-1111-1111-1111-111111111111', false),
    ('f3000000-0000-4000-8000-000000000001', 'viewer.real@acme.example', 'Vera Viewer', 'Executive Viewer', '555-0907', '11111111-1111-1111-1111-111111111111', false),
    ('f3000000-0000-4000-8000-000000000002', 'billing.real@acme.example', 'Becca Billing', 'Accounts Payable', '555-0908', '11111111-1111-1111-1111-111111111111', false)
  on conflict (id) do update
  set email = excluded.email, full_name = excluded.full_name, title = excluded.title,
      phone = excluded.phone, default_organization_id = excluded.default_organization_id;

  -- MSP roles in all 5 tenants; client roles in Acme
  insert into public.memberships (
    organization_id, user_id, role_id, status, approved_by, approved_at, job_title
  )
  select m.organization_id, m.user_id, r.id, 'approved', '66ce903f-6fe0-45da-878b-a0398e6b1981', now(), m.job_title
  from (
    values
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f2000000-0000-4000-8000-000000000001'::uuid, 'dispatcher', 'Service Desk Dispatcher'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'f2000000-0000-4000-8000-000000000001'::uuid, 'dispatcher', 'Service Desk Dispatcher'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'f2000000-0000-4000-8000-000000000001'::uuid, 'dispatcher', 'Service Desk Dispatcher'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'f2000000-0000-4000-8000-000000000001'::uuid, 'dispatcher', 'Service Desk Dispatcher'),
      ('55555555-5555-4555-8555-555555555555'::uuid, 'f2000000-0000-4000-8000-000000000001'::uuid, 'dispatcher', 'Service Desk Dispatcher'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f2000000-0000-4000-8000-000000000002'::uuid, 'engineer', 'Field Engineer'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'f2000000-0000-4000-8000-000000000002'::uuid, 'engineer', 'Field Engineer'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'f2000000-0000-4000-8000-000000000002'::uuid, 'engineer', 'Field Engineer'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'f2000000-0000-4000-8000-000000000002'::uuid, 'engineer', 'Field Engineer'),
      ('55555555-5555-4555-8555-555555555555'::uuid, 'f2000000-0000-4000-8000-000000000002'::uuid, 'engineer', 'Field Engineer'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f2000000-0000-4000-8000-000000000003'::uuid, 'security-analyst', 'Security Analyst'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'f2000000-0000-4000-8000-000000000003'::uuid, 'security-analyst', 'Security Analyst'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'f2000000-0000-4000-8000-000000000003'::uuid, 'security-analyst', 'Security Analyst'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'f2000000-0000-4000-8000-000000000003'::uuid, 'security-analyst', 'Security Analyst'),
      ('55555555-5555-4555-8555-555555555555'::uuid, 'f2000000-0000-4000-8000-000000000003'::uuid, 'security-analyst', 'Security Analyst'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f2000000-0000-4000-8000-000000000004'::uuid, 'project-manager', 'Project Manager'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'f2000000-0000-4000-8000-000000000004'::uuid, 'project-manager', 'Project Manager'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'f2000000-0000-4000-8000-000000000004'::uuid, 'project-manager', 'Project Manager'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'f2000000-0000-4000-8000-000000000004'::uuid, 'project-manager', 'Project Manager'),
      ('55555555-5555-4555-8555-555555555555'::uuid, 'f2000000-0000-4000-8000-000000000004'::uuid, 'project-manager', 'Project Manager'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f2000000-0000-4000-8000-000000000005'::uuid, 'finance', 'Finance Manager'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'f2000000-0000-4000-8000-000000000005'::uuid, 'finance', 'Finance Manager'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'f2000000-0000-4000-8000-000000000005'::uuid, 'finance', 'Finance Manager'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'f2000000-0000-4000-8000-000000000005'::uuid, 'finance', 'Finance Manager'),
      ('55555555-5555-4555-8555-555555555555'::uuid, 'f2000000-0000-4000-8000-000000000005'::uuid, 'finance', 'Finance Manager'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f2000000-0000-4000-8000-000000000006'::uuid, 'onboarding-specialist', 'Onboarding Specialist'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'f2000000-0000-4000-8000-000000000006'::uuid, 'onboarding-specialist', 'Onboarding Specialist'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'f2000000-0000-4000-8000-000000000006'::uuid, 'onboarding-specialist', 'Onboarding Specialist'),
      ('44444444-4444-4444-8444-444444444444'::uuid, 'f2000000-0000-4000-8000-000000000006'::uuid, 'onboarding-specialist', 'Onboarding Specialist'),
      ('55555555-5555-4555-8555-555555555555'::uuid, 'f2000000-0000-4000-8000-000000000006'::uuid, 'onboarding-specialist', 'Onboarding Specialist'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f3000000-0000-4000-8000-000000000001'::uuid, 'client-viewer', 'Executive Viewer'),
      ('11111111-1111-1111-1111-111111111111'::uuid, 'f3000000-0000-4000-8000-000000000002'::uuid, 'client-billing', 'Accounts Payable')
  ) as m(organization_id, user_id, role_key, job_title)
  join public.roles r on r.key = m.role_key
  on conflict (organization_id, user_id) do update
  set role_id = excluded.role_id, status = excluded.status, job_title = excluded.job_title;

end $$;
