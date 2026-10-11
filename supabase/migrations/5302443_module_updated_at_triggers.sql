-- DATA-P2-009: `updated_at` is frozen on 69 module tables.
--
-- The bootstrap created `public.set_updated_at()` and wired it to the 14 core
-- tables, but every module table added since declares
-- `updated_at timestamptz not null default now()` with no trigger, and the
-- generic crudRoute PATCH factories never write the column either. Rows keep
-- their insert-time value forever, which silently breaks recency sorts,
-- delta sync, cache invalidation and audit queries.
--
-- Install the existing trigger on every public base table that has an
-- `updated_at` column and no `set_updated_at` trigger yet. The loop is
-- idempotent and matches triggers by function (not name), so the bootstrap
-- core tables and webhook_endpoints/project_updates are skipped. A table that
-- already owns a trigger with the generated name is skipped too, so the
-- migration can never fail on a name collision.

begin;

do $$
declare
  r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and t.table_type = 'BASE TABLE'
      and not exists (
        select 1
        from pg_trigger tg
        join pg_class cl on cl.oid = tg.tgrelid
        join pg_namespace n on n.oid = cl.relnamespace
        where n.nspname = 'public'
          and cl.relname = c.table_name
          and not tg.tgisinternal
          and (
            tg.tgfoid = 'public.set_updated_at'::regproc
            or tg.tgname = format('trg_%s_updated_at', c.table_name)
          )
      )
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      format('trg_%s_updated_at', r.table_name),
      r.table_name
    );
  end loop;
end;
$$;

commit;
