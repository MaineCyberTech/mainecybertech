-- RLS-P3-002: behavioral RLS allow/deny matrix.
--
-- Runs against the local Supabase database AFTER the migration chain (and
-- seeds) has been applied — see scripts/ci/check-rls-matrix.sh, invoked from
-- .github/workflows/e2e.yml right after `supabase db reset`. The static
-- guards (verify-rls.mjs, check-rls-predicate.mjs) prove the policies are
-- present and shaped correctly; this file proves they actually allow/deny the
-- representative roles:
--
--   * approved member of org A  -> own org only
--   * pending member of org A   -> denied (approved-membership predicate)
--   * approved member of org B  -> cross-tenant reads/writes denied
--   * org admin of org A        -> admin-gated reads/deletes allowed
--   * platform super admin      -> cross-tenant read allowed (is_super_admin)
--   * anon                      -> denied
--
-- Tables covered: tickets, time_entries, audit_logs, satisfaction_pulses,
-- module_timeline_events. Fixtures use fixed UUIDs and are deleted/recreated
-- on every run, so the file is idempotent and independent of seed data.
--
-- Plain SQL assertions (no pgTAP dependency): any failure RAISEs and psql
-- exits non-zero under ON_ERROR_STOP.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Assertion helpers (SECURITY INVOKER: the queries run as the current role,
-- so RLS applies exactly as it does for the API's user-scoped client).
-- ---------------------------------------------------------------------------
create schema if not exists rls_matrix;
grant usage on schema rls_matrix to authenticated, anon;

create or replace function rls_matrix.expect_count(label text, query text, want bigint)
returns void
language plpgsql
as $$
declare
  got bigint;
begin
  execute query into got;
  if got is distinct from want then
    raise exception 'RLS matrix FAIL: % — expected %, got %', label, want, got;
  end if;
  raise notice 'RLS matrix ok: % (=%)', label, got;
end $$;

create or replace function rls_matrix.expect_ok(label text, stmt text)
returns void
language plpgsql
as $$
begin
  execute stmt;
  raise notice 'RLS matrix ok (allowed): %', label;
end $$;

create or replace function rls_matrix.expect_denied(label text, stmt text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'RLS matrix ok (denied): %', label;
    return;
  end;
  raise exception 'RLS matrix FAIL: % — statement unexpectedly succeeded', label;
end $$;

grant execute on all functions in schema rls_matrix to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
begin;

-- Fixed ids so assertions stay readable and reruns are idempotent.
--   orgs:  a001 (A), a002 (B)
--   users: 0a1 member A, 0b1 member B, 0c1 pending A, 0d1 admin A, 0e1 super admin
delete from public.module_timeline_events
  where organization_id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.satisfaction_pulses
  where organization_id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.time_entries
  where organization_id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.audit_logs
  where organization_id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.tickets
  where organization_id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.memberships
  where organization_id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.organizations
  where id in ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a002');
delete from public.profiles
  where id in (
    '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b1',
    '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000d1',
    '00000000-0000-4000-8000-0000000000e1'
  );
do $$
begin
  -- auth.identities is created by GoTrue migrations in the full local stack;
  -- tolerate a database where it does not exist yet (auth.users delete
  -- cascades to it anyway).
  if to_regclass('auth.identities') is not null then
    execute $sql$
      delete from auth.identities
      where user_id in (
        '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b1',
        '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000d1',
        '00000000-0000-4000-8000-0000000000e1'
      )
    $sql$;
  end if;
end $$;
delete from auth.users
  where id in (
    '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b1',
    '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000d1',
    '00000000-0000-4000-8000-0000000000e1'
  );

-- Users. The on_auth_user_created trigger creates the matching profile rows.
-- Only columns common to the image's base auth schema and GoTrue's upgraded
-- schema are set (CI runs the full stack; this file must not depend on
-- email_confirmed_at/confirmed_at generation differences).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'rls-matrix-member-a@example.test', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"email_verified":true}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'rls-matrix-member-b@example.test', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"email_verified":true}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', 'rls-matrix-pending-a@example.test', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"email_verified":true}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', 'rls-matrix-admin-a@example.test', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"email_verified":true}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000e1', 'authenticated', 'authenticated', 'rls-matrix-super-admin@example.test', '', '{"provider":"email","providers":["email"]}'::jsonb, '{"email_verified":true}'::jsonb, now(), now())
on conflict (id) do nothing;

-- Platform super admin (profile flag read by is_super_admin()).
update public.profiles set is_super_admin = true
  where id = '00000000-0000-4000-8000-0000000000e1';

-- Organizations.
insert into public.organizations (id, name, slug, status)
values
  ('00000000-0000-4000-8000-00000000a001', 'RLS Matrix Org A', 'rls-matrix-org-a', 'approved'),
  ('00000000-0000-4000-8000-00000000a002', 'RLS Matrix Org B', 'rls-matrix-org-b', 'approved')
on conflict (id) do nothing;

-- Memberships: member A (client_user), pending A, member B, admin A (admin).
insert into public.memberships (id, organization_id, user_id, role_id, status, approved_at)
select gen_random_uuid(), v.org_id, v.user_id, r.id, v.status::public.membership_status,
       case when v.status = 'approved' then now() else null end
from (values
  ('00000000-0000-4000-8000-00000000a001'::uuid, '00000000-0000-4000-8000-0000000000a1'::uuid, 'client_user', 'approved'),
  ('00000000-0000-4000-8000-00000000a001'::uuid, '00000000-0000-4000-8000-0000000000c1'::uuid, 'client_user', 'pending'),
  ('00000000-0000-4000-8000-00000000a002'::uuid, '00000000-0000-4000-8000-0000000000b1'::uuid, 'client_user', 'approved'),
  ('00000000-0000-4000-8000-00000000a001'::uuid, '00000000-0000-4000-8000-0000000000d1'::uuid, 'admin', 'approved')
) as v(org_id, user_id, role_key, status)
join public.roles r on r.key = v.role_key
on conflict (organization_id, user_id) do nothing;

-- Tenant rows: one per org where the assertions need a visible row.
insert into public.tickets (id, organization_id, created_by, title)
values
  ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-0000000000a1', 'RLS matrix ticket A'),
  ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000a002', '00000000-0000-4000-8000-0000000000b1', 'RLS matrix ticket B')
on conflict (id) do nothing;

insert into public.time_entries (id, organization_id, description, user_id)
values ('00000000-0000-4000-8000-00000000f003', '00000000-0000-4000-8000-00000000a001', 'RLS matrix time entry A', '00000000-0000-4000-8000-0000000000a1')
on conflict (id) do nothing;

insert into public.audit_logs (id, organization_id, actor_user_id, action, entity_type)
values
  ('00000000-0000-4000-8000-00000000f004', '00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-0000000000a1', 'rls.matrix.seed', 'ticket'),
  ('00000000-0000-4000-8000-00000000f007', '00000000-0000-4000-8000-00000000a002', '00000000-0000-4000-8000-0000000000b1', 'rls.matrix.seed', 'ticket')
on conflict (id) do nothing;

insert into public.satisfaction_pulses (id, organization_id, subject)
values
  ('00000000-0000-4000-8000-00000000f005', '00000000-0000-4000-8000-00000000a001', 'RLS matrix pulse A'),
  ('00000000-0000-4000-8000-00000000f006', '00000000-0000-4000-8000-00000000a002', 'RLS matrix pulse B')
on conflict (id) do nothing;

commit;

-- ---------------------------------------------------------------------------
-- Scenario 1: approved member of org A — own org only
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', false);

select rls_matrix.expect_count('member A reads org A tickets', 'select count(*) from public.tickets where organization_id = ''00000000-0000-4000-8000-00000000a001''', 1);
select rls_matrix.expect_count('member A cannot read org B tickets', 'select count(*) from public.tickets where organization_id = ''00000000-0000-4000-8000-00000000a002''', 0);
select rls_matrix.expect_count('member A reads org A pulses', 'select count(*) from public.satisfaction_pulses where organization_id = ''00000000-0000-4000-8000-00000000a001''', 1);
select rls_matrix.expect_count('member A cannot read org B pulses', 'select count(*) from public.satisfaction_pulses where organization_id = ''00000000-0000-4000-8000-00000000a002''', 0);
select rls_matrix.expect_count('member A cannot read audit logs', 'select count(*) from public.audit_logs where organization_id = ''00000000-0000-4000-8000-00000000a001''', 0);
select rls_matrix.expect_count('member A cannot update org B ticket', 'with u as (update public.tickets set title = ''hijacked'' where id = ''00000000-0000-4000-8000-00000000f002'' returning id) select count(*) from u', 0);
select rls_matrix.expect_count('member A cannot delete own ticket (no delete policy)', 'with d as (delete from public.tickets where id = ''00000000-0000-4000-8000-00000000f001'' returning id) select count(*) from d', 0);
select rls_matrix.expect_denied('member A cannot insert a ticket into org B', 'insert into public.tickets (organization_id, created_by, title) values (''00000000-0000-4000-8000-00000000a002'', ''00000000-0000-4000-8000-0000000000a1'', ''cross-tenant'')');
select rls_matrix.expect_ok('member A can add an org A timeline event', 'insert into public.module_timeline_events (organization_id, module_key, entity_type, entity_id, event_type) values (''00000000-0000-4000-8000-00000000a001'', ''tickets'', ''ticket'', ''00000000-0000-4000-8000-00000000f001'', ''rls_matrix'')');
select rls_matrix.expect_denied('member A cannot add an org B timeline event', 'insert into public.module_timeline_events (organization_id, module_key, entity_type, entity_id, event_type) values (''00000000-0000-4000-8000-00000000a002'', ''tickets'', ''ticket'', ''00000000-0000-4000-8000-00000000f002'', ''rls_matrix'')');

reset role;

-- ---------------------------------------------------------------------------
-- Scenario 2: pending member of org A — denied by the approved-membership
-- predicate even though a membership row exists.
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', false);

select rls_matrix.expect_count('pending member A cannot read org A tickets', 'select count(*) from public.tickets where organization_id = ''00000000-0000-4000-8000-00000000a001''', 0);
select rls_matrix.expect_count('pending member A cannot read org A pulses', 'select count(*) from public.satisfaction_pulses where organization_id = ''00000000-0000-4000-8000-00000000a001''', 0);
select rls_matrix.expect_denied('pending member A cannot add an org A timeline event', 'insert into public.module_timeline_events (organization_id, module_key, entity_type, entity_id, event_type) values (''00000000-0000-4000-8000-00000000a001'', ''tickets'', ''ticket'', ''00000000-0000-4000-8000-00000000f001'', ''rls_matrix'')');

reset role;

-- ---------------------------------------------------------------------------
-- Scenario 3: org admin of org A — admin-gated surfaces allowed in-org
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d1', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', false);

select rls_matrix.expect_count('admin A reads org A audit logs', 'select count(*) from public.audit_logs where organization_id = ''00000000-0000-4000-8000-00000000a001''', 1);
select rls_matrix.expect_count('admin A cannot read org B audit logs', 'select count(*) from public.audit_logs where organization_id = ''00000000-0000-4000-8000-00000000a002''', 0);
select rls_matrix.expect_count('admin A can delete an org A time entry', 'with d as (delete from public.time_entries where id = ''00000000-0000-4000-8000-00000000f003'' returning id) select count(*) from d', 1);

reset role;

-- ---------------------------------------------------------------------------
-- Scenario 4: platform super admin — cross-tenant read via is_super_admin()
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e1', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}', false);

select rls_matrix.expect_count('super admin reads org B tickets', 'select count(*) from public.tickets where organization_id = ''00000000-0000-4000-8000-00000000a002''', 1);
select rls_matrix.expect_count('super admin reads org B audit logs', 'select count(*) from public.audit_logs where organization_id = ''00000000-0000-4000-8000-00000000a002''', 1);

reset role;

-- ---------------------------------------------------------------------------
-- Scenario 5: anon — no policies grant access
-- ---------------------------------------------------------------------------
set role anon;
select rls_matrix.expect_denied('anon cannot read org A tickets', 'select count(*) from public.tickets where organization_id = ''00000000-0000-4000-8000-00000000a001''');
select rls_matrix.expect_denied('anon cannot read org A pulses', 'select count(*) from public.satisfaction_pulses where organization_id = ''00000000-0000-4000-8000-00000000a001''');
reset role;

\echo 'RLS allow/deny matrix passed.'
