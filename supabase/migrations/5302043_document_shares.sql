-- 5302043_document_shares.sql
-- Document share links for external access

create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  access_count int not null default 0,
  max_access int,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_shares_document on public.document_shares(document_id);
create index if not exists idx_document_shares_token on public.document_shares(token);
create index if not exists idx_document_shares_expires on public.document_shares(expires_at);

alter table public.document_shares enable row level security;

create policy "document_shares_select_own_org"
  on public.document_shares for select
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid()
    )
  );

create policy "document_shares_insert_own_org"
  on public.document_shares for insert
  with check (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid()
      and role_id in (
        select id from public.roles where key in ('admin', 'client_admin', 'technician')
      )
    )
  );

create policy "document_shares_update_own_org"
  on public.document_shares for update
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid()
      and role_id in (
        select id from public.roles where key in ('admin', 'client_admin', 'technician')
      )
    )
  );

create policy "document_shares_delete_own_org"
  on public.document_shares for delete
  using (
    organization_id in (
      select organization_id from public.memberships
      where user_id = auth.uid()
      and role_id in (
        select id from public.roles where key in ('admin', 'client_admin', 'technician')
      )
    )
  );