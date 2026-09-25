-- =========================================================
-- 5302131: Governance manage permissions
--
-- The state-machine transition endpoints (change-request
-- approve/reject/implement/verify, DNS change approve/reject/implement,
-- risk assess) are gated server-side with requirePermission(<module>,
-- "manage"). This migration adds the manage action keys to the catalog and
-- grants them to the governance roles: super_admin (bypasses anyway),
-- admin (bypasses anyway), and security-analyst (data-driven grant).
-- Segregation of duties: client users and operational-only MSP roles
-- (engineer, dispatcher, project-manager, finance, onboarding-specialist)
-- receive NO manage grant and therefore cannot transition the state
-- machines.
-- =========================================================

insert into public.permissions (module_key, action_key, group_key, scope, label, description)
values
  ('change-requests', 'manage', 'operations', 'both', 'Change Requests', 'Approve, reject, implement, and verify change requests'),
  ('dns-changes', 'manage', 'operations', 'both', 'DNS Changes', 'Approve, reject, and implement DNS change requests'),
  ('risk-register', 'manage', 'operations', 'both', 'Risk Register', 'Assess and score risks')
on conflict (module_key, action_key) do update
set group_key = excluded.group_key, scope = excluded.scope, label = excluded.label, description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('super_admin', 'admin', 'security-analyst')
  and p.module_key in ('change-requests', 'dns-changes', 'risk-register')
  and p.action_key = 'manage'
on conflict (role_id, permission_id) do nothing;
