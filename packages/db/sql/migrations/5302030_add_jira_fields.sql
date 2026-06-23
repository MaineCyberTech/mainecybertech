-- Add Jira/JSM sync fields to projects, project_tasks, and tickets

-- =========================================================
-- projects: track Jira sync state
-- =========================================================
alter table public.projects
  add column if not exists jira_last_synced_at timestamptz;

-- =========================================================
-- project_tasks: add Jira field parity
-- =========================================================
alter table public.project_tasks
  add column if not exists issue_type text,
  add column if not exists priority text not null default 'normal',
  add column if not exists labels text[],
  add column if not exists parent_task_id uuid references public.project_tasks(id) on delete set null,
  add column if not exists epic_key text,
  add column if not exists resolution text,
  add column if not exists sprint text,
  add column if not exists jira_last_synced_at timestamptz;

create index if not exists idx_project_tasks_issue_type
  on public.project_tasks (issue_type);
create index if not exists idx_project_tasks_priority
  on public.project_tasks (priority);
create index if not exists idx_project_tasks_parent
  on public.project_tasks (parent_task_id);
create index if not exists idx_project_tasks_epic
  on public.project_tasks (epic_key);
create index if not exists idx_project_tasks_sprint
  on public.project_tasks (sprint);
create index if not exists idx_project_tasks_jira_synced
  on public.project_tasks (jira_last_synced_at);

-- =========================================================
-- tickets: add JSM field parity
-- =========================================================
alter table public.tickets
  add column if not exists labels text[],
  add column if not exists resolution text,
  add column if not exists jira_last_synced_at timestamptz;

create index if not exists idx_tickets_labels
  on public.tickets using gin (labels);
create index if not exists idx_tickets_jira_synced
  on public.tickets (jira_last_synced_at);

-- =========================================================
-- Fix: The ticket_status enum is missing 'open' which jsm-sync.ts
-- was trying to use. Add it so create/update don't fail.
-- =========================================================
alter type public.ticket_status add value if not exists 'open' after 'triaged';
