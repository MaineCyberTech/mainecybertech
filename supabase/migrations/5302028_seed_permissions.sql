-- Seed permissions and role-based permissions
-- Each module has: view, create, edit, delete actions

begin;

insert into public.permissions (module_key, action_key, description)
values
  -- Dashboard
  ('dashboard', 'view', 'View dashboard'),
  -- Users
  ('users', 'view', 'View users'),
  ('users', 'create', 'Create users'),
  ('users', 'edit', 'Edit users'),
  ('users', 'delete', 'Delete users'),
  -- Organizations
  ('organizations', 'view', 'View organizations'),
  ('organizations', 'create', 'Create organizations'),
  ('organizations', 'edit', 'Edit organizations'),
  ('organizations', 'delete', 'Delete organizations'),
  -- Projects
  ('projects', 'view', 'View projects'),
  ('projects', 'create', 'Create projects'),
  ('projects', 'edit', 'Edit projects'),
  ('projects', 'delete', 'Delete projects'),
  -- Tickets
  ('tickets', 'view', 'View tickets'),
  ('tickets', 'create', 'Create tickets'),
  ('tickets', 'edit', 'Edit tickets'),
  ('tickets', 'delete', 'Delete tickets'),
  -- Documents
  ('documents', 'view', 'View documents'),
  ('documents', 'create', 'Create documents'),
  ('documents', 'edit', 'Edit documents'),
  ('documents', 'delete', 'Delete documents'),
  -- Audit
  ('audit', 'view', 'View audit logs'),
  -- Memberships
  ('memberships', 'view', 'View memberships'),
  ('memberships', 'create', 'Create memberships'),
  ('memberships', 'edit', 'Edit memberships'),
  ('memberships', 'delete', 'Delete memberships'),
  -- Billing
  ('billing', 'view', 'View billing & invoices'),
  ('billing', 'manage', 'Manage billing settings'),
  -- Webhooks
  ('webhooks', 'view', 'View webhook endpoints'),
  ('webhooks', 'manage', 'Create, edit, and delete webhook endpoints')
on conflict (module_key, action_key) do nothing;

-- Super Admin: all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- Admin: most permissions except delete
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.key = 'admin' and p.action_key != 'delete'
on conflict do nothing;

-- Client Admin: view + create + edit for tickets and documents
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.key = 'client_admin' and p.action_key in ('view', 'create', 'edit')
  and p.module_key in ('users', 'projects', 'tickets', 'documents', 'memberships')
on conflict do nothing;

-- Technician: view + edit for tickets and projects
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.key = 'technician'
  and ((p.action_key in ('view', 'edit') and p.module_key in ('tickets', 'projects', 'documents'))
    or (p.action_key = 'view' and p.module_key in ('dashboard', 'audit')))
on conflict do nothing;

-- Client User: view + create for tickets and documents only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.key = 'client_user'
  and ((p.action_key in ('view', 'create') and p.module_key in ('tickets', 'documents'))
    or (p.action_key = 'view' and p.module_key in ('dashboard', 'projects')))
on conflict do nothing;

commit;
