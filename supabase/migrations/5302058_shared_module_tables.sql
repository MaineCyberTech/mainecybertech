-- Shared infrastructure tables for the 60-module roadmap
-- Used by: Approval Workflow Engine (#43), Internal MSP Business OS Dashboard (#20), and 20+ other modules

begin;

-- =========================================================
-- portal_module_settings: per-organization module configuration
-- =========================================================
create table if not exists portal_module_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, module_key)
);

create index if not exists idx_portal_module_settings_org on portal_module_settings(organization_id);

alter table portal_module_settings enable row level security;

create policy "portal_module_settings_select_org" on portal_module_settings for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "portal_module_settings_insert_admin" on portal_module_settings for insert
  with check (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = portal_module_settings.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

create policy "portal_module_settings_update_admin" on portal_module_settings for update
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = portal_module_settings.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- =========================================================
-- approval_requests: generic reusable approval engine (#43 and 20+ modules)
-- =========================================================
create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  request_type text not null,
  request_subject text not null,
  request_body text,
  request_metadata jsonb not null default '{}'::jsonb,
  source_module text,
  source_entity_type text,
  source_entity_id uuid,
  status text not null default 'pending',
  priority text not null default 'normal',
  requested_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  rejected_by uuid references auth.users(id),
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  due_at timestamptz,
  visibility text not null default 'internal',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_approval_requests_org on approval_requests(organization_id);
create index if not exists idx_approval_requests_status on approval_requests(status);
create index if not exists idx_approval_requests_type on approval_requests(request_type);
create index if not exists idx_approval_requests_requested_by on approval_requests(requested_by);
create index if not exists idx_approval_requests_assigned_to on approval_requests(assigned_to);
create index if not exists idx_approval_requests_due_at on approval_requests(due_at);

alter table approval_requests enable row level security;

create policy "approval_requests_select_org" on approval_requests for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "approval_requests_insert_auth" on approval_requests for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "approval_requests_update_org" on approval_requests for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "approval_requests_delete_admin" on approval_requests for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = approval_requests.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- =========================================================
-- ai_draft_outputs: AI-generated content with review gates
-- =========================================================
create table if not exists ai_draft_outputs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  prompt_key text,
  prompt_version text,
  draft_content jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  approved_content jsonb,
  source_entity_type text,
  source_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_draft_outputs_org on ai_draft_outputs(organization_id);
create index if not exists idx_ai_draft_outputs_status on ai_draft_outputs(status);
create index if not exists idx_ai_draft_outputs_module on ai_draft_outputs(module_key);

alter table ai_draft_outputs enable row level security;

create policy "ai_draft_outputs_select_org" on ai_draft_outputs for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "ai_draft_outputs_insert_auth" on ai_draft_outputs for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "ai_draft_outputs_update_org" on ai_draft_outputs for update
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

-- =========================================================
-- module_comments: reusable comments for any module entity
-- =========================================================
create table if not exists module_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  entity_type text not null,
  entity_id uuid not null,
  author_id uuid not null references auth.users(id),
  body text not null,
  is_internal boolean not null default false,
  is_edited boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_module_comments_entity on module_comments(entity_type, entity_id);
create index if not exists idx_module_comments_org on module_comments(organization_id);
create index if not exists idx_module_comments_author on module_comments(author_id);
create index if not exists idx_module_comments_module_entity on module_comments(module_key, entity_type, entity_id);

alter table module_comments enable row level security;

create policy "module_comments_select_org" on module_comments for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "module_comments_insert_auth" on module_comments for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "module_comments_update_own" on module_comments for update
  using (
    author_id = auth.uid()
    and organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "module_comments_delete_admin" on module_comments for delete
  using (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = module_comments.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

-- =========================================================
-- module_timeline_events: reusable audit timeline for any module entity
-- =========================================================
create table if not exists module_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_module_timeline_entity on module_timeline_events(entity_type, entity_id);
create index if not exists idx_module_timeline_org on module_timeline_events(organization_id);
create index if not exists idx_module_timeline_created on module_timeline_events(created_at desc);
create index if not exists idx_module_timeline_module_entity on module_timeline_events(module_key, entity_type, entity_id);

alter table module_timeline_events enable row level security;

create policy "module_timeline_events_select_org" on module_timeline_events for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "module_timeline_events_insert_auth" on module_timeline_events for insert
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

-- =========================================================
-- scheduled_check_results: shared results table for monitoring modules (#14, #28, #50, #51)
-- =========================================================
create table if not exists scheduled_check_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  check_type text not null,
  check_target text,
  status text not null default 'ok',
  result_data jsonb not null default '{}'::jsonb,
  error_message text,
  duration_ms integer,
  checked_at timestamptz not null default now(),
  next_check_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_scheduled_check_org_module on scheduled_check_results(organization_id, module_key);
create index if not exists idx_scheduled_check_status on scheduled_check_results(status);
create index if not exists idx_scheduled_check_checked_at on scheduled_check_results(checked_at desc);

alter table scheduled_check_results enable row level security;

create policy "scheduled_check_results_select_org" on scheduled_check_results for select
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "scheduled_check_results_insert_admin" on scheduled_check_results for insert
  with check (
    exists (
      select 1 from memberships m
      join roles r on m.role_id = r.id
      where m.user_id = auth.uid()
      and m.organization_id = scheduled_check_results.organization_id
      and r.key in ('super_admin', 'admin')
    )
  );

commit;
