-- DNS Domain Cloudflare Health Monitor (#14)
begin;

create table if not exists domain_monitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  domain text not null,
  display_name text,
  zone_id text,
  nameservers jsonb default '[]'::jsonb,
  ssl_expires date,
  ssl_issuer text,
  ssl_valid boolean default true,
  spf_status text default 'unknown',
  dkim_status text default 'unknown',
  dmarc_status text default 'unknown',
  dmarc_policy text,
  dns_provider text default 'cloudflare',
  cloudflare_proxied boolean default true,
  nameserver_mismatch boolean default false,
  last_checked_at timestamptz,
  next_check_at timestamptz,
  check_interval_hours integer default 24,
  alerts_enabled boolean default true,
  owner_user_id uuid references auth.users(id),
  status text not null default 'active',
  visibility text not null default 'internal',
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_domain_monitors_org on domain_monitors(organization_id);
create index if not exists idx_domain_monitors_domain on domain_monitors(domain);
create index if not exists idx_domain_monitors_ssl_expires on domain_monitors(ssl_expires);
create index if not exists idx_domain_monitors_next_check on domain_monitors(next_check_at);

alter table domain_monitors enable row level security;

create policy "domain_monitors_select_org" on domain_monitors for select
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "domain_monitors_insert_auth" on domain_monitors for insert
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "domain_monitors_update_org" on domain_monitors for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()));

create policy "domain_monitors_delete_admin" on domain_monitors for delete
  using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = domain_monitors.organization_id and r.key in ('super_admin', 'admin')));

commit;
