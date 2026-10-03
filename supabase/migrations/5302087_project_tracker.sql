create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planned',
  start_date date,
  end_date date,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_project_phases_project on public.project_phases (project_id);
alter table public.project_phases enable row level security;

create policy "Project phases select by org membership"
  on public.project_phases for select
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_phases.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project phases insert by org membership"
  on public.project_phases for insert
  with check (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_phases.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project phases update by org membership"
  on public.project_phases for update
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_phases.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project phases delete by org membership"
  on public.project_phases for delete
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_phases.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  completed_at timestamptz,
  status text not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_project_milestones_project on public.project_milestones (project_id);
alter table public.project_milestones enable row level security;

create policy "Project milestones select by org membership"
  on public.project_milestones for select
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_milestones.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project milestones insert by org membership"
  on public.project_milestones for insert
  with check (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_milestones.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project milestones update by org membership"
  on public.project_milestones for update
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_milestones.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project milestones delete by org membership"
  on public.project_milestones for delete
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_milestones.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create table if not exists public.project_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  depends_on_task_id uuid,
  depends_on_milestone_id uuid references public.project_milestones(id) on delete set null,
  blocked_by_project_id uuid references public.projects(id) on delete set null,
  dependency_type text default 'finish_to_start',
  created_at timestamptz default now()
);
create index if not exists idx_project_dependencies_project on public.project_dependencies (project_id);
alter table public.project_dependencies enable row level security;

create policy "Project dependencies select by org membership"
  on public.project_dependencies for select
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_dependencies.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project dependencies insert by org membership"
  on public.project_dependencies for insert
  with check (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_dependencies.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project dependencies update by org membership"
  on public.project_dependencies for update
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_dependencies.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );

create policy "Project dependencies delete by org membership"
  on public.project_dependencies for delete
  using (
    exists (
      select 1 from public.projects p
      join public.memberships m on m.organization_id = p.organization_id and m.user_id = auth.uid()
      where p.id = project_dependencies.project_id and m.status = 'approved'
    )
    or (select auth.jwt() -> 'app_metadata' ->> 'is_super_admin') = 'true'
  );
