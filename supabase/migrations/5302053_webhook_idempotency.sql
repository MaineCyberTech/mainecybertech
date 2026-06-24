-- Add idempotency key to webhook_deliveries for deduplication
-- This allows clients to safely retry webhook deliveries without duplicate processing

alter table if exists public.webhook_deliveries
  add column if not exists idempotency_key text;

create index if not exists idx_webhook_deliveries_idempotency
  on public.webhook_deliveries (idempotency_key)
  where idempotency_key is not null;

-- Add unique constraint to prevent duplicate deliveries with same idempotency key
alter table if exists public.webhook_deliveries
  add constraint if not exists webhook_deliveries_idempotency_unique
  unique (idempotency_key);