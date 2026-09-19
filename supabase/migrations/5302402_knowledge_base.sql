-- Client Knowledge Base (GAP module 17) backend table.
-- Idempotent: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS guards.

create table if not exists public.knowledge_base_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  body text not null,
  category text,
  tags text[],
  is_published boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_base_articles_organization_id_idx
  on public.knowledge_base_articles (organization_id);

create index if not exists knowledge_base_articles_category_idx
  on public.knowledge_base_articles (category);

alter table public.knowledge_base_articles enable row level security;

drop policy if exists "knowledge_base_articles_select_org" on public.knowledge_base_articles;
create policy "knowledge_base_articles_select_org" on public.knowledge_base_articles
  for select using (public.is_org_member(organization_id));

drop policy if exists "knowledge_base_articles_insert_org" on public.knowledge_base_articles;
create policy "knowledge_base_articles_insert_org" on public.knowledge_base_articles
  for insert with check (public.is_org_member(organization_id));

drop policy if exists "knowledge_base_articles_update_org" on public.knowledge_base_articles;
create policy "knowledge_base_articles_update_org" on public.knowledge_base_articles
  for update using (public.is_org_member(organization_id));

drop policy if exists "knowledge_base_articles_delete_org" on public.knowledge_base_articles;
create policy "knowledge_base_articles_delete_org" on public.knowledge_base_articles
  for delete using (
    exists (
      select 1 from public.memberships m
      join public.roles r on m.role_id = r.id
      where m.organization_id = knowledge_base_articles.organization_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
        and r.key in ('admin', 'super_admin')
    )
  );
