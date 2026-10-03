-- Secure File Request Portal — persist uploads + org-parseable storage (FILE-P1-001/002)
--
-- The public intake endpoint previously wrote objects to
-- `uploads/requests/<token>/...` with no DB row. `storage_path_org_id` (5302026)
-- only parses paths that BEGIN with the org UUID, so cleanup treated every
-- intake object as an orphan (scheduled every 6h). This migration:
--   * records every accepted intake file in `file_request_uploads`
--     (FK to file_requests cascades on request delete);
--   * RLS: org members with `file-requests:read` may read rows for their org.
--
-- The application writer now uses `<org_uuid>/requests/<token>/...`, which
-- satisfies both the RLS helper and the download/cleanup reconciliation.
begin;

create table if not exists public.file_request_uploads (
  id uuid primary key default gen_random_uuid(),
  file_request_id uuid not null references public.file_requests(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  mime_type text,
  file_size bigint,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_file_request_uploads_request
  on public.file_request_uploads(file_request_id);
create index if not exists idx_file_request_uploads_org
  on public.file_request_uploads(organization_id);
create index if not exists idx_file_request_uploads_storage_path
  on public.file_request_uploads(storage_path);

alter table public.file_request_uploads enable row level security;

drop policy if exists "file_request_uploads_select_org" on public.file_request_uploads;
create policy "file_request_uploads_select_org" on public.file_request_uploads
  for select
  using (
    exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.organization_id = file_request_uploads.organization_id
        and m.status = 'approved'
    )
  );

-- Inserts/deletes are performed by the API/worker service role (RLS bypassed);
-- no authenticated insert policy is granted deliberately so a normal member
-- cannot forge an intake row.

commit;
