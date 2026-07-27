create table if not exists public.dmarc_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain text not null,
  dmarc_record text,
  spf_record text,
  dkim_record text,
  dmarc_policy text,
  alignment_mode text,
  pct integer,
  overall_grade text,
  issues jsonb default '[]',
  recommendations jsonb default '[]',
  analyzed_at timestamptz default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_dmarc_analyses_org on public.dmarc_analyses (organization_id);
alter table public.dmarc_analyses enable row level security;
create policy "dmarc_org_select" on public.dmarc_analyses for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = dmarc_analyses.organization_id AND memberships.user_id = auth.uid()));
create policy "dmarc_org_insert" on public.dmarc_analyses for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = dmarc_analyses.organization_id AND memberships.user_id = auth.uid()));
create policy "dmarc_org_update" on public.dmarc_analyses for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = dmarc_analyses.organization_id AND memberships.user_id = auth.uid()));
create policy "dmarc_admin_delete" on public.dmarc_analyses for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = dmarc_analyses.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));
