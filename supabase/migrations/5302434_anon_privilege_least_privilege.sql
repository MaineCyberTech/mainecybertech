-- DATA-P2-001: stop granting DML to `anon` on EVERY public table by default.
--
-- 5302116 fixed a real problem (PostgREST roles had no table privileges after
-- the bootstrap), but it did so with a blanket sweep:
--   * `grant select, insert, update, delete on table public.%I to anon` for
--     every existing table, and
--   * `alter default privileges in schema public grant ... to anon`, so every
--     FUTURE table was anon-writable too.
-- RLS policies were the only thing standing between `anon` and the data, and a
-- new table whose author forgot RLS (or wrote a permissive policy) is
-- world-writable by default. 5302129 later revoked most of it from
-- `public_interactions` only, leaving everything else as-is.
--
-- Investigation (see the PR): the API NEVER authenticates as `anon`. Every
-- genuinely public endpoint (public/submit, analytics/track, store/quotes)
-- uses getSupabaseAdmin() — the service role. `getSupabaseUser` uses the anon
-- KEY but always attaches the caller's JWT, so Postgres sees `authenticated`.
-- There is no browser-to-PostgREST client in the repo.
--
-- So the correct posture is DENY by default, with an explicit allowlist of the
-- three tables that declare a public write POLICY (5302033/5302129, 5302106,
-- 5302132). Those policies express intent for direct anonymous writes; we keep
-- INSERT on exactly those and drop everything else. This preserves the declared
-- public surface while removing the default-allow on every other table.
--
-- If a future feature needs anonymous PostgREST access, it must add BOTH a
-- policy AND a grant here — an explicit, reviewable act.

begin;

-- 1. Remove the default-privilege grant so future tables are NOT anon-writable.
--    (service_role/authenticated keep theirs — those are unchanged.)
alter default privileges in schema public
  revoke select, insert, update, delete on tables from anon;
alter default privileges in schema public
  revoke usage, select on sequences from anon;

-- 2. Revoke the blanket grant from every existing table, then re-grant the
--    narrow allowlist. Revoking per table (rather than GENERICALLY) keeps this
--    explicit and idempotent.
do $$
declare t text;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not like 'schema_migrations'
      and tablename not like 'pg_%'
  loop
    execute format('revoke select, insert, update, delete on table public.%I from anon', t);
  end loop;
end;
$$;

do $$
declare s text;
begin
  for s in
    select sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
  loop
    execute format('revoke usage, select on sequence public.%I from anon', s);
  end loop;
end;
$$;

-- 3. The explicit anonymous allowlist. INSERT only — never SELECT/UPDATE/DELETE
--    (a public form may create a row; it must never read back or mutate others).
--    These tables have matching `for insert to anon` policies.
grant insert on table public.public_interactions to anon;      -- 5302033 / 5302129
grant insert on table public.store_analytics_events to anon;    -- 5302106
grant insert on table public.store_quotes to anon;              -- 5302132

-- store_quote_requests / store_leads are written by the store/quotes API route
-- as service_role and have NO `to anon` policy, so they are deliberately NOT
-- granted here. Same for every other table.

-- 4. Public read surface. Notable only because these tables have `for select
--    to anon` policies (the store catalog is meant to be anonymously readable);
--    without the grant the policy alone would not be enough.
grant select on table public.store_categories to anon;
grant select on table public.store_products to anon;
grant select on table public.store_promotions to anon;
grant select on table public.store_campaigns to anon;

commit;
