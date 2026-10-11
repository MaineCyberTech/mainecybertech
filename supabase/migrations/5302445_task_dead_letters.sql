-- Task dead-letter queue (RES-P2-002).
--
-- Generic (non-webhook) task failures were previously only logged: after
-- BullMQ's retry attempts were exhausted the job fell out of Redis and
-- operators could not see or replay what failed. The worker writes a row here
-- when a job exhausts its attempts, and increments
-- worker_task_dead_letters_total so the alert path fires.

create table if not exists public.task_dead_letters (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  payload jsonb not null default '{}'::jsonb,
  error text,
  attempts int not null default 0,
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_task_dead_letters_type_created
  on public.task_dead_letters (task_type, created_at desc);

-- RLS is enabled with no permissive policies (deny-all for anon/authenticated):
-- the worker writes with the service-role key (which bypasses RLS) and there
-- is no user-facing API yet.
-- rls: deny-all
alter table public.task_dead_letters enable row level security;
