-- Add the optimistic-locking `version` column to domain_monitors.
--
-- domain_monitors was created (5302062) without `version`, but
-- PATCH /api/v1/domain-monitors/:id runs the shared optimistic-locking
-- pattern (requireIfMatch + checkVersionMatch, `.eq("version", ...)` and
-- `version = version + 1`). At runtime `current.version` was undefined, so
-- the update tried to write `version = NaN` to a non-existent column and
-- the request 500'd. Every other locked table (tickets, projects,
-- documents, approval_requests, findings, assets, ...) already has this
-- column via 5302051/5302058/5302059/5302060/5302061.
begin;

alter table public.domain_monitors
  add column if not exists version integer not null default 1;

commit;
