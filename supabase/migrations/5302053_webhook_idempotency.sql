-- Add idempotency key to webhook_deliveries for deduplication
-- This allows clients to safely retry webhook deliveries without duplicate processing

alter table if exists public.webhook_deliveries
  add column if not exists idempotency_key text;

create index if not exists idx_webhook_deliveries_idempotency
  on public.webhook_deliveries (idempotency_key)
  where idempotency_key is not null;

-- Add unique constraint to prevent duplicate deliveries with same idempotency key
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'webhook_deliveries_idempotency_unique'
    and connamespace = (select oid from pg_namespace where nspname = 'public')
  ) then
    alter table public.webhook_deliveries
      add constraint webhook_deliveries_idempotency_unique
      unique (idempotency_key);
  end if;
end;
$$;