-- P0 fix: restore missing table privileges for PostgREST roles.
--
-- Symptom: PostgREST returns 42501 "permission denied for table X" for the
-- service_role (and by extension anon/authenticated) roles on core tables,
-- even though RLS policies exist. Every API query fails -> health 503,
-- requireOrgAccess 403 "No approved organization membership found", E2E
-- login lands on /pending.
--
-- Cause: the consolidated bootstrap (5302026) enabled RLS and created
-- policies but never granted table-level privileges to the PostgREST roles,
-- and later `drop table ... cascade` cleanups (5302055) dropped the default
-- grants that `supabase db reset` seeds for freshly created tables.
--
-- Fix: grant standard Supabase privileges on ALL existing public tables to
-- the three PostgREST roles (service_role gets full DML; anon/authenticated
-- get DML gated by RLS policies). Also re-apply for any future tables via
-- default privileges (create + alter only work for owned tables, so the
-- explicit loop covers existing tables and ALTER DEFAULT is a bonus for
-- tables created by later migrations in the same session).
--
-- Idempotent: GRANT ... ON TABLE is a no-op if already granted.

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
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to anon', t);
  end loop;
end;
$$;

-- Sequences: PostgREST inserts through views/functions may need USAGE.
do $$
declare s text;
begin
  for s in
    select sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
  loop
    execute format('grant usage, select on sequence public.%I to service_role', s);
    execute format('grant usage, select on sequence public.%I to authenticated', s);
    execute format('grant usage, select on sequence public.%I to anon', s);
  end loop;
end;
$$;

-- Default privileges so tables created by LATER migrations in this project
-- get the same grants automatically. (Applies to objects created by the
-- migration runner role in schema public.)
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon;
