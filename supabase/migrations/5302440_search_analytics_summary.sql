-- =========================================================
-- 5302440: get_analytics_summary() for GET /api/v1/analytics/summary
--
-- SEARCH-P2-005: the admin analytics summary endpoint
-- (apps/api/src/routes/analytics.ts) calls `get_analytics_summary`
-- but no migration ever defined it, so every call failed with a
-- PostgREST "function not found" error and the summary was always
-- empty. The SDK contract (AnalyticsSummary in
-- packages/sdk/src/analytics.ts) expects { event, count } rows.
--
-- Service-role only: the route is admin-gated and reads with the
-- service-role client. No anon/authenticated EXECUTE grant, so a
-- signed-in user cannot call the aggregate RPC directly and skip the
-- admin gate.
-- =========================================================

begin;

create or replace function public.get_analytics_summary()
returns table (event text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.event, count(*)::bigint as count
  from public.store_analytics_events e
  group by e.event
  order by count(*) desc, e.event asc;
$$;

comment on function public.get_analytics_summary() is
  'Per-event counts for the admin analytics summary (SEARCH-P2-005). Service-role only; the API route enforces the admin gate.';

revoke all on function public.get_analytics_summary() from public, anon, authenticated;
grant execute on function public.get_analytics_summary() to service_role;

commit;
