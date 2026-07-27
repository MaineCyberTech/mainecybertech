-- Client Satisfaction Pulse Widget (Module #6 / #38)
-- CSAT/NPS-style pulse surveys tied to tickets, projects, QBRs, onboarding milestones, and follow-ups.

begin;

-- =========================================================
-- satisfaction_pulses: CSAT/NPS pulse surveys
-- =========================================================
create table if not exists satisfaction_pulses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subject text not null,
  question text,
  rating integer default 5,
  feedback text,
  source text default 'ticket',
  source_entity_id uuid,
  source_entity_type text,
  sent_at timestamptz,
  responded_at timestamptz,
  status text not null default 'pending',
  respondent_user_id uuid references auth.users(id),
  respondent_organization_id uuid references organizations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_satisfaction_pulses_org on satisfaction_pulses(organization_id);
create index if not exists idx_satisfaction_pulses_status on satisfaction_pulses(status);
create index if not exists idx_satisfaction_pulses_source on satisfaction_pulses(source, source_entity_id);
create index if not exists idx_satisfaction_pulses_respondent on satisfaction_pulses(respondent_user_id);
create index if not exists idx_satisfaction_pulses_sent_at on satisfaction_pulses(sent_at desc);

alter table satisfaction_pulses enable row level security;

create policy "satisfaction_pulses_select_org" on satisfaction_pulses for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulses_insert_auth" on satisfaction_pulses for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulses_update_org" on satisfaction_pulses for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulses_delete_admin" on satisfaction_pulses for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = satisfaction_pulses.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- =========================================================
-- satisfaction_pulse_templates: Reusable survey templates
-- =========================================================
create table if not exists satisfaction_pulse_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'csat',
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_satisfaction_pulse_templates_org on satisfaction_pulse_templates(organization_id);
create index if not exists idx_satisfaction_pulse_templates_active on satisfaction_pulse_templates(is_active);

alter table satisfaction_pulse_templates enable row level security;

create policy "satisfaction_pulse_templates_select_org" on satisfaction_pulse_templates for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulse_templates_insert_auth" on satisfaction_pulse_templates for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulse_templates_update_org" on satisfaction_pulse_templates for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulse_templates_delete_admin" on satisfaction_pulse_templates for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = satisfaction_pulse_templates.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- =========================================================
-- satisfaction_pulse_schedules: Automated pulse scheduling
-- =========================================================
create table if not exists satisfaction_pulse_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_id uuid references satisfaction_pulse_templates(id) on delete set null,
  name text not null,
  trigger_type text not null default 'ticket_closed',
  trigger_config jsonb not null default '{}'::jsonb,
  frequency text,
  cron_expression text,
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_satisfaction_pulse_schedules_org on satisfaction_pulse_schedules(organization_id);
create index if not exists idx_satisfaction_pulse_schedules_active on satisfaction_pulse_schedules(is_active);
create index if not exists idx_satisfaction_pulse_schedules_next_run on satisfaction_pulse_schedules(next_run_at);

alter table satisfaction_pulse_schedules enable row level security;

create policy "satisfaction_pulse_schedules_select_org" on satisfaction_pulse_schedules for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulse_schedules_insert_auth" on satisfaction_pulse_schedules for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulse_schedules_update_org" on satisfaction_pulse_schedules for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "satisfaction_pulse_schedules_delete_admin" on satisfaction_pulse_schedules for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = satisfaction_pulse_schedules.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

commit;