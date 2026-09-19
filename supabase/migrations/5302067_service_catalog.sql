-- Client Billing Service Catalog (#56)
begin;

create table if not exists service_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  category text default 'managed_services',
  billing_model text default 'monthly',
  unit text default 'per_user',
  base_price numeric(12,2) default 0,
  included_units integer,
  overture_rate numeric(12,2),
  is_bundled boolean default false,
  bundle_id uuid references service_catalog(id),
  is_active boolean default true,
  status text not null default 'active',
  visibility text not null default 'internal',
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_catalog_org on service_catalog(organization_id);
create index if not exists idx_service_catalog_category on service_catalog(category);
create index if not exists idx_service_catalog_active on service_catalog(is_active);

alter table service_catalog enable row level security;
create policy "service_catalog_select_org" on service_catalog for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "service_catalog_insert_auth" on service_catalog for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "service_catalog_update_org" on service_catalog for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "service_catalog_delete_admin" on service_catalog for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = service_catalog.organization_id and r.key in ('super_admin', 'admin')));

commit;
