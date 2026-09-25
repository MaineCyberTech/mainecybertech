create table if not exists public.sop_library (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  sop_category text not null default 'general',
  compliance_framework text,
  framework_control_ids text[] default '{}',
  status text not null default 'draft',
  review_cycle_days integer default 90,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  owner_user_id uuid references auth.users(id),
  document_url text,
  tags text[] default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_sop_library_org on public.sop_library (organization_id);
create index if not exists idx_sop_library_status on public.sop_library (status);
alter table public.sop_library enable row level security;
create policy "sop_library_org_select" on public.sop_library for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = sop_library.organization_id AND memberships.user_id = auth.uid()));
create policy "sop_library_org_insert" on public.sop_library for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = sop_library.organization_id AND memberships.user_id = auth.uid()));
create policy "sop_library_org_update" on public.sop_library for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = sop_library.organization_id AND memberships.user_id = auth.uid()));
create policy "sop_library_admin_delete" on public.sop_library for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = sop_library.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));
