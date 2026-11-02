-- =========================================================
-- 5302462: bound the sop_library status vocabulary (DATA-P3-007)
--
-- sop_library.status was the last free-text status column behind a governance
-- CRUD route: createSopSchema/updateSopSchema accepted any string and the
-- table had no CHECK, so a crafted PATCH or a form typo persisted an arbitrary
-- workflow value the compliance-map/reporting queries cannot interpret. The
-- app already treats a small set as canonical — the admin SOP form's select
-- offers draft/active/archived (apps/web/lib/module-config.ts) and the
-- compliance map counts active vs everything else — while the demo/seed data
-- uses draft/published, so published is kept for replay safety.
--
-- Paired with the validator enum in apps/api/src/validators/governance.ts and
-- the catalog-parity assertion that keeps the two vocabularies in step.
--
-- Added NOT VALID (repo convention, see 5302457): PostgreSQL still enforces it
-- for every new INSERT/UPDATE, but adding it does not fail when legacy rows
-- hold a value outside the vocabulary. Idempotent via a pg_constraint lookup.
-- =========================================================

begin;

do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('sop_library', 'sop_library_status_check', 'status', array['draft', 'active', 'archived', 'published'])
    ) as t(tbl, con, col, vals)
  loop
    if exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = rec.tbl
       )
       and not exists (
         select 1
         from pg_constraint c
         join pg_class r on r.oid = c.conrelid
         join pg_namespace n on n.oid = r.relnamespace
         where c.conname = rec.con and r.relname = rec.tbl and n.nspname = 'public'
       )
    then
      execute format(
        'alter table public.%I add constraint %I check (%I in (%s)) not valid',
        rec.tbl,
        rec.con,
        rec.col,
        (select string_agg(quote_literal(v), ', ' order by v) from unnest(rec.vals) as v)
      );
    end if;
  end loop;
end;
$$;

commit;
