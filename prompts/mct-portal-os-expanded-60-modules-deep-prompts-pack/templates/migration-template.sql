begin;
create table if not exists public.replace_module_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  visibility text not null default 'internal',
  risk_level text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.replace_module_records enable row level security;
commit;
