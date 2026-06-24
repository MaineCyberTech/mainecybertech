-- Transactional bulk update function for optimistic locking
-- Usage: SELECT bulk_update_with_version('tickets', '[{"id": "uuid1", "data": {"status": "closed", "version": 2}}, {"id": "uuid2", "data": {"status": "open", "version": 3}}]')

CREATE OR REPLACE FUNCTION bulk_update_with_version(
    table_name text,
    updates jsonb
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    update_record jsonb;
    table_oid oid;
    col_name text;
    version_col boolean;
    current_version int;
    new_version int;
    rows_affected int;
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

    -- Process each update in a single transaction
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        -- Get current version
        EXECUTE format('SELECT version FROM %I WHERE id = $1', table_name)
        INTO current_version
        USING (update_record->>'id')::uuid;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Record with id % not found', update_record->>'id';
        END IF;

        -- Check version match
        IF (update_record->'data'->>'version')::int IS NOT NULL THEN
            IF (update_record->'data'->>'version')::int <> current_version THEN
                RAISE EXCEPTION 'Version conflict for record %: expected %, got %', 
                    update_record->>'id', current_version, (update_record->'data'->>'version')::int;
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
            RAISE EXCEPTION 'Version conflict for record %: concurrent modification', update_record->>'id';
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
    END LOOP;
END;
$$;