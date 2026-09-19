-- P1 fix (audit DATA-005 / RLS-004):
-- bulk_update_with_version(text, jsonb) was:
--   * PUBLIC-executable (default EXECUTE granted to PUBLIC, never revoked) ->
--     anon/authenticated could invoke a generic write primitive via PostgREST
--   * LANGUAGE plpgsql with invoker rights and no search_path pinning
--   * no table whitelist and no caller-org validation
--
-- This migration hardens it:
--   1. REVOKE ALL from PUBLIC/anon, then GRANT only to authenticated + service_role.
--   2. SECURITY DEFINER + SET search_path = public (prevents search-path hijack).
--   3. Explicit session guard: anon/public sessions are rejected even before RLS.
--   4. Table whitelist (tickets, documents — the only tables the API calls it
--      with today; extend the list if new callers are added).
--   5. Per-row organization membership validation: when a JWT-authenticated
--      user calls it directly (auth.uid() not null), each target row must belong
--      to an organization where the caller is an approved member (is_org_member).
--      Service-role calls (auth.uid() = null) are already gated by requireOrgAccess
--      at the API layer and pass through.

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
