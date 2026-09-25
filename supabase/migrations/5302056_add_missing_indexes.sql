-- Missing performance indexes

create index if not exists idx_notifications_org
  on public.notifications (organization_id, created_at desc);

create index if not exists idx_billing_customers_org
  on public.billing_customers (organization_id);

create index if not exists idx_document_shares_org
  on public.document_shares (organization_id);
