-- Migration 5302456: search prefix/trigram indexes + generated tsvector columns
--
-- SEARCH-P2-006: the global search routes build ILIKE predicates against
-- organizations.slug, documents.name/mime_type and tickets/projects
-- descriptions. 5302102 added trigram GIN indexes for profiles.full_name/email,
-- organizations.name and tickets/projects title/name/description, but left
-- slug and the document columns unindexed and provided no ranked full-text
-- path. This migration:
--   1. adds btree indexes for the prefix-only columns (slug/name/full_name),
--   2. adds trigram GIN indexes for the wildcard-searched columns that had
--      none (organizations.slug, documents.name, documents.mime_type),
--   3. adds stored generated tsvector columns + GIN indexes; the search routes
--      now OR a `wfts(english)` branch (websearch_to_tsquery) onto the
--      existing ILIKE predicates so stemmed word matches hit the index.
-- `to_tsvector(regconfig, text)` with a literal config is immutable, so it is
-- valid in a generated column.

begin;

create extension if not exists pg_trgm;

-- 1. Prefix searches (`col ilike 'term%'`): btree for exact matches and
--    prefix/ordering plans.
create index if not exists idx_organizations_slug_btree on public.organizations (slug);
create index if not exists idx_organizations_name_btree on public.organizations (name);
create index if not exists idx_profiles_full_name_btree on public.profiles (full_name);

-- 2. Wildcard searches (`col ilike '%term%'`): trigram GIN for the columns
--    that were searched without an index.
create index if not exists idx_organizations_slug_trgm
  on public.organizations using gin (slug gin_trgm_ops);
create index if not exists idx_documents_name_trgm
  on public.documents using gin (name gin_trgm_ops);
create index if not exists idx_documents_mime_type_trgm
  on public.documents using gin (mime_type gin_trgm_ops);

-- 3. Full-text search: stored generated tsvector + GIN.
alter table public.tickets
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;
create index if not exists idx_tickets_search_vector
  on public.tickets using gin (search_vector);

alter table public.projects
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;
create index if not exists idx_projects_search_vector
  on public.projects using gin (search_vector);

alter table public.documents
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(mime_type, ''))
  ) stored;
create index if not exists idx_documents_search_vector
  on public.documents using gin (search_vector);

commit;
