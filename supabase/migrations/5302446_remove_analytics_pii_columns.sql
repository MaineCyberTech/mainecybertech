-- =========================================================
-- 5302441: remove visitor PII columns from store_analytics_events
--
-- AN-P2-002: the public tracking route
-- (apps/api/src/routes/analytics.ts) wrote the caller's `ip_address`
-- and `user_agent` for every event, and 5302106 declared both columns.
-- The analytics module contract (docs/modules/analytics.md) and the
-- event registry's own privacy rules say tracking events carry no PII,
-- so the columns are dropped rather than hashed: nothing in the API,
-- SDK or web reads them, and dropping removes the plaintext values
-- already stored.
--
-- The insert stops writing them in the same change, so no later
-- migration is needed to backfill. Existing rows are unaffected
-- otherwise; retention of the remaining event rows is handled by the
-- worker `retention` task (90 days).
-- =========================================================

begin;

alter table public.store_analytics_events drop column if exists ip_address;
alter table public.store_analytics_events drop column if exists user_agent;

commit;
