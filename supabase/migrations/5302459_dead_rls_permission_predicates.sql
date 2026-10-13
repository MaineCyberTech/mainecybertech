-- =========================================================
-- 5302459: resolve RLS permission predicates absent from the catalog
-- (ACM-P3-005 / RLS-P3-005, deduped with EVOL-P3-002's catalog scope)
--
-- The bootstrap (5302026) defined RLS write policies whose permission
-- predicates referenced `module:action` pairs that were never inserted into
-- the permission catalog, so `user_has_permission(...)` could never return
-- true for them. 5302129 rewrote the live tickets/documents/projects policies
-- to catalog keys; the remaining references sit on tables that 5302055
-- dropped (contracts, contract_signers, appointments, onboarding_submissions,
-- project_members), so their policies no longer exist in the live schema.
--
-- This migration completes the catalog for every pair the migration history
-- references anyway, so that:
--   1. a policy<->catalog drift scan (static over the full history or
--      effective-state over a replay) is clean, and
--   2. the documented rollback path for 5302055 (re-create the tables from
--      5302026) cannot re-introduce permanently-false predicates.
--
-- The tickets/documents/projects/onboarding rows are legacy aliases kept for
-- historical-policy replay only: no live policy or API code references them
-- (grep-verified; the live policies use the 5302118 vocabulary). The
-- contracts/appointments modules were retired with their tables and have no
-- live code either.
--
-- Grants mirror 5302131/5302424: super_admin/admin (which bypass RLS anyway)
-- plus the operational roles that owned each module before the tables were
-- dropped, so no referenced predicate is "held by no role" any more.
-- =========================================================

begin;

insert into public.permissions (module_key, action_key, group_key, scope, label, description)
values
  -- Legacy aliases: retired by the 5302129 policy rewrite, kept so a replay
  -- of the pre-5302129 policy bodies resolves against the catalog.
  ('tickets', 'comment', 'core', 'both', 'Tickets', 'Comment on tickets (legacy alias, live policies use create/edit)'),
  ('tickets', 'manage', 'core', 'both', 'Tickets', 'Manage tickets (legacy alias, live policies use edit/delete)'),
  ('documents', 'upload', 'core', 'both', 'Documents', 'Upload documents (legacy alias, live policies use create)'),
  ('documents', 'manage', 'core', 'both', 'Documents', 'Manage documents (legacy alias, live policies use edit/delete)'),
  ('projects', 'manage', 'core', 'both', 'Projects', 'Manage projects and project members (legacy alias, live policies use edit/delete)'),
  ('onboarding', 'update', 'clients', 'both', 'Onboarding', 'Update onboarding projects (legacy alias, live policies use edit)'),
  -- Retired modules: tables dropped in 5302055, rows exist for policy replay
  -- and for the 5302055 rollback path only.
  ('contracts', 'create', 'clients', 'both', 'Contracts', 'Create contracts (module retired, table dropped in 5302055)'),
  ('contracts', 'manage', 'clients', 'both', 'Contracts', 'Manage contracts (module retired, table dropped in 5302055)'),
  ('appointments', 'schedule', 'operations', 'both', 'Appointments', 'Schedule appointments (module retired, table dropped in 5302055)'),
  ('appointments', 'manage', 'operations', 'both', 'Appointments', 'Manage appointments (module retired, table dropped in 5302055)')
on conflict (module_key, action_key) do update
set
  group_key = excluded.group_key,
  scope = excluded.scope,
  label = excluded.label,
  description = excluded.description;

-- Admin tiers hold every row above (mirrors 5302424).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('super_admin', 'admin')
  and p.module_key in (
    'tickets', 'documents', 'projects', 'onboarding', 'contracts', 'appointments'
  )
  and p.action_key in ('comment', 'manage', 'upload', 'update', 'create', 'schedule')
on conflict (role_id, permission_id) do nothing;

-- Operational owners of the live-module aliases (mirrors 5302128).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where (
    (r.key = 'technician' and p.module_key in ('tickets', 'documents') and p.action_key in ('comment', 'manage', 'upload'))
    or (r.key = 'project-manager' and p.module_key = 'projects' and p.action_key = 'manage')
    or (r.key = 'onboarding-specialist' and p.module_key = 'onboarding' and p.action_key = 'update')
    or (r.key = 'technician' and p.module_key = 'onboarding' and p.action_key = 'update')
  )
on conflict (role_id, permission_id) do nothing;

commit;
