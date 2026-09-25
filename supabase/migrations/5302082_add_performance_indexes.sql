-- Performance indexes for user_id and document_id lookups
-- These columns are queried frequently but lack dedicated indexes

-- Notifications: every user-scoped query filters on user_id
-- Existing idx_notifications_org covers organization_id only
create index if not exists idx_notifications_user
  on public.notifications (user_id, created_at desc);

-- Document shares: lookup by document_id is the primary access pattern
-- Existing idx_document_shares_org covers organization_id only
create index if not exists idx_document_shares_document
  on public.document_shares (document_id);
