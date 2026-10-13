-- Negative fixture for scripts/check-permission-catalog.mjs.
-- Defines a single real permission row so the guard has a catalog to compare
-- against; the sibling apps/api/src/routes/bogus.ts references a key that does
-- not exist and must be flagged.
begin;

insert into public.permissions (module_key, action_key, group_key, scope, label)
values ('real', 'view', 'core', 'both', 'Real');

commit;
