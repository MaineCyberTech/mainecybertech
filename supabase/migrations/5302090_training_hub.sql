create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text default 'security',
  difficulty text default 'beginner',
  estimated_minutes integer default 15,
  status text default 'draft',
  passing_score integer default 80,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_training_courses_org on public.training_courses (organization_id);
alter table public.training_courses enable row level security;
create policy "courses_org_select" on public.training_courses for select using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = training_courses.organization_id AND memberships.user_id = auth.uid()));
create policy "courses_org_insert" on public.training_courses for insert with check (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = training_courses.organization_id AND memberships.user_id = auth.uid()));
create policy "courses_org_update" on public.training_courses for update using (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = training_courses.organization_id AND memberships.user_id = auth.uid()));
create policy "courses_admin_delete" on public.training_courses for delete using (EXISTS (SELECT 1 FROM memberships m JOIN roles r ON m.role_id = r.id WHERE m.organization_id = training_courses.organization_id AND m.user_id = auth.uid() AND r.key = 'admin'));

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  title text not null,
  content text,
  lesson_type text default 'text',
  sort_order integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_training_lessons_course on public.training_lessons (course_id);
alter table public.training_lessons enable row level security;
create policy "lessons_org_select" on public.training_lessons for select using (EXISTS (SELECT 1 FROM training_courses tc JOIN memberships m ON m.organization_id = tc.organization_id WHERE tc.id = training_lessons.course_id AND m.user_id = auth.uid()));
create policy "lessons_org_insert" on public.training_lessons for insert with check (EXISTS (SELECT 1 FROM training_courses tc JOIN memberships m ON m.organization_id = tc.organization_id WHERE tc.id = training_lessons.course_id AND m.user_id = auth.uid()));
create policy "lessons_org_update" on public.training_lessons for update using (EXISTS (SELECT 1 FROM training_courses tc JOIN memberships m ON m.organization_id = tc.organization_id WHERE tc.id = training_lessons.course_id AND m.user_id = auth.uid()));
create policy "lessons_admin_delete" on public.training_lessons for delete using (EXISTS (SELECT 1 FROM training_courses tc JOIN memberships m ON m.role_id = (SELECT id FROM roles WHERE key = 'admin') WHERE tc.id = training_lessons.course_id AND m.organization_id = tc.organization_id AND m.user_id = auth.uid()));

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  user_id uuid not null,
  status text default 'enrolled',
  progress_percent integer default 0,
  completed_at timestamptz,
  enrolled_at timestamptz default now()
);
create index if not exists idx_training_enrollments_user on public.training_enrollments (user_id);
alter table public.training_enrollments enable row level security;
create policy "enrollments_own" on public.training_enrollments for select using (user_id = auth.uid());
create policy "enrollments_own_insert" on public.training_enrollments for insert with check (user_id = auth.uid());
create policy "enrollments_own_update" on public.training_enrollments for update using (user_id = auth.uid());
