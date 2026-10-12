-- AN-P3-002: close anonymous direct inserts to store_analytics_events.
--
-- 5302434 kept an `anon` INSERT grant on this table because 5302106 declared
-- a matching public-write policy (`anon_insert`). That predates the first-party
-- tracker actually shipping: the storefront now posts through the API
-- (`POST /api/v1/analytics/track`, AN-P2-003), which runs as service_role and
-- applies Zod validation, rate limits and the 90-day retention purge
-- (AN-P2-004). The direct PostgREST path therefore only offers a way to bypass
-- all three, so revoke the grant and drop the policy — writes stay on the API
-- path.
begin;

drop policy if exists "anon_insert" on public.store_analytics_events;
revoke insert on table public.store_analytics_events from anon;

-- Guard against future drift: fail the migration loudly if anon can still
-- reach the table through either a grant or a policy.
do $$
begin
  if has_table_privilege('anon', 'public.store_analytics_events', 'insert') then
    raise exception 'anon still holds INSERT on store_analytics_events';
  end if;
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'store_analytics_events'
      and 'anon' = any(roles)
  ) then
    raise exception 'store_analytics_events still has an anon policy';
  end if;
end;
$$;

commit;
