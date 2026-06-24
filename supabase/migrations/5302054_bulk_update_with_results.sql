-- Transactional bulk update function with per-item results
-- Returns JSON array of results: [{"id": "uuid", "success": true, "version": 2}, {"id": "uuid", "success": false, "error": "Version conflict"}]

CREATE OR REPLACE FUNCTION bulk_update_with_version(
    table_name text,
    updates jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    update_record jsonb;
    table_oid oid;
    version_col boolean;
    current_version int;
    new_version int;
    rows_affected int;
    results jsonb := '[]'::jsonb;
    result_record jsonb;
BEGIN
    -- Check if table exists and has version column
    SELECT c.oid INTO table_oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = table_name AND n.nspname = 'public';
    IF table_oid IS NULL THEN
        RAISE EXCEPTION 'Table % not found', table_name;
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = table_name AND column_name = 'version'
    ) INTO version_col;

    IF NOT version_col THEN
        RAISE EXCEPTION 'Table % does not have version column', table_name;
    END IF;

    -- Process each update and collect results
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        -- Get current version
        EXECUTE format('SELECT version FROM %I WHERE id = $1', table_name)
        INTO current_version
        USING (update_record->>'id')::uuid;

        IF NOT FOUND THEN
            result_record := jsonb_build_object(
                'id', update_record->>'id',
                'success', false,
                'error', format('Record with id % not found', update_record->>'id')
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
                    'error', format('Version conflict for record %: expected %, got %', 
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
            table_name
        )
        USING new_version, (update_record->>'id')::uuid, current_version;

        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        IF rows_affected = 0 THEN
            result_record := jsonb_build_object(
                'id', update_record->>'id',
                'success', false,
                'error', format('Version conflict for record %: concurrent modification', update_record->>'id')
            );
            results := results || result_record;
            CONTINUE;
        END IF;

        -- Apply the actual data updates (excluding version from data)
        EXECUTE format(
            'UPDATE %I SET %s WHERE id = $1',
            table_name,
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