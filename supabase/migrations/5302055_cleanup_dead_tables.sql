-- Cleanup 9 dead tables with no API/SDK/frontend usage
-- Keep webhook_dead_letters (active in 5302050)
--
-- Destructive: the drops below discard all rows in the named tables, and a
-- fresh replay is applied statement-by-statement (psql autocommit), so the
-- begin;/commit; wrapper keeps it atomic (DATA-P2-002).
--
-- Rollback: the nine tables were dead schema (no live API/SDK/frontend
-- readers or writers), so reversing this migration is DDL-only — re-create
-- them from 5302026 and re-create their RLS policies. Any rows present when
-- the drop ran are gone and require a backup/PITR restore (see
-- docs/migrations/README.md and docs/ROLLBACK_PROCEDURES.md §3).

begin;

drop table if exists public.appointments cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_threads cascade;
drop table if exists public.comments cascade;
drop table if exists public.contracts cascade;
drop table if exists public.contract_signers cascade;
drop table if exists public.document_permissions cascade;
drop table if exists public.onboarding_submissions cascade;
drop table if exists public.project_members cascade;

-- Add ON DELETE CASCADE to memberships.role_id FK
-- Allows role deletion without FK violation
alter table public.memberships
  drop constraint if exists memberships_role_id_fkey,
  add constraint memberships_role_id_fkey
    foreign key (role_id) references public.roles(id) on delete cascade;

commit;
