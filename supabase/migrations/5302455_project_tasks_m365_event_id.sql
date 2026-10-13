-- =========================================================
-- 5302455: persist the M365 calendar event id per task (API-P3-006)
--
-- `m365-calendar-sync` created a new Graph calendar event for every task on
-- every run, so a re-run duplicated the mailbox. Store the created event id on
-- the task: the next sync PATCHes the existing event (and recreates only when
-- Graph reports it gone, 404), making the sync idempotent per task.
-- =========================================================

begin;

alter table if exists public.project_tasks
  add column if not exists m365_event_id text;

comment on column public.project_tasks.m365_event_id is
  'Microsoft Graph event id created by the M365 calendar sync (API-P3-006); PATCHed on re-sync instead of creating duplicates.';

commit;
