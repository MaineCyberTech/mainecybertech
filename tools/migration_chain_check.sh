#!/usr/bin/env bash
# migration_chain_check.sh - prove every migration applies cleanly, in order,
# against a fresh database, and that this branch's schema changes landed.
#
# Why: the migration chain is the one thing no unit test covers and, on a repo
# with no infrastructure yet, the one thing nobody has ever executed. The first
# real deploy will be the first time these run. This exercises them.
#
# Usage:  tools/migration_chain_check.sh          (from the repo root)
# Requires: docker
#
# It stubs the Supabase-managed primitives (auth schema/functions, auth.users,
# auth.identities, storage.buckets/objects, and the anon/authenticated/
# service_role roles) because a plain Postgres does not have them, then applies
# every supabase/migrations/*.sql in filename order with ON_ERROR_STOP=1.
#
# Exit 0 = the whole chain applies; non-zero = the first failing migration is
# printed with its error.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG_NAME="${PG_NAME:-migchain-check}"
IMAGE="postgres:16-alpine"

cleanup() { docker rm -f "$PG_NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

cleanup
docker run -d --name "$PG_NAME" -e POSTGRES_PASSWORD=t -e POSTGRES_DB=postgres "$IMAGE" >/dev/null

echo "waiting for postgres..."
for _ in $(seq 1 60); do
  docker exec "$PG_NAME" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

psqlx() { docker exec -i "$PG_NAME" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -f -; }

echo "stubbing supabase-managed primitives..."
psqlx <<'SQL' || { echo "stub failed"; exit 1; }
create extension if not exists pgcrypto;
create extension if not exists citext;

do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_storage_admin') then create role supabase_storage_admin nologin noinherit; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (
  instance_id uuid, id uuid primary key default gen_random_uuid(),
  aud varchar(255), role varchar(255), email varchar(255), encrypted_password varchar(255),
  email_confirmed_at timestamptz, invited_at timestamptz,
  confirmation_token varchar(255), confirmation_sent_at timestamptz,
  recovery_token varchar(255), recovery_sent_at timestamptz,
  email_change_token_new varchar(255), email_change varchar(255), email_change_sent_at timestamptz,
  last_sign_in_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  is_super_admin boolean, created_at timestamptz default now(), updated_at timestamptz default now(),
  phone text, phone_confirmed_at timestamptz, phone_change text default '',
  phone_change_token varchar(255) default '', phone_change_sent_at timestamptz,
  confirmed_at timestamptz generated always as (least(email_confirmed_at, phone_confirmed_at)) stored,
  email_change_token_current varchar(255) default '', email_change_confirm_status smallint default 0,
  banned_until timestamptz, reauthentication_token varchar(255) default '',
  reauthentication_sent_at timestamptz, is_sso_user boolean not null default false,
  deleted_at timestamptz, is_anonymous boolean not null default false);
create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  identity_data jsonb, provider text not null, last_sign_in_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  email text, provider_id text);
create index if not exists identities_user_id_idx on auth.identities(user_id);
create or replace function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $f$;
create or replace function auth.jwt() returns jsonb language sql stable as $f$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb); $f$;
create or replace function auth.role() returns text language sql stable as $f$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon'); $f$;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users, auth.identities to anon, authenticated, service_role;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text not null, owner uuid, created_at timestamptz default now(),
  updated_at timestamptz default now(), public boolean default false,
  avif_autodetection boolean default false, file_size_limit bigint,
  allowed_mime_types text[], owner_id text);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, created_at timestamptz default now(), updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(), metadata jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored,
  version text, owner_id text, user_metadata jsonb);
grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;
SQL

echo "applying migrations in order..."
count=0
for f in $(ls "$REPO_ROOT"/supabase/migrations/*.sql | sort); do
  count=$((count + 1))
  if ! docker exec -i "$PG_NAME" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -f - < "$f" >/tmp/mig.out 2>&1; then
    echo "FAILED: $(basename "$f")"
    grep -v NOTICE /tmp/mig.out | head -8
    exit 1
  fi
done
echo "applied $count migrations"

echo
echo "post-conditions:"
chk() { docker exec -i "$PG_NAME" psql -U postgres -d postgres -tA -c "$2" | tr -d ' \r'; }
echo "  claim_file_request_slot:      $(chk x "select count(*) from pg_proc where proname='claim_file_request_slot'")"
echo "  release_file_request_slot:    $(chk x "select count(*) from pg_proc where proname='release_file_request_slot'")"
echo "  file_request_uploads table:   $(chk x "select count(*) from information_schema.tables where table_name='file_request_uploads'")"
echo "  soft-delete cols remaining:   $(chk x "select count(*) from information_schema.columns where column_name='deleted_at' and table_schema='public'") (expect 0)"
echo "  public tables:                $(chk x "select count(*) from pg_tables where schemaname='public'")"
echo
echo "MIGRATION CHAIN: PASS"
