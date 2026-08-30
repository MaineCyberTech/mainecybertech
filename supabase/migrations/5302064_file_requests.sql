-- Secure File Request Portal (#24)
begin;

create table if not exists file_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  token text not null unique,
  storage_path text not null,
  max_file_size_mb integer default 50,
  allowed_mime_types text[],
  max_files integer default 1,
  expires_at timestamptz not null,
  upload_count integer not null default 0,
  completed_at timestamptz,
  status text not null default 'active',
  visibility text not null default 'internal',
  notify_on_upload boolean default true,
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_file_requests_org on file_requests(organization_id);
create index if not exists idx_file_requests_token on file_requests(token);
create index if not exists idx_file_requests_expires on file_requests(expires_at);
create index if not exists idx_file_requests_status on file_requests(status);

alter table file_requests enable row level security;

create policy "file_requests_select_org" on file_requests for select
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "file_requests_insert_auth" on file_requests for insert
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "file_requests_update_org" on file_requests for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "file_requests_delete_admin" on file_requests for delete
  using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = file_requests.organization_id and r.key in ('super_admin', 'admin')));

commit;
