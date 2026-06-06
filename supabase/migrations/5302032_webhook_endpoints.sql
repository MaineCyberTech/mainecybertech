-- Webhook endpoint management

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  url text not null,
  secret text,
  events text[] not null default '{}',
  is_active boolean not null default true,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webhook_endpoints_org
  on public.webhook_endpoints (organization_id);

create trigger trg_webhook_endpoints_updated_at
before update on public.webhook_endpoints
for each row execute procedure public.set_updated_at();

alter table public.webhook_endpoints enable row level security;

create policy "webhook_endpoints_select_same_org"
on public.webhook_endpoints for select
using (
  public.is_super_admin()
  or public.is_org_approved_member(organization_id)
);

create policy "webhook_endpoints_manage_admins"
on public.webhook_endpoints for all
using (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'webhooks', 'manage')
)
with check (
  public.is_super_admin()
  or public.user_has_permission(organization_id, 'webhooks', 'manage')
);

-- Webhook delivery log
create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  event text not null,
  status text not null,
  request_body jsonb,
  response_status int,
  response_body text,
  error text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_webhook
  on public.webhook_deliveries (webhook_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

create policy "webhook_deliveries_select_same_org"
on public.webhook_deliveries for select
using (
  exists (
    select 1 from public.webhook_endpoints we
    where we.id = webhook_id
    and (public.is_super_admin() or public.is_org_approved_member(we.organization_id))
  )
);
