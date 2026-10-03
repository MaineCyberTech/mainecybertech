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
-- `slot_tokens` backs single-use release: a claim records an opaque token, and
-- release consumes it, so a repeated release for the same failed upload is a
-- no-op rather than a second decrement.
alter table public.file_requests
  add column if not exists slot_tokens jsonb not null default '{}'::jsonb;

-- Returns the new upload_count on success, plus a single-use slot token the
-- caller must present to release_file_request_slot if the upload fails. Returns
-- no row when the request does not exist, belongs to another organization, is
-- not open, is past expiry, or is already at max_files -- the caller maps
-- "no row" to 410/404 as appropriate.
create or replace function public.claim_file_request_slot(
  p_request_id uuid,
  p_organization_id uuid
)
returns table (upload_count integer, slot_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid := gen_random_uuid();
  v_count integer;
begin
  update public.file_requests fr
     set upload_count = fr.upload_count + 1,
         slot_tokens = (
           -- Prune consumed (false) tombstones while we are here. A tombstone
           -- only needs to outlive the double-release window for its own failed
           -- upload; keeping them forever would grow this column at the rate of
           -- failed uploads. Keys whose failure was long ago are dead weight.
           coalesce(
             (select jsonb_object_agg(k, v)
                from jsonb_each(fr.slot_tokens) as e(k, v)
               where v <> 'false'::jsonb),
             '{}'::jsonb
           )
           -- `true` (boolean), NOT 'true' (text). jsonb_build_object with a text
           -- literal stores a jsonb STRING, which never equals the boolean
           -- 'true'::jsonb - the release predicate silently failed to match.
           || jsonb_build_object(v_token::text, true)
         )
   where fr.id = p_request_id
     and fr.organization_id = p_organization_id
     and fr.status = 'active'
     and (fr.expires_at is null or fr.expires_at > now())
     and (fr.max_files is null or fr.upload_count < fr.max_files)
  returning fr.upload_count into v_count;

  if v_count is null then
    return;  -- no row: full / closed / expired / wrong org
  end if;

  return query select v_count, v_token;
end;
$$;

comment on function public.claim_file_request_slot(uuid, uuid) is
  'Atomically claim one upload slot on a file request. Returns the new upload_count, or no row when closed/expired/full/not-found. Replaces a non-atomic JS-side increment (audit FILE-P1-001).';

-- Release a previously claimed slot when the upload subsequently fails.
--
-- Two properties this must have, both learned from review:
--
-- 1. RELATIVE, not absolute. (An earlier attempt wrote `claimed - 1`, which is
--    stale under concurrency; reproduced: 5 accepted uploads against a limit of
--    3.) Guarded by upload_count > 0 so it cannot go negative.
--
-- 2. NOT DOUBLE-RELEASABLE. A bare decrement can be called twice for one failed
--    claim, walking the counter down and re-opening headroom (reproduced:
--    2 -> 1 -> 0 while one real upload existed). The claim therefore returns an
--    opaque `slot_token` which must be presented to release; each token can be
--    consumed exactly once. This makes release idempotent by construction rather
--    than by caller discipline, and mirrors the claim's organization guard.
--
-- Returns the new upload_count, or no row when the request id/org do not match,
-- the token is unknown, or the token was already released.
create or replace function public.release_file_request_slot(
  p_request_id uuid,
  p_organization_id uuid,
  p_slot_token uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.file_requests fr
     set upload_count = fr.upload_count - 1
   where fr.id = p_request_id
     and fr.organization_id = p_organization_id
     and fr.upload_count > 0
     and (fr.slot_tokens ? p_slot_token::text)
     -- Parentheses are REQUIRED: `->` binds LOWER than `=`, so the
     -- unparenthesised form parses as `slot_tokens -> (token = 'true')`, which
     -- evaluates to a non-boolean jsonb and never matches - a silent no-op that
     -- looks like "token already consumed". Verified against PostgreSQL 16.
     and ((fr.slot_tokens -> p_slot_token::text) = 'true'::jsonb)
  returning fr.upload_count into v_count;

  if v_count is null then
    return null;
  end if;

  -- Consume the token: mark it released so a second call is a no-op.
  update public.file_requests fr
     set slot_tokens = jsonb_set(fr.slot_tokens, array[p_slot_token::text], 'false'::jsonb)
   where fr.id = p_request_id;
  return v_count;
end;
$$;

comment on function public.release_file_request_slot(uuid, uuid, uuid) is
  'Release a claimed file-request upload slot after a downstream failure. Relative, non-negative, org-guarded and single-use via slot_token so a repeated release cannot under-count (audit FILE-P1-001).';

-- Drop a slot token once its upload has been committed.
--
-- The token exists only to make a FAILED upload releasable exactly once. After
-- the upload row is committed the slot is permanent and no release can
-- legitimately follow, so the token is dead weight - and because the claim adds
-- one key per upload, leaving them would grow `slot_tokens` unboundedly for the
-- lifetime of the request. This removes it; it does NOT touch upload_count.
--
-- Distinguished from release_file_request_slot deliberately: that one decrements
-- the counter (upload failed), this one does not (upload succeeded).
create or replace function public.release_slot_token(
  p_request_id uuid,
  p_organization_id uuid,
  p_slot_token uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.file_requests fr
     set slot_tokens = fr.slot_tokens - p_slot_token::text
   where fr.id = p_request_id
     and fr.organization_id = p_organization_id
     and fr.slot_tokens ? p_slot_token::text;
$$;

comment on function public.release_slot_token(uuid, uuid, uuid) is
  'Discard a consumed file-request slot token after a successful upload so slot_tokens does not grow unboundedly. Does not alter upload_count.';

-- Service-role only: the API calls these with the admin client. No anon or
-- authenticated grant, so the anon-key + JWT path cannot claim or release slots.
revoke all on function public.claim_file_request_slot(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_file_request_slot(uuid, uuid) to service_role;
revoke all on function public.release_file_request_slot(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_file_request_slot(uuid, uuid, uuid) to service_role;
revoke all on function public.release_slot_token(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_slot_token(uuid, uuid, uuid) to service_role;
