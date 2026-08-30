-- P0 fix (audit DATA-001 / RLS-001):
-- 5302055_cleanup_dead_tables.sql executed `drop table if exists public.document_permissions cascade;`
-- which cascaded to drop:
--   * public.can_read_document(uuid)         (SECURITY DEFINER, references document_permissions)
--   * documents_select_visibility_aligned    (SELECT policy on documents, depends on can_read_document)
--   * document_versions_select_visibility_aligned (depends on can_read_document)
--
-- This forward-fix restores all four objects idempotently. It is safe to apply
-- on both a fresh environment (table was dropped) and a prod DB where the
-- objects may still exist (all statements are IF NOT EXISTS / IF EXISTS guarded).
--
-- Note: the original table FKs (document_id -> documents, user_id -> auth.users,
-- role_id -> roles) all already had ON DELETE CASCADE; they are re-created
-- identically so deleting a parent document/user/role removes child rows.

-- 1. Restore the document_permissions table (original shape from 5302026)
create table if not exists public.document_permissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_share boolean not null default false
);

create index if not exists idx_document_permissions_document_id
  on public.document_permissions (document_id);

-- FK lookup indexes for the other two FK columns (user_id, role_id)
create index if not exists idx_document_permissions_user_id
  on public.document_permissions (user_id);
create index if not exists idx_document_permissions_role_id
  on public.document_permissions (role_id);

alter table public.document_permissions enable row level security;

-- 2. Restore can_read_document() (identical body to 5302026 bootstrap)
create or replace function public.can_read_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and (
        public.is_super_admin()

        or d.visibility = 'public'::public.document_visibility

        or (
          d.visibility = 'org'::public.document_visibility
          and public.is_org_approved_member(d.organization_id)
        )

        or (
          d.visibility = 'internal'::public.document_visibility
          and (
            d.uploaded_by = auth.uid()
            or public.user_has_permission(d.organization_id, 'documents', 'manage')
            or public.user_has_role(d.organization_id, array['admin', 'super_admin', 'technician'])
          )
        )

        or (
          d.visibility = 'private'::public.document_visibility
          and (
            d.uploaded_by = auth.uid()
            or exists (
              select 1
              from public.document_permissions dp
              where dp.document_id = d.id
                and dp.user_id = auth.uid()
                and dp.can_view = true
            )
            or exists (
              select 1
              from public.document_permissions dp
              join public.memberships m
                on m.organization_id = d.organization_id
               and m.user_id = auth.uid()
               and m.role_id = dp.role_id
               and m.status = 'approved'
              where dp.document_id = d.id
                and dp.can_view = true
            )
            or public.user_has_permission(d.organization_id, 'documents', 'manage')
          )
        )
      )
  );
$$;

-- 3. Restore the documents SELECT policy (was dropped by the cascade)
drop policy if exists documents_select_visibility_aligned on public.documents;
create policy documents_select_visibility_aligned
on public.documents
for select
to authenticated
using (
  public.can_read_document(id)
);

-- 4. Restore the document_versions SELECT policy (was dropped by the cascade)
drop policy if exists document_versions_select_visibility_aligned on public.document_versions;
create policy document_versions_select_visibility_aligned
on public.document_versions
for select
to authenticated
using (
  public.can_read_document(document_id)
);

-- 5. Restore document_permissions RLS policies (original shape from 5302026)
drop policy if exists document_permissions_select_admins on public.document_permissions;
create policy document_permissions_select_admins
on public.document_permissions
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
);

drop policy if exists document_permissions_manage_admins on public.document_permissions;
create policy document_permissions_manage_admins
on public.document_permissions
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.documents d
    where d.id = document_permissions.document_id
      and public.user_has_permission(d.organization_id, 'documents', 'manage')
  )
);
