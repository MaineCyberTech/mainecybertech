-- Vendor Contract Renewal Calendar (#34) + Vendor Contact Escalation Directory (#48)
begin;

create table if not exists vendor_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vendor_name text not null,
  service_name text not null,
  contract_number text,
  start_date date,
  end_date date,
  renewal_date date,
  contract_value numeric(12,2),
  billing_frequency text default 'annual',
  auto_renews boolean default false,
  renewal_notice_days integer default 60,
  status text not null default 'active',
  contract_type text default 'software',
  primary_contact_id uuid references auth.users(id),
  owner_user_id uuid references auth.users(id),
  notes text,
  visibility text not null default 'internal',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendor_contracts_org on vendor_contracts(organization_id);
create index if not exists idx_vendor_contracts_renewal on vendor_contracts(renewal_date);
create index if not exists idx_vendor_contracts_end_date on vendor_contracts(end_date);
create index if not exists idx_vendor_contracts_status on vendor_contracts(status);

alter table vendor_contracts enable row level security;
create policy "vendor_contracts_select_org" on vendor_contracts for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "vendor_contracts_insert_auth" on vendor_contracts for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "vendor_contracts_update_org" on vendor_contracts for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "vendor_contracts_delete_admin" on vendor_contracts for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = vendor_contracts.organization_id and r.key in ('super_admin', 'admin')));

create table if not exists vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vendor_name text not null,
  contact_name text,
  role_title text,
  email text,
  phone text,
  support_portal_url text,
  account_number text,
  escalation_path text,
  notes text,
  is_primary boolean default false,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendor_contacts_org on vendor_contacts(organization_id);
create index if not exists idx_vendor_contacts_vendor on vendor_contacts(vendor_name);

alter table vendor_contacts enable row level security;
create policy "vendor_contacts_select_org" on vendor_contacts for select using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "vendor_contacts_insert_auth" on vendor_contacts for insert with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "vendor_contacts_update_org" on vendor_contacts for update using (organization_id in (select organization_id from memberships where user_id = auth.uid()));
create policy "vendor_contacts_delete_admin" on vendor_contacts for delete using (exists (select 1 from memberships m join roles r on m.role_id = r.id where m.user_id = auth.uid() and m.organization_id = vendor_contacts.organization_id and r.key in ('super_admin', 'admin')));

commit;
