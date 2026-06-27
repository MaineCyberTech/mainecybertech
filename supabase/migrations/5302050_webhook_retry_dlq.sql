-- Webhook retry and dead letter queue support
-- Adds retry tracking columns to webhook_deliveries and creates webhook_dead_letters table

-- Add retry columns to webhook_deliveries
alter table if exists public.webhook_deliveries
  add column if not exists retry_count int not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists dead_letter boolean not null default false;

-- Create dead letter queue table
create table if not exists public.webhook_dead_letters (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  event text not null,
  request_body jsonb,
  last_error text,
  attempt_count int not null,
  last_attempt_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_dead_letters_webhook
  on public.webhook_dead_letters (webhook_id, created_at desc);

alter table public.webhook_dead_letters enable row level security;

create policy "webhook_dead_letters_select_same_org"
on public.webhook_dead_letters for select
using (
  exists (
    select 1 from public.webhook_endpoints we
    where we.id = webhook_id
    and (public.is_super_admin() or public.is_org_approved_member(we.organization_id))
  )
);

create policy "webhook_dead_letters_insert_service"
on public.webhook_dead_letters for insert
with check (
  exists (
    select 1 from public.webhook_endpoints we
    where we.id = webhook_id
    and (public.is_super_admin() or public.user_has_permission(we.organization_id, 'webhooks', 'manage'))
  )
);

create policy "webhook_dead_letters_update_service"
on public.webhook_dead_letters for update
using (
  exists (
    select 1 from public.webhook_endpoints we
    where we.id = webhook_id
    and (public.is_super_admin() or public.user_has_permission(we.organization_id, 'webhooks', 'manage'))
  )
)
with check (
  exists (
    select 1 from public.webhook_endpoints we
    where we.id = webhook_id
    and (public.is_super_admin() or public.user_has_permission(we.organization_id, 'webhooks', 'manage'))
  )
);