-- Add soft-delete columns to tickets, projects, and documents

alter table if exists public.tickets
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table if exists public.projects
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table if exists public.documents
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists idx_tickets_deleted_at on public.tickets(deleted_at);
create index if not exists idx_projects_deleted_at on public.projects(deleted_at);
create index if not exists idx_documents_deleted_at on public.documents(deleted_at);