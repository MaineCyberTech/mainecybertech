-- Client Asset Warranty Tracker (#9)
-- Asset register with warranties, replacement planning, lifecycle scoring
begin;

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  asset_type text not null default 'hardware',
  make text,
  model text,
  serial_number text,
  asset_tag text,
  qr_label text,
  status text not null default 'active',
  visibility text not null default 'internal',
  location text,
  site text,
  purchase_date date,
  purchase_price numeric(12,2),
  warranty_expires date,
  replacement_recommended date,
  lifecycle_score integer default 100,
  owner_user_id uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  maintenance_notes text,
  supported_until date,
  vendor_support_status text default 'supported',
  ip_address text,
  mac_address text,
  operating_system text,
  contract_reference text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assets_org on assets(organization_id);
create index if not exists idx_assets_status on assets(status);
create index if not exists idx_assets_type on assets(asset_type);
create index if not exists idx_assets_warranty_expires on assets(warranty_expires);
create index if not exists idx_assets_replacement on assets(replacement_recommended);
create index if not exists idx_assets_tag on assets(asset_tag);

alter table assets enable row level security;

create policy "assets_select_org" on assets for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "assets_insert_auth" on assets for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "assets_update_org" on assets for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "assets_delete_admin" on assets for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = assets.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

commit;
