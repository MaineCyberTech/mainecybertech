-- =========================================================
-- 5302426: add the `status` create/edit/delete actions
--
-- `routes/batch.ts` guards the status-items CRUD with
-- `requirePermission("status", "create"|"edit"|"delete")`, but the catalog
-- only defined `status:view`, so those guards were unsatisfiable by any
-- non-bypass role. Add the actions and grant them to the admin roles.
-- =========================================================

begin;

insert into public.permissions (module_key, action_key, group_key, scope, label, description)
values
  ('status', 'create', 'operations', 'both', 'Status', 'Create status items'),
  ('status', 'edit', 'operations', 'both', 'Status', 'Edit status items'),
  ('status', 'delete', 'operations', 'both', 'Status', 'Delete status items')
on conflict (module_key, action_key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('super_admin', 'admin')
  and p.module_key = 'status'
  and p.action_key in ('create', 'edit', 'delete')
on conflict (role_id, permission_id) do nothing;

commit;
