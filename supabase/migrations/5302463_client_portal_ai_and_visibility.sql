-- =========================================================
-- 5302437: client-portal AI triage access + visibility normalisation
--
-- Two follow-ups from the 2026-10-21 portal module deep dive:
--
-- 1. `ai` was seeded with scope = 'admin' (5302118), so client roles never
--    received `ai:view`. The portal AI Triage page (module 21) is documented
--    as client-facing, but RouteGuard hid it and `POST /ai/triage/analyze`
--    returned 403 for every client. Grant read/run access to client roles;
--    the copilot endpoints keep their existing permission checks.
--
-- 2. `visibility` was written as `internal`/`client_visible` but legacy rows
--    and seeds used `client`, `org`, `organization` and `public`. The API now
--    treats those as client-visible aliases (lib/client-visibility.ts); this
--    migration normalises the stored values so the data matches the contract.
-- =========================================================

begin;

-- ---- 1. AI triage for client roles -------------------------------------

update public.permissions
set scope = 'both'
where module_key = 'ai' and action_key = 'view';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('client_admin', 'client_user', 'client-viewer', 'client-billing')
  and p.module_key = 'ai'
  and p.action_key = 'view'
on conflict (role_id, permission_id) do nothing;

-- ---- 2. Normalise legacy client-visibility values ----------------------
-- Only tables that expose a `visibility` column to client portal reads.

do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('approval_requests'),
      ('proposals'),
      ('qbr_reports'),
      ('findings'),
      ('assets'),
      ('vendor_contracts'),
      ('domain_monitors'),
      ('file_requests'),
      ('service_catalog')
    ) as t(table_name)
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target.table_name
        and column_name = 'visibility'
    ) then
      execute format(
        'update public.%I set visibility = ''client_visible'' where visibility in (''client'', ''org'', ''organization'', ''public'')',
        target.table_name
      );
    end if;
  end loop;
end $$;

commit;
