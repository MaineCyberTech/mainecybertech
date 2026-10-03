-- =========================================================
-- 5302118: Full module permission catalog + role assignments
--
-- Extends the permissions table with grouping metadata
-- (group_key, scope, label) and seeds a permission key for
-- EVERY module in the Admin Portal and Client Portal:
--   module:view, module:create, module:edit, module:delete
--   (+ module:manage / module:export where applicable)
--
-- Role assignments:
--   super_admin  -> every permission (also bypasses checks in API)
--   admin        -> every permission except :delete
--   client_admin -> portal-scoped modules: view/create/edit
--   technician   -> operational/security modules: view/edit
--   client_user  -> portal-scoped modules: view (+ create/edit on
--                   support-facing modules)
-- =========================================================

begin;

alter table public.permissions
  add column if not exists group_key text not null default 'core',
  add column if not exists scope text not null default 'both',
  add column if not exists label text;

insert into public.permissions (module_key, action_key, group_key, scope, label, description)
values
  -- ===================== CORE (both portals) =====================
  ('dashboard', 'view', 'core', 'both', 'Dashboard', 'View dashboard'),
  ('tickets', 'view', 'core', 'both', 'Tickets', 'View tickets'),
  ('tickets', 'create', 'core', 'both', 'Tickets', 'Create tickets'),
  ('tickets', 'edit', 'core', 'both', 'Tickets', 'Edit tickets'),
  ('tickets', 'delete', 'core', 'both', 'Tickets', 'Delete tickets'),
  ('documents', 'view', 'core', 'both', 'Documents', 'View documents'),
  ('documents', 'create', 'core', 'both', 'Documents', 'Upload documents'),
  ('documents', 'edit', 'core', 'both', 'Documents', 'Edit documents'),
  ('documents', 'delete', 'core', 'both', 'Documents', 'Delete documents'),
  ('projects', 'view', 'core', 'both', 'Projects', 'View projects'),
  ('projects', 'create', 'core', 'both', 'Projects', 'Create projects'),
  ('projects', 'edit', 'core', 'both', 'Projects', 'Edit projects'),
  ('projects', 'delete', 'core', 'both', 'Projects', 'Delete projects'),
  ('approvals', 'view', 'core', 'both', 'Approvals', 'View approval requests'),
  ('approvals', 'create', 'core', 'both', 'Approvals', 'Submit approval requests'),
  ('approvals', 'edit', 'core', 'both', 'Approvals', 'Update approval requests'),
  ('approvals', 'delete', 'core', 'both', 'Approvals', 'Delete approval requests'),
  ('notifications', 'view', 'core', 'both', 'Notifications', 'View notifications'),
  ('notifications', 'manage', 'core', 'both', 'Notifications', 'Manage notification preferences'),

  -- ===================== ADMIN =====================
  ('organizations', 'view', 'admin', 'admin', 'Organizations', 'View organizations'),
  ('organizations', 'create', 'admin', 'admin', 'Organizations', 'Create organizations'),
  ('organizations', 'edit', 'admin', 'admin', 'Organizations', 'Edit organizations'),
  ('organizations', 'delete', 'admin', 'admin', 'Organizations', 'Delete organizations'),
  ('users', 'view', 'admin', 'admin', 'Users', 'View users'),
  ('users', 'create', 'admin', 'admin', 'Users', 'Create users'),
  ('users', 'edit', 'admin', 'admin', 'Users', 'Edit users'),
  ('users', 'delete', 'admin', 'admin', 'Users', 'Delete users'),
  ('roles', 'view', 'admin', 'admin', 'Roles', 'View roles'),
  ('roles', 'create', 'admin', 'admin', 'Roles', 'Create roles'),
  ('roles', 'edit', 'admin', 'admin', 'Roles', 'Edit roles'),
  ('roles', 'delete', 'admin', 'admin', 'Roles', 'Delete roles'),
  ('memberships', 'view', 'admin', 'admin', 'Memberships', 'View memberships'),
  ('memberships', 'create', 'admin', 'admin', 'Memberships', 'Create memberships'),
  ('memberships', 'edit', 'admin', 'admin', 'Memberships', 'Edit memberships'),
  ('memberships', 'delete', 'admin', 'admin', 'Memberships', 'Delete memberships'),
  ('audit', 'view', 'admin', 'admin', 'Audit', 'View audit logs'),
  ('audit', 'export', 'admin', 'admin', 'Audit', 'Export audit logs'),
  ('billing', 'view', 'admin', 'both', 'Billing', 'View billing and invoices'),
  ('billing', 'manage', 'admin', 'both', 'Billing', 'Manage billing settings'),
  ('settings', 'view', 'admin', 'admin', 'Settings', 'View platform settings'),
  ('settings', 'manage', 'admin', 'admin', 'Settings', 'Manage platform settings'),
  ('bulk-invite', 'view', 'admin', 'admin', 'Bulk Invite', 'View bulk invite'),
  ('bulk-invite', 'create', 'admin', 'admin', 'Bulk Invite', 'Run bulk user imports'),

  -- ===================== SECURITY (both portals) =====================
  ('governance', 'view', 'security', 'both', 'Governance', 'View governance'),
  ('governance', 'create', 'security', 'both', 'Governance', 'Create governance items'),
  ('governance', 'edit', 'security', 'both', 'Governance', 'Edit governance items'),
  ('governance', 'delete', 'security', 'both', 'Governance', 'Delete governance items'),
  ('incidents', 'view', 'security', 'both', 'Incidents', 'View security incidents'),
  ('incidents', 'create', 'security', 'both', 'Incidents', 'Create security incidents'),
  ('incidents', 'edit', 'security', 'both', 'Incidents', 'Edit security incidents'),
  ('incidents', 'delete', 'security', 'both', 'Incidents', 'Delete security incidents'),
  ('break-glass', 'view', 'security', 'both', 'Break Glass', 'View break glass accounts'),
  ('break-glass', 'create', 'security', 'both', 'Break Glass', 'Create break glass accounts'),
  ('break-glass', 'edit', 'security', 'both', 'Break Glass', 'Edit break glass accounts'),
  ('break-glass', 'delete', 'security', 'both', 'Break Glass', 'Delete break glass accounts'),
  ('id-verify', 'view', 'security', 'both', 'ID Verify', 'View identity verifications'),
  ('id-verify', 'create', 'security', 'both', 'ID Verify', 'Create identity verifications'),
  ('id-verify', 'edit', 'security', 'both', 'ID Verify', 'Edit identity verifications'),
  ('id-verify', 'delete', 'security', 'both', 'ID Verify', 'Delete identity verifications'),
  ('dmarc-coach', 'view', 'security', 'both', 'DMARC Coach', 'View DMARC coaching'),
  ('dmarc-coach', 'create', 'security', 'both', 'DMARC Coach', 'Create DMARC assessments'),
  ('dmarc-coach', 'edit', 'security', 'both', 'DMARC Coach', 'Edit DMARC assessments'),
  ('dmarc-coach', 'delete', 'security', 'both', 'DMARC Coach', 'Delete DMARC assessments'),
  ('patch-compliance', 'view', 'security', 'both', 'Patch Compliance', 'View patch compliance'),
  ('patch-compliance', 'create', 'security', 'both', 'Patch Compliance', 'Create patch groups'),
  ('patch-compliance', 'edit', 'security', 'both', 'Patch Compliance', 'Edit patch groups'),
  ('patch-compliance', 'delete', 'security', 'both', 'Patch Compliance', 'Delete patch groups'),
  ('endpoint-security', 'view', 'security', 'both', 'Endpoint Security', 'View endpoint security'),
  ('endpoint-security', 'create', 'security', 'both', 'Endpoint Security', 'Create endpoint records'),
  ('endpoint-security', 'edit', 'security', 'both', 'Endpoint Security', 'Edit endpoint records'),
  ('endpoint-security', 'delete', 'security', 'both', 'Endpoint Security', 'Delete endpoint records'),
  ('m365-hardening', 'view', 'security', 'both', 'M365 Hardening', 'View M365 hardening'),
  ('m365-hardening', 'create', 'security', 'both', 'M365 Hardening', 'Create M365 hardening scans'),
  ('m365-hardening', 'edit', 'security', 'both', 'M365 Hardening', 'Edit M365 hardening scans'),
  ('m365-hardening', 'delete', 'security', 'both', 'M365 Hardening', 'Delete M365 hardening scans'),
  ('security-suite', 'view', 'security', 'both', 'Security Suite', 'View security suite'),
  ('security-suite', 'create', 'security', 'both', 'Security Suite', 'Create security suite records'),
  ('security-suite', 'edit', 'security', 'both', 'Security Suite', 'Edit security suite records'),
  ('security-suite', 'delete', 'security', 'both', 'Security Suite', 'Delete security suite records'),
  ('security-ops', 'view', 'security', 'both', 'Security Operations', 'View security operations'),
  ('security-ops', 'create', 'security', 'both', 'Security Operations', 'Create security operations records'),
  ('security-ops', 'edit', 'security', 'both', 'Security Operations', 'Edit security operations records'),
  ('security-ops', 'delete', 'security', 'both', 'Security Operations', 'Delete security operations records'),
  ('risk-register', 'view', 'security', 'both', 'Risk Register', 'View risk register'),
  ('risk-register', 'create', 'security', 'both', 'Risk Register', 'Create risks'),
  ('risk-register', 'edit', 'security', 'both', 'Risk Register', 'Edit risks'),
  ('risk-register', 'delete', 'security', 'both', 'Risk Register', 'Delete risks'),
  ('tabletop', 'view', 'security', 'both', 'Tabletop Exercises', 'View tabletop exercises'),
  ('tabletop', 'create', 'security', 'both', 'Tabletop Exercises', 'Create tabletop exercises'),
  ('tabletop', 'edit', 'security', 'both', 'Tabletop Exercises', 'Edit tabletop exercises'),
  ('tabletop', 'delete', 'security', 'both', 'Tabletop Exercises', 'Delete tabletop exercises'),
  ('phishing-simulations', 'view', 'security', 'both', 'Phishing Simulations', 'View phishing campaigns'),
  ('phishing-simulations', 'create', 'security', 'both', 'Phishing Simulations', 'Create phishing campaigns'),
  ('phishing-simulations', 'edit', 'security', 'both', 'Phishing Simulations', 'Edit phishing campaigns'),
  ('phishing-simulations', 'delete', 'security', 'both', 'Phishing Simulations', 'Delete phishing campaigns'),
  ('incident-response', 'view', 'security', 'both', 'Incident Response', 'View incident response runbooks'),
  ('incident-response', 'create', 'security', 'both', 'Incident Response', 'Create incident response runbooks'),
  ('incident-response', 'edit', 'security', 'both', 'Incident Response', 'Edit incident response runbooks'),
  ('incident-response', 'delete', 'security', 'both', 'Incident Response', 'Delete incident response runbooks'),

  -- ===================== OPERATIONS (both portals) =====================
  ('assets', 'view', 'operations', 'both', 'Assets', 'View assets'),
  ('assets', 'create', 'operations', 'both', 'Assets', 'Create assets'),
  ('assets', 'edit', 'operations', 'both', 'Assets', 'Edit assets'),
  ('assets', 'delete', 'operations', 'both', 'Assets', 'Delete assets'),
  ('findings', 'view', 'operations', 'both', 'Findings', 'View findings'),
  ('findings', 'create', 'operations', 'both', 'Findings', 'Create findings'),
  ('findings', 'edit', 'operations', 'both', 'Findings', 'Edit findings'),
  ('findings', 'delete', 'operations', 'both', 'Findings', 'Delete findings'),
  ('domain-monitors', 'view', 'operations', 'both', 'Domain Monitors', 'View domain monitors'),
  ('domain-monitors', 'create', 'operations', 'both', 'Domain Monitors', 'Create domain monitors'),
  ('domain-monitors', 'edit', 'operations', 'both', 'Domain Monitors', 'Edit domain monitors'),
  ('domain-monitors', 'delete', 'operations', 'both', 'Domain Monitors', 'Delete domain monitors'),
  ('website-monitors', 'view', 'operations', 'both', 'Website Monitors', 'View website monitors'),
  ('website-monitors', 'create', 'operations', 'both', 'Website Monitors', 'Create website monitors'),
  ('website-monitors', 'edit', 'operations', 'both', 'Website Monitors', 'Edit website monitors'),
  ('website-monitors', 'delete', 'operations', 'both', 'Website Monitors', 'Delete website monitors'),
  ('dmarc', 'view', 'operations', 'both', 'DMARC', 'View DMARC assessments'),
  ('dmarc', 'create', 'operations', 'both', 'DMARC', 'Create DMARC assessments'),
  ('dmarc', 'edit', 'operations', 'both', 'DMARC', 'Edit DMARC assessments'),
  ('dmarc', 'delete', 'operations', 'both', 'DMARC', 'Delete DMARC assessments'),
  ('license-optimizer', 'view', 'operations', 'both', 'License Optimizer', 'View license optimization'),
  ('license-optimizer', 'create', 'operations', 'both', 'License Optimizer', 'Create license records'),
  ('license-optimizer', 'edit', 'operations', 'both', 'License Optimizer', 'Edit license records'),
  ('license-optimizer', 'delete', 'operations', 'both', 'License Optimizer', 'Delete license records'),
  ('uptime-monitor', 'view', 'operations', 'both', 'Uptime Monitor', 'View uptime monitors'),
  ('uptime-monitor', 'create', 'operations', 'both', 'Uptime Monitor', 'Create uptime monitors'),
  ('uptime-monitor', 'edit', 'operations', 'both', 'Uptime Monitor', 'Edit uptime monitors'),
  ('uptime-monitor', 'delete', 'operations', 'both', 'Uptime Monitor', 'Delete uptime monitors'),
  ('field-services', 'view', 'operations', 'both', 'Field Services', 'View field services'),
  ('field-services', 'create', 'operations', 'both', 'Field Services', 'Create field service records'),
  ('field-services', 'edit', 'operations', 'both', 'Field Services', 'Edit field service records'),
  ('field-services', 'delete', 'operations', 'both', 'Field Services', 'Delete field service records'),
  ('status', 'view', 'operations', 'both', 'Status', 'View status'),
  ('status-pages', 'view', 'operations', 'both', 'Status Pages', 'View status pages'),
  ('status-pages', 'create', 'operations', 'both', 'Status Pages', 'Create status pages'),
  ('status-pages', 'edit', 'operations', 'both', 'Status Pages', 'Edit status pages'),
  ('status-pages', 'delete', 'operations', 'both', 'Status Pages', 'Delete status pages'),
  ('camera-calculator', 'view', 'operations', 'both', 'Camera Calculator', 'View camera calculator'),
  ('camera-calculator', 'create', 'operations', 'both', 'Camera Calculator', 'Run camera calculations'),
  ('camera-calculator', 'delete', 'operations', 'both', 'Camera Calculator', 'Delete camera calculations'),
  ('network-port-maps', 'view', 'operations', 'both', 'Network Port Maps', 'View port maps'),
  ('network-port-maps', 'create', 'operations', 'both', 'Network Port Maps', 'Create port maps'),
  ('network-port-maps', 'edit', 'operations', 'both', 'Network Port Maps', 'Edit port maps'),
  ('network-port-maps', 'delete', 'operations', 'both', 'Network Port Maps', 'Delete port maps'),
  ('hardware-staging', 'view', 'operations', 'both', 'Hardware Staging', 'View hardware staging'),
  ('hardware-staging', 'create', 'operations', 'both', 'Hardware Staging', 'Create staging records'),
  ('hardware-staging', 'edit', 'operations', 'both', 'Hardware Staging', 'Edit staging records'),
  ('hardware-staging', 'delete', 'operations', 'both', 'Hardware Staging', 'Delete staging records'),
  ('time-entries', 'view', 'operations', 'both', 'Time Entries', 'View time entries'),
  ('time-entries', 'create', 'operations', 'both', 'Time Entries', 'Create time entries'),
  ('time-entries', 'edit', 'operations', 'both', 'Time Entries', 'Edit time entries'),
  ('time-entries', 'delete', 'operations', 'both', 'Time Entries', 'Delete time entries'),
  ('runbooks', 'view', 'operations', 'both', 'Runbooks', 'View runbooks'),
  ('runbooks', 'create', 'operations', 'both', 'Runbooks', 'Create runbooks'),
  ('runbooks', 'edit', 'operations', 'both', 'Runbooks', 'Edit runbooks'),
  ('runbooks', 'delete', 'operations', 'both', 'Runbooks', 'Delete runbooks'),
  ('sop-library', 'view', 'operations', 'both', 'SOP Library', 'View SOP library'),
  ('sop-library', 'create', 'operations', 'both', 'SOP Library', 'Create SOPs'),
  ('sop-library', 'edit', 'operations', 'both', 'SOP Library', 'Edit SOPs'),
  ('sop-library', 'delete', 'operations', 'both', 'SOP Library', 'Delete SOPs'),
  ('backup-dr', 'view', 'operations', 'both', 'Backup and DR', 'View backup and DR'),
  ('backup-dr', 'create', 'operations', 'both', 'Backup and DR', 'Create backup records'),
  ('backup-dr', 'edit', 'operations', 'both', 'Backup and DR', 'Edit backup records'),
  ('backup-dr', 'delete', 'operations', 'both', 'Backup and DR', 'Delete backup records'),
  ('device-profiles', 'view', 'operations', 'both', 'Device Profiles', 'View device profiles'),
  ('device-profiles', 'create', 'operations', 'both', 'Device Profiles', 'Create device profiles'),
  ('device-profiles', 'edit', 'operations', 'both', 'Device Profiles', 'Edit device profiles'),
  ('device-profiles', 'delete', 'operations', 'both', 'Device Profiles', 'Delete device profiles'),
  ('dns-changes', 'view', 'operations', 'both', 'DNS Changes', 'View DNS changes'),
  ('dns-changes', 'create', 'operations', 'both', 'DNS Changes', 'Create DNS changes'),
  ('dns-changes', 'edit', 'operations', 'both', 'DNS Changes', 'Edit DNS changes'),
  ('dns-changes', 'delete', 'operations', 'both', 'DNS Changes', 'Delete DNS changes'),
  ('saas-audit', 'view', 'operations', 'both', 'SaaS Audit', 'View SaaS audit'),
  ('saas-audit', 'create', 'operations', 'both', 'SaaS Audit', 'Create SaaS audit records'),
  ('saas-audit', 'edit', 'operations', 'both', 'SaaS Audit', 'Edit SaaS audit records'),
  ('saas-audit', 'delete', 'operations', 'both', 'SaaS Audit', 'Delete SaaS audit records'),
  ('sharepoint', 'view', 'operations', 'both', 'SharePoint', 'View SharePoint migrations'),
  ('sharepoint', 'create', 'operations', 'both', 'SharePoint', 'Create SharePoint migrations'),
  ('sharepoint', 'edit', 'operations', 'both', 'SharePoint', 'Edit SharePoint migrations'),
  ('sharepoint', 'delete', 'operations', 'both', 'SharePoint', 'Delete SharePoint migrations'),
  ('budgets', 'view', 'operations', 'both', 'Budgets', 'View budgets'),
  ('budgets', 'create', 'operations', 'both', 'Budgets', 'Create budgets'),
  ('budgets', 'edit', 'operations', 'both', 'Budgets', 'Edit budgets'),
  ('budgets', 'delete', 'operations', 'both', 'Budgets', 'Delete budgets'),
  ('procurement', 'view', 'operations', 'both', 'Procurement', 'View procurement'),
  ('procurement', 'create', 'operations', 'both', 'Procurement', 'Create procurement requests'),
  ('procurement', 'edit', 'operations', 'both', 'Procurement', 'Edit procurement requests'),
  ('procurement', 'delete', 'operations', 'both', 'Procurement', 'Delete procurement requests'),
  ('automation', 'view', 'operations', 'both', 'Automation', 'View automation rules'),
  ('automation', 'create', 'operations', 'both', 'Automation', 'Create automation rules'),
  ('automation', 'edit', 'operations', 'both', 'Automation', 'Edit automation rules'),
  ('automation', 'delete', 'operations', 'both', 'Automation', 'Delete automation rules'),
  ('scoreboard', 'view', 'operations', 'both', 'Scoreboard', 'View scoreboard'),
  ('scoreboard', 'create', 'operations', 'both', 'Scoreboard', 'Create scoreboard entries'),
  ('scoreboard', 'edit', 'operations', 'both', 'Scoreboard', 'Edit scoreboard entries'),
  ('scoreboard', 'delete', 'operations', 'both', 'Scoreboard', 'Delete scoreboard entries'),
  ('identity-verification', 'view', 'operations', 'both', 'Identity Verification', 'View identity verifications'),
  ('identity-verification', 'create', 'operations', 'both', 'Identity Verification', 'Create identity verifications'),
  ('identity-verification', 'edit', 'operations', 'both', 'Identity Verification', 'Edit identity verifications'),
  ('identity-verification', 'delete', 'operations', 'both', 'Identity Verification', 'Delete identity verifications'),
  ('client-knowledge-base', 'view', 'operations', 'both', 'Client Knowledge Base', 'View knowledge base'),
  ('client-knowledge-base', 'create', 'operations', 'both', 'Client Knowledge Base', 'Create knowledge base articles'),
  ('client-knowledge-base', 'edit', 'operations', 'both', 'Client Knowledge Base', 'Edit knowledge base articles'),
  ('client-knowledge-base', 'delete', 'operations', 'both', 'Client Knowledge Base', 'Delete knowledge base articles'),
  ('change-requests', 'view', 'operations', 'both', 'Change Requests', 'View change requests'),
  ('change-requests', 'create', 'operations', 'both', 'Change Requests', 'Create change requests'),
  ('change-requests', 'edit', 'operations', 'both', 'Change Requests', 'Edit change requests'),
  ('change-requests', 'delete', 'operations', 'both', 'Change Requests', 'Delete change requests'),
  ('compliance-readiness', 'view', 'operations', 'both', 'Compliance Readiness', 'View compliance readiness'),
  ('compliance-readiness', 'create', 'operations', 'both', 'Compliance Readiness', 'Create compliance assessments'),
  ('compliance-readiness', 'edit', 'operations', 'both', 'Compliance Readiness', 'Edit compliance assessments'),
  ('compliance-readiness', 'delete', 'operations', 'both', 'Compliance Readiness', 'Delete compliance assessments'),

  -- ===================== CLIENTS (both portals) =====================
  ('onboarding', 'view', 'clients', 'both', 'Onboarding', 'View client onboarding'),
  ('onboarding', 'create', 'clients', 'both', 'Onboarding', 'Create onboarding projects'),
  ('onboarding', 'edit', 'clients', 'both', 'Onboarding', 'Edit onboarding projects'),
  ('onboarding', 'delete', 'clients', 'both', 'Onboarding', 'Delete onboarding projects'),
  ('offboarding', 'view', 'clients', 'both', 'Offboarding', 'View client offboarding'),
  ('offboarding', 'create', 'clients', 'both', 'Offboarding', 'Create offboarding checklists'),
  ('offboarding', 'edit', 'clients', 'both', 'Offboarding', 'Edit offboarding checklists'),
  ('offboarding', 'delete', 'clients', 'both', 'Offboarding', 'Delete offboarding checklists'),
  ('file-requests', 'view', 'clients', 'both', 'File Requests', 'View file requests'),
  ('file-requests', 'create', 'clients', 'both', 'File Requests', 'Create file requests'),
  ('file-requests', 'edit', 'clients', 'both', 'File Requests', 'Edit file requests'),
  ('file-requests', 'delete', 'clients', 'both', 'File Requests', 'Delete file requests'),
  ('vendor-contracts', 'view', 'clients', 'both', 'Vendor Contracts', 'View vendor contracts'),
  ('vendor-contracts', 'create', 'clients', 'both', 'Vendor Contracts', 'Create vendor contracts'),
  ('vendor-contracts', 'edit', 'clients', 'both', 'Vendor Contracts', 'Edit vendor contracts'),
  ('vendor-contracts', 'delete', 'clients', 'both', 'Vendor Contracts', 'Delete vendor contracts'),
  ('vendor-contacts', 'view', 'clients', 'both', 'Vendor Contacts', 'View vendor contacts'),
  ('vendor-contacts', 'create', 'clients', 'both', 'Vendor Contacts', 'Create vendor contacts'),
  ('vendor-contacts', 'edit', 'clients', 'both', 'Vendor Contacts', 'Edit vendor contacts'),
  ('vendor-contacts', 'delete', 'clients', 'both', 'Vendor Contacts', 'Delete vendor contacts'),
  ('training-hub', 'view', 'clients', 'both', 'Training Hub', 'View training hub'),
  ('training-hub', 'create', 'clients', 'both', 'Training Hub', 'Create training content'),
  ('training-hub', 'edit', 'clients', 'both', 'Training Hub', 'Edit training content'),
  ('training-hub', 'delete', 'clients', 'both', 'Training Hub', 'Delete training content'),
  ('insurance-binder', 'view', 'clients', 'both', 'Insurance Binder', 'View insurance binders'),
  ('insurance-binder', 'create', 'clients', 'both', 'Insurance Binder', 'Create insurance binders'),
  ('insurance-binder', 'edit', 'clients', 'both', 'Insurance Binder', 'Edit insurance binders'),
  ('insurance-binder', 'delete', 'clients', 'both', 'Insurance Binder', 'Delete insurance binders'),
  ('client-onboarding-command-center', 'view', 'clients', 'both', 'Onboarding Command Center', 'View onboarding command center'),
  ('client-onboarding-command-center', 'create', 'clients', 'both', 'Onboarding Command Center', 'Create onboarding projects'),
  ('client-onboarding-command-center', 'edit', 'clients', 'both', 'Onboarding Command Center', 'Edit onboarding projects'),
  ('client-onboarding-command-center', 'delete', 'clients', 'both', 'Onboarding Command Center', 'Delete onboarding projects'),
  ('dynamic-forms', 'view', 'clients', 'both', 'Dynamic Forms', 'View dynamic forms'),
  ('dynamic-forms', 'create', 'clients', 'both', 'Dynamic Forms', 'Create dynamic forms'),
  ('dynamic-forms', 'edit', 'clients', 'both', 'Dynamic Forms', 'Edit dynamic forms'),
  ('dynamic-forms', 'delete', 'clients', 'both', 'Dynamic Forms', 'Delete dynamic forms'),
  ('satisfaction-pulse', 'view', 'clients', 'both', 'Satisfaction Pulse', 'View satisfaction surveys'),
  ('satisfaction-pulse', 'create', 'clients', 'both', 'Satisfaction Pulse', 'Create satisfaction surveys'),
  ('satisfaction-pulse', 'edit', 'clients', 'both', 'Satisfaction Pulse', 'Edit satisfaction surveys'),
  ('satisfaction-pulse', 'delete', 'clients', 'both', 'Satisfaction Pulse', 'Delete satisfaction surveys'),

  -- ===================== STORE (admin) =====================
  ('store', 'view', 'store', 'admin', 'Store', 'View store dashboard'),
  ('store', 'manage', 'store', 'admin', 'Store', 'Manage store settings'),
  ('store-products', 'view', 'store', 'admin', 'Store Products', 'View store products'),
  ('store-products', 'manage', 'store', 'admin', 'Store Products', 'Manage store products'),
  ('store-promotions', 'view', 'store', 'admin', 'Store Promotions', 'View store promotions'),
  ('store-promotions', 'manage', 'store', 'admin', 'Store Promotions', 'Manage store promotions'),
  ('store-quotes', 'view', 'store', 'admin', 'Store Quotes', 'View store quotes'),
  ('store-quotes', 'manage', 'store', 'admin', 'Store Quotes', 'Manage store quotes'),
  ('store-campaigns', 'view', 'store', 'admin', 'Store Campaigns', 'View store campaigns'),
  ('store-campaigns', 'manage', 'store', 'admin', 'Store Campaigns', 'Manage store campaigns'),
  ('store-analytics', 'view', 'store', 'admin', 'Store Analytics', 'View store analytics'),
  ('store-analytics', 'export', 'store', 'admin', 'Store Analytics', 'Export store analytics'),
  ('store-categories', 'view', 'store', 'admin', 'Store Categories', 'View store categories'),
  ('store-categories', 'manage', 'store', 'admin', 'Store Categories', 'Manage store categories'),

  -- ===================== TOOLS (admin) =====================
  ('api-keys', 'view', 'tools', 'admin', 'API Keys', 'View API keys'),
  ('api-keys', 'manage', 'tools', 'admin', 'API Keys', 'Manage API keys'),
  ('webhooks', 'view', 'tools', 'admin', 'Webhooks', 'View webhook endpoints'),
  ('webhooks', 'manage', 'tools', 'admin', 'Webhooks', 'Manage webhook endpoints'),
  ('ai', 'view', 'tools', 'admin', 'AI Tools', 'View AI tools'),
  ('ai', 'create', 'tools', 'admin', 'AI Tools', 'Run AI tools'),
  ('ai', 'edit', 'tools', 'admin', 'AI Tools', 'Edit AI tool settings'),
  ('ai', 'delete', 'tools', 'admin', 'AI Tools', 'Delete AI tool outputs'),
  ('edu-automation', 'view', 'tools', 'admin', 'Edu Automation', 'View education automation'),
  ('edu-automation', 'create', 'tools', 'admin', 'Edu Automation', 'Create education automation'),
  ('edu-automation', 'edit', 'tools', 'admin', 'Edu Automation', 'Edit education automation'),
  ('edu-automation', 'delete', 'tools', 'admin', 'Edu Automation', 'Delete education automation'),
  ('health', 'view', 'tools', 'admin', 'Health Dashboard', 'View service health'),
  ('sla', 'view', 'tools', 'both', 'SLA', 'View SLA metrics'),
  ('sla', 'create', 'tools', 'both', 'SLA', 'Create SLA entries'),
  ('sla', 'edit', 'tools', 'both', 'SLA', 'Edit SLA entries'),
  ('sla', 'delete', 'tools', 'both', 'SLA', 'Delete SLA entries'),
  ('proposals', 'view', 'tools', 'both', 'Proposals', 'View proposals'),
  ('proposals', 'create', 'tools', 'both', 'Proposals', 'Create proposals'),
  ('proposals', 'edit', 'tools', 'both', 'Proposals', 'Edit proposals'),
  ('proposals', 'delete', 'tools', 'both', 'Proposals', 'Delete proposals'),
  ('qbr', 'view', 'tools', 'both', 'QBR Reports', 'View QBR reports'),
  ('qbr', 'create', 'tools', 'both', 'QBR Reports', 'Create QBR reports'),
  ('qbr', 'edit', 'tools', 'both', 'QBR Reports', 'Edit QBR reports'),
  ('qbr', 'delete', 'tools', 'both', 'QBR Reports', 'Delete QBR reports'),
  ('service-catalog', 'view', 'tools', 'both', 'Service Catalog', 'View service catalog'),
  ('service-catalog', 'create', 'tools', 'both', 'Service Catalog', 'Create catalog items'),
  ('service-catalog', 'edit', 'tools', 'both', 'Service Catalog', 'Edit catalog items'),
  ('service-catalog', 'delete', 'tools', 'both', 'Service Catalog', 'Delete catalog items'),
  ('business-os', 'view', 'tools', 'admin', 'Business OS', 'View business OS'),
  ('business-os', 'edit', 'tools', 'admin', 'Business OS', 'Edit business OS'),
  ('final', 'view', 'tools', 'admin', 'More Tools', 'View additional tools'),
  ('final', 'edit', 'tools', 'admin', 'More Tools', 'Edit additional tools'),
  ('search', 'view', 'tools', 'admin', 'Global Search', 'Use global search'),
  ('vendors', 'view', 'tools', 'admin', 'Vendors', 'View vendor management'),
  ('vendors', 'create', 'tools', 'admin', 'Vendors', 'Create vendors'),
  ('vendors', 'edit', 'tools', 'admin', 'Vendors', 'Edit vendors'),
  ('vendors', 'delete', 'tools', 'admin', 'Vendors', 'Delete vendors'),
  ('licenses', 'view', 'tools', 'admin', 'Licenses', 'View licenses'),
  ('licenses', 'create', 'tools', 'admin', 'Licenses', 'Create licenses'),
  ('licenses', 'edit', 'tools', 'admin', 'Licenses', 'Edit licenses'),
  ('licenses', 'delete', 'tools', 'admin', 'Licenses', 'Delete licenses'),
  ('timeline', 'view', 'portal', 'portal', 'Timeline', 'View project timeline'),
  ('profile', 'view', 'portal', 'portal', 'Profile', 'View own profile'),
  ('profile', 'edit', 'portal', 'portal', 'Profile', 'Edit own profile')
on conflict (module_key, action_key) do update
set
  group_key = excluded.group_key,
  scope = excluded.scope,
  label = excluded.label,
  description = excluded.description;

-- =========================================================
-- ROLE ASSIGNMENTS
-- =========================================================

-- Super Admin: every permission (API also bypasses checks entirely)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- Admin: every permission except destructive :delete
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'admin' and p.action_key <> 'delete'
on conflict do nothing;

-- Technician: view/edit on operational and support-facing modules,
-- plus read-only access to dashboard and audit
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'technician'
  and (
    (p.action_key in ('view', 'edit') and p.module_key in (
      'dashboard', 'audit',
      'tickets', 'projects', 'documents',
      'assets', 'findings', 'domain-monitors', 'website-monitors', 'dmarc',
      'license-optimizer', 'uptime-monitor', 'field-services', 'status',
      'status-pages', 'runbooks', 'sop-library', 'time-entries',
      'incidents', 'break-glass', 'id-verify', 'dmarc-coach',
      'patch-compliance', 'endpoint-security', 'm365-hardening',
      'camera-calculator', 'network-port-maps', 'hardware-staging',
      'onboarding', 'offboarding', 'vendor-contracts', 'vendor-contacts',
      'client-knowledge-base', 'sharepoint', 'backup-dr', 'automation',
      'device-profiles', 'dns-changes', 'saas-audit', 'budgets',
      'procurement', 'scoreboard', 'dynamic-forms', 'satisfaction-pulse',
      'client-onboarding-command-center', 'change-requests',
      'compliance-readiness', 'identity-verification', 'training-hub',
      'insurance-binder', 'incident-response', 'risk-register', 'tabletop',
      'phishing-simulations', 'security-suite', 'security-ops',
      'governance', 'sla', 'qbr', 'proposals', 'service-catalog',
      'edu-automation', 'ai', 'notifications', 'search', 'vendors',
      'licenses', 'final', 'business-os', 'health', 'approvals'
    ))
    or (p.action_key = 'view' and p.module_key in ('dashboard', 'audit'))
  )
on conflict do nothing;

-- Client Admin: portal-scoped modules with view/create/edit (no delete)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'client_admin'
  and p.scope in ('portal', 'both')
  and p.action_key in ('view', 'create', 'edit')
on conflict do nothing;

-- Client User: view everything portal-scoped; create/edit on
-- support-facing modules only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'client_user'
  and (
    (p.scope in ('portal', 'both') and p.action_key = 'view')
    or (
      p.module_key in (
        'tickets', 'documents', 'file-requests', 'change-requests',
        'approvals', 'dynamic-forms', 'satisfaction-pulse'
      )
      and p.action_key in ('create', 'edit')
    )
  )
on conflict do nothing;

commit;
