-- =========================================================
-- 5302451: DB-level guard so an organization delete can never destroy audit rows
--
-- CHAIN-P2-004: 5302442 (DATA-P2-005) added the append-only
-- audit_log_archive plus archive_audit_logs / archive_org_audit_logs, and the
-- worker retention task and DELETE /organizations/:id call them before any
-- destructive step. But audit_logs.organization_id still declares
-- `on delete cascade` (5302108), so ANY organization deletion that does not go
-- through those two call sites (direct SQL, an admin tool, a future route)
-- silently destroys the org's compliance history before it can be archived.
--
-- A BEFORE DELETE trigger closes that for every path: it drains the org's
-- audit rows into the archive and fails the delete if any row remains, so the
-- cascade can only ever run against an empty set. Call sites that already
-- archived (remaining = 0) are a no-op.
-- =========================================================

begin;

create or replace function public.archive_org_audit_logs_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining bigint;
begin
  -- Same archive function the API/worker use. The batch ceiling (10k x 10k)
  -- is far above the worker's 1000 x 200 cap so a routine delete is never
  -- blocked by the batch limit — the remaining-row check below is the real
  -- fail-closed guard.
  perform public.archive_audit_logs(now(), old.id, 10000, 10000);

  select count(*) into v_remaining
  from public.audit_logs
  where organization_id = old.id;

  if v_remaining > 0 then
    raise exception 'refusing to delete organization %: % audit_logs row(s) could not be archived',
      old.id, v_remaining
      using errcode = '55000';
  end if;

  return old;
end;
$$;

comment on function public.archive_org_audit_logs_before_delete() is
  'BEFORE DELETE trigger on organizations (CHAIN-P2-004): archives the org''s audit_logs rows via archive_audit_logs and fails the delete if any row remains, so the FK cascade from 5302108 can never destroy audit evidence.';

drop trigger if exists archive_org_audit_logs_before_delete on public.organizations;
create trigger archive_org_audit_logs_before_delete
  before delete on public.organizations
  for each row
  execute function public.archive_org_audit_logs_before_delete();

-- Trigger functions are invoked by the table event, not called through
-- PostgREST; keep the execute grant off anon/authenticated anyway.
revoke all on function public.archive_org_audit_logs_before_delete() from public, anon, authenticated;

commit;
