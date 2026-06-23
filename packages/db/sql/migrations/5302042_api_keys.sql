-- API keys for programmatic access
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  permissions jsonb not null default '[]'::jsonb,
  created_by uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz,
  last_used_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_keys_org on api_keys(organization_id);
create index if not exists idx_api_keys_prefix on api_keys(key_prefix);

alter table api_keys enable row level security;

create policy "api_keys_select_org" on api_keys for select
  using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
    )
  );

create policy "api_keys_insert_admin" on api_keys for insert
  with check (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = api_keys.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

create policy "api_keys_update_admin" on api_keys for update
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = api_keys.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

create policy "api_keys_delete_admin" on api_keys for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = api_keys.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );
