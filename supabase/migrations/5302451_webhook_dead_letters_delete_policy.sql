-- RLS-P2-002 / WH-P2-005: webhook_dead_letters had SELECT/INSERT/UPDATE
-- policies but no DELETE policy (5302050:25-57, none added later).
--
-- The dead-letter API deletes rows through
-- getScopedClient(req, "webhook-management", "write"):
--   - POST /dead-letters/:id/retry consumes the dead letter after recreating
--     the delivery,
--   - DELETE /dead-letters/:id dismisses it.
-- That client is the RLS-bound user client whenever `webhook-management` is
-- listed in RLS_WRITES_ENABLED (and the caller is not a cross-tenant platform
-- admin). With no DELETE policy the delete matched zero rows, so both routes
-- returned 404 and left the row behind while the retry had already queued a
-- delivery.
--
-- Scope the delete exactly like the existing insert/update manage gate: a
-- super admin, or a member holding webhooks:manage for the endpoint's org.
begin;

drop policy if exists "webhook_dead_letters_delete_manage" on public.webhook_dead_letters;
create policy "webhook_dead_letters_delete_manage" on public.webhook_dead_letters
  for delete
  using (
    exists (
      select 1 from public.webhook_endpoints we
      where we.id = webhook_id
      and (public.is_super_admin() or public.user_has_permission(we.organization_id, 'webhooks', 'manage'))
    )
  );

-- Guard against future drift: fail the migration loudly if the delete gate is
-- missing or not manage-scoped.
do $$
declare
  qual text;
begin
  select pg_policies.qual into qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'webhook_dead_letters'
    and policyname = 'webhook_dead_letters_delete_manage'
    and cmd = 'DELETE';

  if qual is null or qual not like '%user_has_permission%' then
    raise exception 'webhook_dead_letters delete policy missing or not manage-scoped';
  end if;
end;
$$;

commit;
