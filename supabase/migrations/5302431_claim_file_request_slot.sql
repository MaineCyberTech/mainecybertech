-- Atomic upload-slot claim for file requests.
--
-- Why (audit FILE-P1-001 follow-up, run 20261002-0344): the API claimed a slot
-- with
--     .update({ upload_count: data.upload_count + 1 }).lt("upload_count", max_files)
-- where data.upload_count came from an earlier SELECT. The +1 happens in JS, so
-- the statement writes the STALE value plus one. Under concurrency every caller
-- reads the same low counter and every UPDATE satisfies upload_count < max_files,
-- so the limit can be exceeded without bound. Reproduced: five sequential
-- claims each reported success while upload_count reached only 1.
--
-- The fix is a DB-side increment inside a single atomic statement, guarded by
-- the limit, so the row is re-read under the statement's own snapshot and the
-- claim either succeeds exactly once per available slot or returns no row.
--
-- Returns the new upload_count on success. Returns no row when the request does
-- not exist, belongs to another organization, is not open, is past expiry, or
-- is already at max_files -- the caller maps "no row" to 410/404 as appropriate.
create or replace function public.claim_file_request_slot(
  p_request_id uuid,
  p_organization_id uuid
)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.file_requests fr
     set upload_count = fr.upload_count + 1
   where fr.id = p_request_id
     and fr.organization_id = p_organization_id
     and fr.status = 'active'
     and (fr.expires_at is null or fr.expires_at > now())
     and (fr.max_files is null or fr.upload_count < fr.max_files)
  returning fr.upload_count;
$$;

comment on function public.claim_file_request_slot(uuid, uuid) is
  'Atomically claim one upload slot on a file request. Returns the new upload_count, or no row when closed/expired/full/not-found. Replaces a non-atomic JS-side increment (audit FILE-P1-001).';

-- Release a previously claimed slot when the upload subsequently fails.
--
-- Must be a RELATIVE decrement guarded by upload_count > 0. An absolute write of
-- `claimed - 1` (the first fix attempt) is itself racy: `claimed` is stale by
-- the time the insert fails, so concurrent uploads get under-counted and
-- max_files can be exceeded. Reproduced against PostgreSQL 16: two claims
-- (1, 2) then an absolute rollback to 0 let three more uploads succeed - five
-- accepted with a limit of three.
create or replace function public.release_file_request_slot(p_request_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.file_requests fr
     set upload_count = fr.upload_count - 1
   where fr.id = p_request_id
     and fr.upload_count > 0
  returning fr.upload_count;
$$;

comment on function public.release_file_request_slot(uuid) is
  'Release a claimed file-request upload slot after a downstream failure. Relative, guarded decrement so concurrent claims are not under-counted (audit FILE-P1-001).';

-- Service-role only: the API calls these with the admin client. No anon or
-- authenticated grant, so the anon-key + JWT path cannot claim or release slots.
revoke all on function public.claim_file_request_slot(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_file_request_slot(uuid, uuid) to service_role;
revoke all on function public.release_file_request_slot(uuid) from public, anon, authenticated;
grant execute on function public.release_file_request_slot(uuid) to service_role;
