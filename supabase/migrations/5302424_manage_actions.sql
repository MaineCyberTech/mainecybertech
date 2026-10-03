-- =========================================================
-- 5302424: add the `manage` action for users / roles /
-- organizations / memberships
--
-- Several API routes and the web UI already call
-- requirePermission(..., "manage") for these admin modules, but the
-- catalog only defined view/create/edit/delete, so the key could never
-- be satisfied by any non-bypass role. This adds the action and grants
-- it to the platform admin roles so it is satisfiable and delegable.
-- =========================================================

begin;

insert into public.permissions (module_key, action_key, group_key, scope, label, description)
values
  ('users', 'manage', 'admin', 'admin', 'Users', 'Manage users and memberships'),
  ('roles', 'manage', 'admin', 'admin', 'Roles', 'Manage roles and permissions'),
  ('organizations', 'manage', 'admin', 'admin', 'Organizations', 'Manage organizations'),
  ('memberships', 'manage', 'admin', 'admin', 'Memberships', 'Manage memberships')
on conflict (module_key, action_key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('super_admin', 'admin')
  and p.module_key in ('users', 'roles', 'organizations', 'memberships')
  and p.action_key = 'manage'
on conflict (role_id, permission_id) do nothing;

commit;
