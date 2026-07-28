create table if not exists public.insurance_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_type text not null default 'document',
  title text not null,
  description text,
  file_url text,
  status text default 'pending',
  coverage_area text,
  insurance_provider text,
  policy_number text,
  expiry_date date,
  last_verified_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns that may not exist (table was created by 5302073 without these)
alter table public.insurance_evidence add column if not exists evidence_type text not null default 'document';
alter table public.insurance_evidence add column if not exists title text not null default '';
alter table public.insurance_evidence add column if not exists description text;
alter table public.insurance_evidence add column if not exists file_url text;
alter table public.insurance_evidence add column if not exists status text default 'pending';
alter table public.insurance_evidence add column if not exists coverage_area text;
alter table public.insurance_evidence add column if not exists insurance_provider text;
alter table public.insurance_evidence add column if not exists policy_number text;
alter table public.insurance_evidence add column if not exists expiry_date date;
alter table public.insurance_evidence add column if not exists last_verified_at timestamptz;

create index if not exists idx_insurance_evidence_org on public.insurance_evidence (organization_id);
create index if not exists idx_insurance_evidence_coverage on public.insurance_evidence (coverage_area);
alter table public.insurance_evidence enable row level security;
create policy "insurance_org_select" on public.insurance_evidence for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = insurance_evidence.organization_id AND memberships.user_id = auth.uid()));
create policy "insurance_org_insert" on public.insurance_evidence for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = insurance_evidence.organization_id AND memberships.user_id = auth.uid()));
create policy "insurance_org_update" on public.insurance_evidence for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = insurance_evidence.organization_id AND memberships.user_id = auth.uid()));
create policy "insurance_admin_delete" on public.insurance_evidence for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = insurance_evidence.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));
