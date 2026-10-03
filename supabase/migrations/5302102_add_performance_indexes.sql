-- Migration 5302102: Add performance indexes for search and common queries
-- Adds GIN trigram indexes for full-text search and composite indexes for common query patterns

begin;

-- Enable pg_trgm extension for fuzzy text search
create extension if not exists pg_trgm;

-- Full-text search indexes using GIN trigram
create index if not exists idx_profiles_full_name_trgm on public.profiles using gin (full_name gin_trgm_ops);
create index if not exists idx_profiles_email_trgm on public.profiles using gin (email gin_trgm_ops);
create index if not exists idx_organizations_name_trgm on public.organizations using gin (name gin_trgm_ops);
create index if not exists idx_tickets_title_trgm on public.tickets using gin (title gin_trgm_ops);
create index if not exists idx_tickets_description_trgm on public.tickets using gin (description gin_trgm_ops);
create index if not exists idx_projects_name_trgm on public.projects using gin (name gin_trgm_ops);
create index if not exists idx_projects_description_trgm on public.projects using gin (description gin_trgm_ops);

-- Composite indexes for common query patterns
create index if not exists idx_audit_logs_org_created on public.audit_logs (organization_id, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists idx_tickets_assigned_to on public.tickets (assigned_to);
create index if not exists idx_tickets_created_by on public.tickets (created_by);
create index if not exists idx_projects_created_by on public.projects (created_by);
create index if not exists idx_notifications_module on public.notifications (module, module_id);
create index if not exists idx_document_versions_document on public.document_versions (document_id, created_at desc);

commit;
