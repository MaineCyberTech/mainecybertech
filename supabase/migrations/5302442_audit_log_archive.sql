-- DATA-P2-005: audit history must survive org deletion and the 365-day purge.
--
-- `audit_logs.organization_id` cascades on org delete (5302108) and the
-- retention worker hard-deletes rows older than its window, so tenant
-- offboarding and routine ageing both destroy the compliance trail with no
-- cold copy anywhere.
--
-- Fix: an append-only archive table (no FK to `organizations`, so org deletion
-- cannot cascade into it) plus a batched archive-before-delete function.
--   * archive_audit_logs(cutoff, org, batch, max_batches) — copies rows to the
--     archive and deletes them in the same transaction, so a failure never
--     loses a row.
--   * archive_org_audit_logs(org, batch, max_batches) — the org-deletion
--     wrapper (cutoff = now()).
-- The worker retention task and DELETE /organizations/:id call these before
-- any destructive step.
--
-- Only service_role may execute the functions: an anon/authenticated caller
-- could otherwise move and delete the platform's audit trail through PostgREST.

begin;

create table if not exists public.audit_log_archive (
  id uuid primary key,
  organization_id uuid,
  actor_user_id uuid,
  actor_type public.audit_actor_type not null default 'user',
  action text not null,
  entity_type text not null,
  entity_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  archived_at timestamptz not null default now(),
  archive_reason text not null default 'retention'
);

comment on table public.audit_log_archive is
  'Append-only cold copy of audit_logs rows removed by org deletion or the retention purge (DATA-P2-005). No FK to organizations by design.';

create index if not exists idx_audit_log_archive_org_created_at
  on public.audit_log_archive (organization_id, created_at desc);
create index if not exists idx_audit_log_archive_archived_at
  on public.audit_log_archive (archived_at desc);

-- Age-based purge scan support (org-scoped scans already have
-- idx_audit_logs_org_created_at).
create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at);

alter table public.audit_log_archive enable row level security;

-- Platform admins can read the archive; every write goes through the
-- SECURITY DEFINER functions below (or service_role), so no insert/update/
-- delete policies exist.
drop policy if exists "audit_log_archive_select_super_admin" on public.audit_log_archive;
create policy "audit_log_archive_select_super_admin" on public.audit_log_archive
  for select using (public.is_super_admin());

create or replace function public.archive_audit_logs(
  p_cutoff timestamptz default now(),
  p_organization_id uuid default null,
  p_batch_size integer default 1000,
  p_max_batches integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text;
  v_batch integer := 0;
  v_batches integer := 0;
  v_archived integer := 0;
begin
  if p_batch_size is null or p_batch_size < 1 then
    raise exception 'p_batch_size must be a positive integer';
  end if;
  if p_max_batches is null or p_max_batches < 1 then
    raise exception 'p_max_batches must be a positive integer';
  end if;

  v_reason := case when p_organization_id is null then 'retention' else 'org_deletion' end;

  loop
    exit when v_batches >= p_max_batches;

    -- Move one bounded batch atomically: the DELETE ... RETURNING feeds the
    -- INSERT, so both happen in one statement and a failure rolls back both.
    with batch as (
      select al.id
      from public.audit_logs al
      where al.created_at < p_cutoff
        and (p_organization_id is null or al.organization_id = p_organization_id)
      order by al.created_at
      limit p_batch_size
      for update skip locked
    ),
    moved as (
      delete from public.audit_logs al
      using batch b
      where al.id = b.id
      returning al.id, al.organization_id, al.actor_user_id, al.actor_type,
                al.action, al.entity_type, al.entity_id, al.ip_address,
                al.user_agent, al.metadata, al.created_at
    )
    insert into public.audit_log_archive (
      id, organization_id, actor_user_id, actor_type, action, entity_type,
      entity_id, ip_address, user_agent, metadata, created_at, archive_reason
    )
    select id, organization_id, actor_user_id, actor_type, action, entity_type,
           entity_id, ip_address, user_agent, metadata, created_at, v_reason
    from moved;

    get diagnostics v_batch = row_count;
    exit when v_batch = 0;
    v_archived := v_archived + v_batch;
    v_batches := v_batches + 1;
  end loop;

  return v_archived;
end;
$$;

comment on function public.archive_audit_logs(timestamptz, uuid, integer, integer) is
  'Archive and delete audit_logs rows older than p_cutoff (optionally only one org), in bounded batches. Returns the archived row count; a full return of p_batch_size * p_max_batches means the backlog was not drained (DATA-P2-005).';

create or replace function public.archive_org_audit_logs(
  p_organization_id uuid,
  p_batch_size integer default 1000,
  p_max_batches integer default 200
)
returns integer
language sql
security definer
set search_path = public
as $$
  select public.archive_audit_logs(now(), p_organization_id, p_batch_size, p_max_batches);
$$;

comment on function public.archive_org_audit_logs(uuid, integer, integer) is
  'Archive every audit_logs row for an organization before the org row (and its cascades) are deleted (DATA-P2-005).';

revoke all on function public.archive_audit_logs(timestamptz, uuid, integer, integer)
  from public, anon, authenticated;
revoke all on function public.archive_org_audit_logs(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.archive_audit_logs(timestamptz, uuid, integer, integer)
  to service_role;
grant execute on function public.archive_org_audit_logs(uuid, integer, integer)
  to service_role;

commit;
