-- =========================================================
-- 5302129: Supabase RLS / security audit fixes
--
-- Source: prompts/repo-deep-dive/20260806-1722-develop-75d3926/
--   37_supabase_rls_policy_deep_dive.md (fresh 2026-08-06 audit).
--
-- Sections:
--   1. [P0] RLS-P0-001  public_interactions: re-enable RLS + anon/authenticated
--                      revoke (SELECT/UPDATE/DELETE), INSERT only.
--   2. [P0/P1] RLS-P1-001 increment_article_count: revoke PUBLIC/anon,
--                      pin search_path, allowlist field_name, add org check.
--   3. [P1] RLS-P2-002 / DATA-P1-001 bulk_update_with_version: per-table
--                      column allowlist (no identity/tenant/version writes).
--   4. [P2] RLS-P2-001  mark_task_read: caller-identity + task/org checks.
--   5. [P2] RLS-P2-003  policy permission vocabulary -> 5302118 catalog keys
--                      (tickets:manage->edit, tickets:comment->create/edit,
--                      projects:manage->edit/create/delete,
--                      documents:upload->create, documents:manage->edit/delete).
--   6. [P2] RLS-P2-003  5302128 no-op grants: add 'retention' +
--                      'training-modules' catalog rows and role grants.
--   7. [P2] RLS-P2-004  5302128 MSP platform roles added to RLS admin gates
--                      (engineer/dispatcher/security-analyst/project-manager/
--                      finance/onboarding-specialist) — 89 module-table gates
--                      (generated from 5302100/5302101/5302112) + bootstrap
--                      user_has_role gates + can_read_document role array.
--
-- All statements are idempotent (GRANT/REVOKE no-op when already applied;
-- DROP ... IF EXISTS precedes every CREATE policy; functions use
-- CREATE OR REPLACE; catalog rows use ON CONFLICT DO NOTHING).
-- =========================================================

-- =========================================================
-- 1. [P0] public_interactions — re-enable RLS, revoke anon/authenticated DML
-- =========================================================
-- 5302038 disabled RLS on this PII table (contact form: name, email, phone,
-- message) and the 5302116 grant sweep gave anon + authenticated full DML.
-- Anonymous visitors still need INSERT (the contact form), but must not be
-- able to SELECT/UPDATE/DELETE leads. service_role keeps full DML so the
-- worker retention purge (public-interaction-retention) still works.

alter table public.public_interactions enable row level security;

revoke select, update, delete on table public.public_interactions from anon;
revoke select, update, delete on table public.public_interactions from authenticated;

grant insert on table public.public_interactions to anon;
grant insert on table public.public_interactions to authenticated;

-- Ensure the INSERT-only policies exist (created by 5302033/5302036/5302037;
-- re-asserted idempotently so the table is never insert-locked by RLS).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'public_interactions'
      and policyname = 'public_interactions_insert'
  ) then
    create policy "public_interactions_insert" on public.public_interactions
      for insert to anon with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'public_interactions'
      and policyname = 'public_interactions_insert_authenticated'
  ) then
    create policy "public_interactions_insert_authenticated" on public.public_interactions
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'public_interactions'
      and policyname = 'public_interactions_insert_service_role'
  ) then
    create policy "public_interactions_insert_service_role" on public.public_interactions
      for insert to service_role with check (true);
  end if;
end $$;

-- =========================================================
-- 2. [P0/P1] increment_article_count — PUBLIC definer write primitive
-- =========================================================
-- 5302098 created a SECURITY DEFINER function with default PUBLIC EXECUTE,
-- no search_path pinning, no org check, and an unvalidated field_name that
-- could target ANY column of ANY knowledge_articles row cross-tenant.

revoke all on function public.increment_article_count(uuid, text) from public;
revoke all on function public.increment_article_count(uuid, text) from anon;

grant execute on function public.increment_article_count(uuid, text) to authenticated;
grant execute on function public.increment_article_count(uuid, text) to service_role;

create or replace function public.increment_article_count(article_id uuid, field_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- Only the two feedback counters may be incremented (blocks arbitrary
  -- column writes, e.g. organization_id / created_by).
  if field_name not in ('helpful_count', 'not_helpful_count') then
    raise exception 'field_name not allowed: %', field_name;
  end if;

  select organization_id into v_org_id
  from public.knowledge_articles
  where id = article_id;

  if v_org_id is null then
    raise exception 'article not found';
  end if;

  -- JWT-authenticated callers must be approved members of the article's org;
  -- service-role calls (auth.uid() is null, i.e. the API/worker) pass through.
  if auth.uid() is not null
     and not public.is_org_approved_member(v_org_id) then
    raise exception 'caller is not an approved member of the owning organization';
  end if;

  execute format('update public.knowledge_articles set %I = %I + 1 where id = $1', field_name, field_name)
    using article_id;
end;
$$;

-- =========================================================
-- 3. [P1] bulk_update_with_version — per-table column allowlist
-- =========================================================
-- 5302111 hardened the RPC (REVOKE PUBLIC/anon, search_path, table whitelist,
-- per-row org check) but the write-set was unbounded: an approved member
-- could set organization_id / created_by / version / any column via the
-- data jsonb. Add a strict per-table allowlist matching the columns the API
-- actually bulk-updates (apps/api/src/routes/tickets.ts: status, priority;
-- apps/api/src/routes/documents.ts: folder_path, description, visibility).
-- identity / tenant / version columns are implicitly forbidden.

revoke all on function public.bulk_update_with_version(text, jsonb) from public;
revoke all on function public.bulk_update_with_version(text, jsonb) from anon;

grant execute on function public.bulk_update_with_version(text, jsonb) to authenticated;
grant execute on function public.bulk_update_with_version(text, jsonb) to service_role;

create or replace function public.bulk_update_with_version(
    table_name text,
    updates jsonb
) RETURNS jsonb
LANGUAGE plpgsql
security definer
set search_path = public
AS $$
DECLARE
    update_record jsonb;
    table_oid oid;
    version_col boolean;
    current_version int;
    new_version int;
    rows_affected int;
    caller_uid uuid := (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
    caller_role text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
    row_org_id uuid;
    v_table_name text := table_name;
    results jsonb := '[]'::jsonb;
    result_record jsonb;
BEGIN
    -- 1. Block anon/public sessions outright (defense in depth beyond REVOKE).
    --    Claims are read defensively ('' or NULL when not running under
    --    PostgREST, e.g. SQL editor) so the function never crashes on parsing.
    if caller_role in ('anon', 'public')
       or session_user in ('anon', 'public') then
        raise exception 'permission denied for bulk_update_with_version';
    end if;

    -- 2. Whitelist: only tables the API is known to bulk-update
    if v_table_name not in ('tickets', 'documents') then
        raise exception 'bulk updates are not allowed on table %', v_table_name;
    end if;

    -- 3. Check if table exists and has version column
    SELECT c.oid INTO table_oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = v_table_name AND n.nspname = 'public';
    IF table_oid IS NULL THEN
        RAISE EXCEPTION 'Table % not found', v_table_name;
    END IF;

    -- Note: the table-name parameter shadows information_schema.columns.table_name,
    -- so the columns relation is aliased and the parameter is referenced
    -- through the local v_table_name to avoid an ambiguous-reference error.
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = v_table_name AND c.column_name = 'version'
    ) INTO version_col;

    IF NOT version_col THEN
        RAISE EXCEPTION 'Table % does not have version column', v_table_name;
    END IF;

    -- Process each update and collect results
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        -- Get current version
        EXECUTE format('SELECT version FROM %I WHERE id = $1', v_table_name)
        INTO current_version
        USING (update_record->>'id')::uuid;

        IF NOT FOUND THEN
            result_record := jsonb_build_object(
                'id', update_record->>'id',
                'success', false,
                'error', format('Record with id %s not found', update_record->>'id')
            );
            results := results || result_record;
            CONTINUE;
        END IF;

        -- 4. For JWT-authenticated callers, validate approved org membership per row
        IF caller_uid IS NOT NULL THEN
            EXECUTE format('SELECT organization_id FROM %I WHERE id = $1', v_table_name)
            INTO row_org_id
            USING (update_record->>'id')::uuid;

            IF row_org_id IS NULL OR NOT public.is_org_member(row_org_id) THEN
                result_record := jsonb_build_object(
                    'id', update_record->>'id',
                    'success', false,
                    'error', 'Caller is not an approved member of the owning organization'
                );
                results := results || result_record;
                CONTINUE;
            END IF;
        END IF;

        -- 4b. Column allowlist (audit RLS-P2-002): only columns the API
        --     bulk-updates may be written. organization_id, created_by, id
        --     and version are never in the lists, so tenant/identity/version
        --     writes are rejected for every caller (service_role included).
        IF NOT EXISTS (
            SELECT 1
            FROM jsonb_object_keys(update_record->'data') AS k(key)
            WHERE key <> ALL (
                CASE v_table_name
                    WHEN 'tickets'   THEN ARRAY['status', 'priority']::text[]
                    WHEN 'documents' THEN ARRAY['folder_path', 'description', 'visibility']::text[]
                    ELSE ARRAY[]::text[]
                END
            )
        ) THEN
            NULL; -- every key is on the allowlist
        ELSE
            result_record := jsonb_build_object(
                'id', update_record->>'id',
                'success', false,
                'error', format('bulk update for table %s contains columns outside the allowlist', v_table_name)
            );
            results := results || result_record;
            CONTINUE;
        END IF;

        -- Check version match
        IF (update_record->'data'->>'version')::int IS NOT NULL THEN
            IF (update_record->'data'->>'version')::int <> current_version THEN
                result_record := jsonb_build_object(
                    'id', update_record->>'id',
                    'success', false,
                    'error', format('Version conflict for record %s: expected %s, got %s',
                        update_record->>'id', current_version, (update_record->'data'->>'version')::int)
                );
                results := results || result_record;
                CONTINUE;
            END IF;
        END IF;

        new_version := current_version + 1;

        -- Perform update with version check
        EXECUTE format(
            'UPDATE %I SET version = $1 WHERE id = $2 AND version = $3',
            v_table_name
        )
        USING new_version, (update_record->>'id')::uuid, current_version;

        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        IF rows_affected = 0 THEN
            result_record := jsonb_build_object(
                'id', update_record->>'id',
                'success', false,
                'error', format('Version conflict for record %s: concurrent modification', update_record->>'id')
            );
            results := results || result_record;
            CONTINUE;
        END IF;

        -- Apply the actual data updates (excluding version from data)
        EXECUTE format(
            'UPDATE %I SET %s WHERE id = $1',
            v_table_name,
            (SELECT string_agg(format('%I = %L', key, value), ', ')
             FROM jsonb_each(update_record->'data')
             WHERE key <> 'version')
        )
        USING (update_record->>'id')::uuid;

        -- Success
        result_record := jsonb_build_object(
            'id', update_record->>'id',
            'success', true,
            'version', new_version
        );
        results := results || result_record;
    END LOOP;

    RETURN results;
END;
$$;

-- =========================================================
-- 4. [P2] mark_task_read — caller identity + task/org validation
-- =========================================================
-- 5302122 created a SECURITY DEFINER RPC that trusted the caller-supplied
-- p_user_id and never verified the task/org relationship, so any
-- authenticated user could mark read state for any user/task/org tuple
-- (RLS-bypassing cross-org write).

revoke all on function public.mark_task_read(uuid, uuid, uuid) from public, anon;
grant execute on function public.mark_task_read(uuid, uuid, uuid) to authenticated, service_role;

create or replace function public.mark_task_read(
  p_user_id uuid,
  p_task_id uuid,
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_uid uuid := auth.uid();
begin
  -- JWT-authenticated callers may only mark their OWN read state. The API
  -- calls as service_role (auth.uid() is null) and may mark any user's
  -- state — the route is already gated by requireOrgAccess.
  if v_caller_uid is not null
     and p_user_id is distinct from v_caller_uid then
    raise exception 'not allowed: cannot mark read state for another user';
  end if;

  -- The task must belong to the supplied org (blocks cross-org writes).
  if not exists (
    select 1 from public.project_tasks t
    where t.id = p_task_id
      and t.organization_id = p_organization_id
  ) then
    raise exception 'task not found in organization';
  end if;

  -- Direct (authenticated) callers must be approved members of the org.
  if v_caller_uid is not null
     and not public.is_org_approved_member(p_organization_id) then
    raise exception 'caller is not an approved member of the organization';
  end if;

  insert into public.project_task_comment_reads (user_id, task_id, organization_id, last_seen_at)
  values (p_user_id, p_task_id, p_organization_id, now())
  on conflict (user_id, task_id)
  do update set
    organization_id = excluded.organization_id,
    last_seen_at = excluded.last_seen_at;
end;
$$;

-- =========================================================
-- 5. [P2] Policy permission vocabulary -> 5302118 catalog keys
-- =========================================================
-- Bootstrap policies reference (module, action) pairs that do not exist in
-- the permission catalog (5302028/5302118), so the branches are permanently
-- false. Map to catalog keys:
--   tickets:manage   -> tickets:edit        tickets:comment -> tickets:create/edit
--   projects:manage  -> projects:edit       (delete policies -> :delete)
--   documents:upload -> documents:create    documents:manage -> documents:edit/delete
-- Dead references (contracts*, appointments*, onboarding_submissions) were
-- dropped with their tables in 5302055 and need no rewrite. billing:manage
-- and webhooks:manage exist in the catalog and are left untouched.

-- tickets (5302026 bootstrap)
drop policy if exists "tickets_update_with_permission" on public.tickets;
create policy "tickets_update_with_permission"
on public.tickets
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'tickets', 'edit')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'tickets', 'edit')
);

drop policy if exists "ticket_comments_insert_same_org" on public.ticket_comments;
create policy "ticket_comments_insert_same_org"
on public.ticket_comments
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    author_id = auth.uid()
    and public.is_org_approved_member(organization_id)
    and public.user_has_permission(organization_id, 'tickets', 'create')
  )
);

-- ticket_comments_update_own (5302034) — 5-minute self-edit window
drop policy if exists ticket_comments_update_own on public.ticket_comments;
create policy ticket_comments_update_own on public.ticket_comments
  for update using (
    author_id = auth.uid()
    and (
      public.is_super_admin()
      or public.user_has_permission(organization_id, 'tickets', 'edit')
    )
  ) with check (author_id = auth.uid());

-- projects / project_tasks (5302026 bootstrap)
drop policy if exists "projects_update_with_permission" on public.projects;
create policy "projects_update_with_permission"
on public.projects
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
);

drop policy if exists "project_tasks_update_with_permission" on public.project_tasks;
create policy "project_tasks_update_with_permission"
on public.project_tasks
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
);

drop policy if exists project_tasks_delete_with_permission on public.project_tasks;
create policy project_tasks_delete_with_permission
on public.project_tasks
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'delete')
);

-- project_updates (5302026 "projects extension" section)
drop policy if exists project_updates_select_admin_manage on public.project_updates;
create policy project_updates_select_admin_manage
on public.project_updates
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
);

drop policy if exists project_updates_insert_admin_manage on public.project_updates;
create policy project_updates_insert_admin_manage
on public.project_updates
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    public.is_super_admin()
    or public.user_has_permission(organization_id, 'projects', 'create')
  )
);

drop policy if exists project_updates_update_admin_manage on public.project_updates;
create policy project_updates_update_admin_manage
on public.project_updates
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
);

drop policy if exists project_updates_delete_admin_manage on public.project_updates;
create policy project_updates_delete_admin_manage
on public.project_updates
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'delete')
);

-- project_task_comments (5302026 "projects extension" section)
drop policy if exists project_task_comments_select_admin_manage on public.project_task_comments;
create policy project_task_comments_select_admin_manage
on public.project_task_comments
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
);

drop policy if exists project_task_comments_insert_admin_manage on public.project_task_comments;
create policy project_task_comments_insert_admin_manage
on public.project_task_comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    public.is_super_admin()
    or public.user_has_permission(organization_id, 'projects', 'create')
  )
);

drop policy if exists project_task_comments_update_admin_manage on public.project_task_comments;
create policy project_task_comments_update_admin_manage
on public.project_task_comments
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'edit')
);

drop policy if exists project_task_comments_delete_admin_manage on public.project_task_comments;
create policy project_task_comments_delete_admin_manage
on public.project_task_comments
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'projects', 'delete')
);

-- documents (5302026 "documents final shape" section)
drop policy if exists documents_insert_with_permission on public.documents;
create policy documents_insert_with_permission
on public.documents
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    uploaded_by = auth.uid()
    and public.is_org_approved_member(organization_id)
    and public.user_has_permission(organization_id, 'documents', 'create')
  )
);

drop policy if exists documents_update_with_permission on public.documents;
create policy documents_update_with_permission
on public.documents
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'edit')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'edit')
);

drop policy if exists documents_delete_with_permission on public.documents;
create policy documents_delete_with_permission
on public.documents
for delete
to authenticated
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'documents', 'delete')
);

drop policy if exists document_versions_insert_with_permission on public.document_versions;
create policy document_versions_insert_with_permission
on public.document_versions
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_versions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'create')
  )
);

-- document_permissions (restored by 5302110)
drop policy if exists document_permissions_select_admins on public.document_permissions;
create policy document_permissions_select_admins
on public.document_permissions
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'edit')
  )
);

drop policy if exists document_permissions_manage_admins on public.document_permissions;
create policy document_permissions_manage_admins
on public.document_permissions
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'edit')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'edit')
  )
);

-- can_read_document helper (bootstrap + 5302110 restore): map documents:manage
-- -> documents:edit and include the 5302128 platform-admin keys in the
-- internal-visibility role gate (finding 7).
create or replace function public.can_read_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and (
        public.is_super_admin()

        or d.visibility = 'public'::public.document_visibility

        or (
          d.visibility = 'org'::public.document_visibility
          and public.is_org_approved_member(d.organization_id)
        )

        or (
          d.visibility = 'internal'::public.document_visibility
          and (
            d.uploaded_by = auth.uid()
            or public.user_has_permission(d.organization_id, 'documents', 'edit')
            or public.user_has_role(d.organization_id, array['admin', 'super_admin', 'technician', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
          )
        )

        or (
          d.visibility = 'private'::public.document_visibility
          and (
            d.uploaded_by = auth.uid()
            or exists (
              select 1
              from public.document_permissions dp
              where dp.document_id = d.id
                and dp.user_id = auth.uid()
                and dp.can_view = true
            )
            or exists (
              select 1
              from public.document_permissions dp
              join public.memberships m
                on m.organization_id = d.organization_id
               and m.user_id = auth.uid()
               and m.role_id = dp.role_id
               and m.status = 'approved'
              where dp.document_id = d.id
                and dp.can_view = true
            )
            or public.user_has_permission(d.organization_id, 'documents', 'edit')
          )
        )
      )
  );
$$;

-- storage.objects policies for the 'documents' bucket (5302026)
drop policy if exists documents_bucket_insert_aligned on storage.objects;
create policy documents_bucket_insert_aligned
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or (
      public.is_org_approved_member(public.storage_path_org_id(name))
      and public.user_has_permission(public.storage_path_org_id(name), 'documents', 'create')
    )
  )
);

drop policy if exists documents_bucket_update_aligned on storage.objects;
create policy documents_bucket_update_aligned
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'edit')
  )
)
with check (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'edit')
  )
);

drop policy if exists documents_bucket_delete_aligned on storage.objects;
create policy documents_bucket_delete_aligned
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.storage_path_org_id(name) is not null
  and (
    public.is_super_admin()
    or public.user_has_permission(public.storage_path_org_id(name), 'documents', 'delete')
  )
);

-- =========================================================
-- 6. [P2] Catalog rows for 'retention' + 'training-modules'
-- =========================================================
-- 5302128 granted security-analyst -> retention and onboarding-specialist ->
-- training-modules, but neither module exists in the 5302118 catalog, so the
-- role_permissions inserts silently no-op'd. Add the rows (matching the
-- catalog schema: module_key/action_key/group_key/scope/label/description)
-- and re-issue the grants.

insert into public.permissions (module_key, action_key, group_key, scope, label, description)
values
  ('retention', 'view', 'security', 'admin', 'Retention Policies', 'View retention policies'),
  ('retention', 'create', 'security', 'admin', 'Retention Policies', 'Create retention policies'),
  ('retention', 'edit', 'security', 'admin', 'Retention Policies', 'Edit retention policies'),
  ('retention', 'delete', 'security', 'admin', 'Retention Policies', 'Delete retention policies'),
  ('training-modules', 'view', 'clients', 'admin', 'Training Modules', 'View training modules'),
  ('training-modules', 'create', 'clients', 'admin', 'Training Modules', 'Create training modules'),
  ('training-modules', 'edit', 'clients', 'admin', 'Training Modules', 'Edit training modules'),
  ('training-modules', 'delete', 'clients', 'admin', 'Training Modules', 'Delete training modules')
on conflict (module_key, action_key) do nothing;

-- super_admin: everything (mirrors 5302118's cross-join behavior)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'super_admin'
  and p.module_key in ('retention', 'training-modules')
on conflict (role_id, permission_id) do nothing;

-- admin: everything except destructive :delete (mirrors 5302118)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'admin'
  and p.module_key in ('retention', 'training-modules')
  and p.action_key <> 'delete'
on conflict (role_id, permission_id) do nothing;

-- security-analyst: retention view/create/edit (the 5302128 intent)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'security-analyst'
  and p.module_key = 'retention'
  and p.action_key in ('view', 'create', 'edit')
on conflict (role_id, permission_id) do nothing;

-- onboarding-specialist: training-modules view/create/edit (the 5302128 intent)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.key = 'onboarding-specialist'
  and p.module_key = 'training-modules'
  and p.action_key in ('view', 'create', 'edit')
on conflict (role_id, permission_id) do nothing;
-- =========================================================
-- 7. [P2] RLS-P2-004 5302128 MSP platform roles added to RLS admin gates
-- =========================================================
-- Module-table admin-gate policies from 5302100/5302101/5302112 (89 live
-- policies): every r.key in ('admin','super_admin') /
-- ('super_admin','admin') / ('admin','client_admin','technician') gate now
-- also accepts the 5302128 platform-admin keys.

-- 89 live admin-gate policies: append the 6 MSP platform-admin role keys (5302128) to the r.key in (...) list

drop policy if exists "ap_org_d" on public.ai_policies;
create policy "ap_org_d" on public.ai_policies
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = ai_policies.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "api_keys_admin_delete" on public.api_keys;
create policy "api_keys_admin_delete" on public.api_keys
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = api_keys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "api_keys_insert_admin" on public.api_keys;
create policy "api_keys_insert_admin" on public.api_keys
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = api_keys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "api_keys_update_admin" on public.api_keys;
create policy "api_keys_update_admin" on public.api_keys
  for update using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = api_keys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "approval_requests_admin_delete" on public.approval_requests;
create policy "approval_requests_admin_delete" on public.approval_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = approval_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "assets_admin_delete" on public.assets;
create policy "assets_admin_delete" on public.assets
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = assets.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "aw_org_d" on public.automation_workflows;
create policy "aw_org_d" on public.automation_workflows
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = automation_workflows.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "backup_admin_delete" on public.backup_status;
create policy "backup_admin_delete" on public.backup_status
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = backup_status.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "be_admin_delete" on public.badges_earned;
create policy "be_admin_delete" on public.badges_earned
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = badges_earned.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "break_glass_admin_delete" on public.break_glass_accounts;
create policy "break_glass_admin_delete" on public.break_glass_accounts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = break_glass_accounts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "br_admin_delete" on public.budget_roadmaps;
create policy "br_admin_delete" on public.budget_roadmaps
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = budget_roadmaps.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "cc_admin_delete" on public.camera_calculations;
create policy "cc_admin_delete" on public.camera_calculations
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = camera_calculations.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "cr_admin_delete" on public.change_requests;
create policy "cr_admin_delete" on public.change_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = change_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "client_onboarding_checklist_delete_admin" on public.client_onboarding_checklist_items;
create policy "client_onboarding_checklist_delete_admin" on public.client_onboarding_checklist_items
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = client_onboarding_checklist_items.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "client_onboarding_delete_admin" on public.client_onboarding_command_center_records;
create policy "client_onboarding_delete_admin" on public.client_onboarding_command_center_records
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = client_onboarding_command_center_records.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "crb_admin_delete" on public.client_runbooks;
create policy "crb_admin_delete" on public.client_runbooks
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = client_runbooks.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "cr_org_d" on public.compliance_readiness;
create policy "cr_org_d" on public.compliance_readiness
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = compliance_readiness.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "cf_admin_delete" on public.custom_forms;
create policy "cf_admin_delete" on public.custom_forms
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = custom_forms.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "cs_org_d" on public.cyber_scorecards;
create policy "cs_org_d" on public.cyber_scorecards
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = cyber_scorecards.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "dp_admin_delete" on public.device_profiles;
create policy "dp_admin_delete" on public.device_profiles
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = device_profiles.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "dmarc_admin_delete" on public.dmarc_analyses;
create policy "dmarc_admin_delete" on public.dmarc_analyses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dmarc_analyses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "dmarc_assessments_admin_delete" on public.dmarc_assessments;
create policy "dmarc_assessments_admin_delete" on public.dmarc_assessments
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dmarc_assessments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "dns_admin_delete" on public.dns_change_requests;
create policy "dns_admin_delete" on public.dns_change_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dns_change_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "document_shares_delete_own_org" on public.document_shares;
create policy "document_shares_delete_own_org"
  on public.document_shares for delete
  using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = document_shares.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'client_admin', 'technician', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "document_shares_insert_own_org" on public.document_shares;
create policy "document_shares_insert_own_org"
  on public.document_shares for insert
  with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = document_shares.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'client_admin', 'technician', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "document_shares_update_own_org" on public.document_shares;
create policy "document_shares_update_own_org"
  on public.document_shares for update
  using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = document_shares.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'client_admin', 'technician', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "domain_monitors_admin_delete" on public.domain_monitors;
create policy "domain_monitors_admin_delete" on public.domain_monitors
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = domain_monitors.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "dynamic_client_forms_org_delete" on public.dynamic_client_forms;
create policy "dynamic_client_forms_org_delete" on public.dynamic_client_forms
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dynamic_client_forms.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "dynamic_form_submissions_org_delete" on public.dynamic_form_submissions;
create policy "dynamic_form_submissions_org_delete" on public.dynamic_form_submissions
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = dynamic_form_submissions.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "ep_admin_delete" on public.endpoint_security;
create policy "ep_admin_delete" on public.endpoint_security
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = endpoint_security.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "file_requests_admin_delete" on public.file_requests;
create policy "file_requests_admin_delete" on public.file_requests
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = file_requests.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "findings_admin_delete" on public.findings;
create policy "findings_admin_delete" on public.findings
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = findings.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "hs_admin_delete" on public.hardware_staging;
create policy "hs_admin_delete" on public.hardware_staging
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = hardware_staging.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "idverify_admin_delete" on public.identity_verifications;
create policy "idverify_admin_delete" on public.identity_verifications
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = identity_verifications.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "incident_admin_delete" on public.incident_responses;
create policy "incident_admin_delete" on public.incident_responses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = incident_responses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "insurance_admin_delete" on public.insurance_evidence;
create policy "insurance_admin_delete" on public.insurance_evidence
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = insurance_evidence.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "isp_admin_delete" on public.isp_assessments;
create policy "isp_admin_delete" on public.isp_assessments
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = isp_assessments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "kbg_org_d" on public.kb_article_generations;
create policy "kbg_org_d" on public.kb_article_generations
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = kb_article_generations.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "kb_org_d" on public.knowledge_articles;
create policy "kb_org_d" on public.knowledge_articles
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = knowledge_articles.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "license_admin_delete" on public.license_allocations;
create policy "license_admin_delete" on public.license_allocations
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = license_allocations.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "license_tracking_admin_delete" on public.license_tracking;
create policy "license_tracking_admin_delete" on public.license_tracking
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = license_tracking.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "m365_admin_delete" on public.m365_hardening;
create policy "m365_admin_delete" on public.m365_hardening
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = m365_hardening.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "maintenance_admin_delete" on public.maintenance_notices;
create policy "maintenance_admin_delete" on public.maintenance_notices
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = maintenance_notices.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "module_comments_admin_delete" on public.module_comments;
create policy "module_comments_admin_delete" on public.module_comments
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = module_comments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "module_timeline_events_admin_delete" on public.module_timeline_events;
create policy "module_timeline_events_admin_delete" on public.module_timeline_events
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = module_timeline_events.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "nd_admin_delete" on public.network_diagrams;
create policy "nd_admin_delete" on public.network_diagrams
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = network_diagrams.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "offboarding_admin_delete" on public.offboarding_checklists;
create policy "offboarding_admin_delete" on public.offboarding_checklists
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = offboarding_checklists.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "onboarding_admin_delete" on public.onboarding_clients;
create policy "onboarding_admin_delete" on public.onboarding_clients
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = onboarding_clients.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "patch_admin_delete" on public.patch_compliance;
create policy "patch_admin_delete" on public.patch_compliance
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = patch_compliance.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "ph_org_d" on public.phishing_campaigns;
create policy "ph_org_d" on public.phishing_campaigns
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = phishing_campaigns.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "pm_admin_delete" on public.port_maps;
create policy "pm_admin_delete" on public.port_maps
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = port_maps.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "portal_module_settings_insert_admin" on public.portal_module_settings;
create policy "portal_module_settings_insert_admin" on public.portal_module_settings
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = portal_module_settings.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "portal_module_settings_update_admin" on public.portal_module_settings;
create policy "portal_module_settings_update_admin" on public.portal_module_settings
  for update using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = portal_module_settings.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "ps_org_d" on public.powershell_scripts;
create policy "ps_org_d" on public.powershell_scripts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = powershell_scripts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "pq_admin_delete" on public.procurement_quotes;
create policy "pq_admin_delete" on public.procurement_quotes
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = procurement_quotes.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "proposal_line_items_admin_delete" on public.proposal_line_items;
create policy "proposal_line_items_admin_delete" on public.proposal_line_items
  for delete using (
    exists (
      select 1 from public.proposals p
      join public.memberships m on m.organization_id = p.organization_id
      join public.roles r on m.role_id = r.id
      where p.id = proposal_line_items.proposal_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "proposal_phases_admin_delete" on public.proposal_phases;
create policy "proposal_phases_admin_delete" on public.proposal_phases
  for delete using (
    exists (
      select 1 from public.proposals p
      join public.memberships m on m.organization_id = p.organization_id
      join public.roles r on m.role_id = r.id
      where p.id = proposal_phases.proposal_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "proposals_admin_delete" on public.proposals;
create policy "proposals_admin_delete" on public.proposals
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = proposals.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "qbr_reports_admin_delete" on public.qbr_reports;
create policy "qbr_reports_admin_delete" on public.qbr_reports
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = qbr_reports.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "retention_admin_delete" on public.retention_policies;
create policy "retention_admin_delete" on public.retention_policies
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = retention_policies.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "risk_admin_delete" on public.risk_register;
create policy "risk_admin_delete" on public.risk_register
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = risk_register.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "sa_admin_delete" on public.saas_audits;
create policy "sa_admin_delete" on public.saas_audits
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = saas_audits.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "satisfaction_pulse_schedules_delete_admin" on public.satisfaction_pulse_schedules;
create policy "satisfaction_pulse_schedules_delete_admin" on public.satisfaction_pulse_schedules
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = satisfaction_pulse_schedules.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "satisfaction_pulse_templates_delete_admin" on public.satisfaction_pulse_templates;
create policy "satisfaction_pulse_templates_delete_admin" on public.satisfaction_pulse_templates
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = satisfaction_pulse_templates.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "satisfaction_pulses_delete_admin" on public.satisfaction_pulses;
create policy "satisfaction_pulses_delete_admin" on public.satisfaction_pulses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = satisfaction_pulses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "scheduled_check_results_admin_delete" on public.scheduled_check_results;
create policy "scheduled_check_results_admin_delete" on public.scheduled_check_results
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = scheduled_check_results.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "scheduled_check_results_insert_admin" on public.scheduled_check_results;
create policy "scheduled_check_results_insert_admin" on public.scheduled_check_results
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = scheduled_check_results.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "sh_admin_delete" on public.score_history;
create policy "sh_admin_delete" on public.score_history
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = score_history.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "service_catalog_admin_delete" on public.service_catalog;
create policy "service_catalog_admin_delete" on public.service_catalog
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = service_catalog.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "sp_admin_delete" on public.sharepoint_plans;
create policy "sp_admin_delete" on public.sharepoint_plans
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = sharepoint_plans.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "sla_logs_insert_admin" on public.sla_logs;
create policy "sla_logs_insert_admin" on public.sla_logs
  for insert with check (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = sla_logs.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "sop_org_d" on public.sop_library;
create policy "sop_org_d" on public.sop_library
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = sop_library.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "status_admin_delete" on public.status_components;
create policy "status_admin_delete" on public.status_components
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = status_components.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "incidents_admin_delete" on public.status_incidents;
create policy "incidents_admin_delete" on public.status_incidents
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = status_incidents.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "status_items_admin_delete" on public.status_items;
create policy "status_items_admin_delete" on public.status_items
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = status_items.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "tt_admin_delete" on public.tabletop_exercises;
create policy "tt_admin_delete" on public.tabletop_exercises
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = tabletop_exercises.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "triage_drafts_admin_delete" on public.ticket_triage_drafts;
create policy "triage_drafts_admin_delete" on public.ticket_triage_drafts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = ticket_triage_drafts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "te_admin_delete" on public.time_entries;
create policy "te_admin_delete" on public.time_entries
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = time_entries.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "courses_admin_delete" on public.training_courses;
create policy "courses_admin_delete" on public.training_courses
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = training_courses.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "enrollments_admin_delete" on public.training_enrollments;
create policy "enrollments_admin_delete" on public.training_enrollments
  for delete using (
    exists (
      select 1 from public.training_courses tc
      join public.memberships m on m.organization_id = tc.organization_id
      join public.roles r on m.role_id = r.id
      where tc.id = training_enrollments.course_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "lessons_admin_delete" on public.training_lessons;
create policy "lessons_admin_delete" on public.training_lessons
  for delete using (
    exists (
      select 1 from public.training_courses tc
      join public.memberships m on m.organization_id = tc.organization_id
      join public.roles r on m.role_id = r.id
      where tc.id = training_lessons.course_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "tm_org_d" on public.training_modules;
create policy "tm_org_d" on public.training_modules
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = training_modules.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "us_admin_delete" on public.unifi_surveys;
create policy "us_admin_delete" on public.unifi_surveys
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = unifi_surveys.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "uptime_checks_admin_delete" on public.uptime_checks;
create policy "uptime_checks_admin_delete" on public.uptime_checks
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = uptime_checks.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "uptime_results_admin_delete" on public.uptime_results;
create policy "uptime_results_admin_delete" on public.uptime_results
  for delete using (
    exists (
      select 1 from public.uptime_checks uc
      join public.memberships m on m.organization_id = uc.organization_id
      join public.roles r on m.role_id = r.id
      where uc.id = uptime_results.check_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "vendor_contacts_admin_delete" on public.vendor_contacts;
create policy "vendor_contacts_admin_delete" on public.vendor_contacts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = vendor_contacts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "vendor_contracts_admin_delete" on public.vendor_contracts;
create policy "vendor_contracts_admin_delete" on public.vendor_contracts
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = vendor_contracts.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('super_admin', 'admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "webhook_deliveries_admin_delete" on public.webhook_deliveries;
create policy "webhook_deliveries_admin_delete" on public.webhook_deliveries
  for delete using (
    exists (
      select 1 from public.webhook_endpoints we
      join public.memberships m on m.organization_id = we.organization_id
      join public.roles r on m.role_id = r.id
      where we.id = webhook_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );

drop policy if exists "website_monitors_admin_delete" on public.website_monitors;
create policy "website_monitors_admin_delete" on public.website_monitors
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = website_monitors.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist')
    )
  );


-- =========================================================
-- 7 (cont.) Bootstrap user_has_role admin gates -> platform-admin keys
-- =========================================================
-- The 5302026 bootstrap gates org/membership/audit management with
-- user_has_role arrays that omit the 5302128 MSP platform roles. Expand the
-- arrays so platform admins (who bypass tenant scoping at the API layer) are
-- also recognized at the RLS layer. Client-scoped keys (client_admin,
-- technician) are retained.

drop policy if exists "organizations_update_admin_or_super_admin" on public.organizations;
create policy "organizations_update_admin_or_super_admin"
on public.organizations
for update
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "organization_domains_select_admins" on public.organization_domains;
create policy "organization_domains_select_admins"
on public.organization_domains
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "organization_domains_manage_admins" on public.organization_domains;
create policy "organization_domains_manage_admins"
on public.organization_domains
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "memberships_manage_admin_or_super_admin" on public.memberships;
create policy "memberships_manage_admin_or_super_admin"
on public.memberships
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "user_permission_overrides_admin_only" on public.user_permission_overrides;
create policy "user_permission_overrides_admin_only"
on public.user_permission_overrides
for all
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
)
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "notification_preferences_select_self_or_admin" on public.notification_preferences;
create policy "notification_preferences_select_self_or_admin"
on public.notification_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_org_approved_member(organization_id)
  or public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "notification_preferences_upsert_self_or_admin" on public.notification_preferences;
create policy "notification_preferences_upsert_self_or_admin"
on public.notification_preferences
for all
to authenticated
using (
  (user_id = auth.uid() and public.is_org_approved_member(organization_id))
  or public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
)
with check (
  (user_id = auth.uid() and public.is_org_approved_member(organization_id))
  or public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'client_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "audit_logs_select_admins" on public.audit_logs;
create policy "audit_logs_select_admins"
on public.audit_logs
for select
to authenticated
using (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);

drop policy if exists "audit_logs_insert_server_or_admin" on public.audit_logs;
create policy "audit_logs_insert_server_or_admin"
on public.audit_logs
for insert
to authenticated
with check (
  public.is_super_admin()
  or public.user_has_role(organization_id, array['admin', 'super_admin', 'engineer', 'dispatcher', 'security-analyst', 'project-manager', 'finance', 'onboarding-specialist'])
);
