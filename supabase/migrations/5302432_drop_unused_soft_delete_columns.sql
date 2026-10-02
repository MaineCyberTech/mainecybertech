-- DATA-P1-003: remove the unused soft-delete columns introduced by 5302109.
--
-- 5302109 added `deleted_at` / `deleted_by` (plus indexes) to tickets, projects
-- and documents, advertising tombstone semantics. In practice no write path ever
-- populated them and no read path ever filtered on them: the DELETE handlers in
-- apps/api/src/routes/{tickets,projects,documents}.ts have always performed a
-- hard `.delete()`, and every list/get/search query returns all rows.
--
-- The product decision (audit finding DATA-P1-003) is HARD DELETE. Recovery is
-- provided by database backups / PITR, not by in-row tombstones
-- (see docs/ROLLBACK_PROCEDURES.md §3). Keeping columns that no code honours
-- invites a false assumption that deletes are recoverable, so they are removed
-- to keep the schema honest.
--
-- The columns were never written, so every value is NULL and no data is lost.

begin;

drop index if exists public.idx_tickets_deleted_at;
drop index if exists public.idx_projects_deleted_at;
drop index if exists public.idx_documents_deleted_at;

alter table if exists public.tickets drop column if exists deleted_at;
alter table if exists public.tickets drop column if exists deleted_by;

alter table if exists public.projects drop column if exists deleted_at;
alter table if exists public.projects drop column if exists deleted_by;

alter table if exists public.documents drop column if exists deleted_at;
alter table if exists public.documents drop column if exists deleted_by;

commit;
