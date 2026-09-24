-- =========================================================
-- 5302423: make the store catalog viewable in the client portal
--
-- The `store` permission was scoped `admin`, so client roles
-- (client_admin, client_user, client-viewer, client-billing) had
-- no `store:view`. The portal `/portal/store` page is a
-- customer-facing catalog browser (it reads the public catalog and
-- active promotions), so RouteGuard was hiding it / returning 403.
--
-- Grant read-only portal access only; `store:manage` stays admin.
-- =========================================================

begin;

-- View the store from the portal; keep management admin-only.
update public.permissions
set scope = 'both'
where module_key = 'store' and action_key = 'view';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('client_admin', 'client_user', 'client-viewer', 'client-billing')
  and p.module_key = 'store'
  and p.action_key = 'view'
on conflict (role_id, permission_id) do nothing;

commit;
